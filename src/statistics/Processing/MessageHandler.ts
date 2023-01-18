import type {NodeMessage, NodeMessageInFlow} from 'node-red';
import type {Processor} from './Processor';
import type {ProcessingResult} from './ProcessingResult';
import type {InputDefinition} from './InputDefinition';
import type {Output} from './Output';
import type {Message} from './Message';
import type {ProcessorFactory} from '../ProcessorFactory';
import type {Node, NodeAPI} from '@node-red/registry';

interface InternalMessage extends Message {
    send: (message: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void,
    done: (error?: Error) => void,
}

const isNumeric = function(str: any) {
    if (typeof str === 'number') {
        return true;
    }

    if (typeof str !== 'string') {
        return false;
    }

    return ! isNaN(<number>(<unknown>str)) && ! isNaN(parseFloat(str));
};

export class MessageHandler {
    private pendingMessages: Array<InternalMessage> = [];
    private activeMessagePromise: Promise<((message: (InternalMessage | void)) => any) | void> | null = null;
    private RED: NodeAPI;
    private node: Node;
    private processorFactory: ProcessorFactory;

    constructor(RED: NodeAPI, node: Node, processorFactory: ProcessorFactory) {
        this.RED = RED;
        this.node = node;
        this.processorFactory = processorFactory;
    }

    handle(msg: NodeMessageInFlow, send: (message: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void, done: (error?: Error) => void) {
        let internalMessage: InternalMessage = {
            data: msg,
            timestamp: new Date().getTime(),
            send: send,
            done: done,
        };

        this.pendingMessages.push(internalMessage);
        if (this.activeMessagePromise !== null) {
            return;
        }

        this.processMessageQueue();
    };

    private processMessageQueue() {
        const self = this;

        if (self.pendingMessages.length === 0) {
            self.activeMessagePromise = null;
            return;
        }

        let nextMessage: InternalMessage | null = null;
        while (self.pendingMessages.length > 0) {
            let item = self.pendingMessages.shift();
            if (typeof item !== 'undefined') {
                nextMessage = item;
                break;
            }
        }

        if (nextMessage) {
            this.activeMessagePromise = self.processMessage(nextMessage)
                .then(() => {
                    self.activeMessagePromise = null;
                    self.processMessageQueue();
                })
                .catch((error) => {
                    if (nextMessage) {
                        if (error instanceof Error) {
                            nextMessage.done(error);
                            self.node.status({
                                fill: 'red',
                                shape: 'dot',
                                text: error.message,
                            });
                        } else {
                            nextMessage.done();
                            self.node.status({
                                fill: 'red',
                                shape: 'dot',
                                text: 'error',
                            });
                        }
                    }

                    self.activeMessagePromise = null;
                    self.processMessageQueue();
                });
        }
    };

    private processMessage(message: InternalMessage) {
        const self = this;

        return new Promise<void>((resolve, reject) => {
            let possibleProcessor = self.processorFactory.build(message);
            if (possibleProcessor === null) {
                resolve();

                return;
            }

            let processor: Processor = possibleProcessor;

            self.readInputValues(processor.defineInputs(), message)
                .then((values: Array<any>) => processor.process(values, message))
                .then((result: ProcessingResult) => self.writeOutputValues(result, message))
                .then((result: ProcessingResult) => self.sendMessages(result, message))
                .then(function(result: ProcessingResult) {
                    resolve();
                    self.updateStatus(result);
                })
                .catch((error: Error) => reject(error));
        });
    };

    private readInputValues(values: Array<InputDefinition>, message: InternalMessage): Promise<Array<any>> {
        const self = this;
        let promises = [];

        for (let value of values) {
            let generator = function(source: string, property: string, type: string): Promise<any> {
                return new Promise<any>((resolve, reject) => {
                    self.RED.util.evaluateNodeProperty(property, source, self.node, message.data, (error: Error | null, value: any) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        if (type === 'number') {
                            if (! isNumeric(value)) {
                                reject(new Error(self.RED._('binsoul-statistics.status.invalidInputValue')));
                                return;
                            }

                            value = Number(value);
                        }

                        resolve(value);
                    });
                });
            };

            promises.push(generator(value.source, value.property, value.type));
        }

        return Promise.all(promises);
    };

    private writeOutputValues(result: ProcessingResult, message: InternalMessage): Promise<ProcessingResult> {
        const self = this;

        let promises = [];

        if (result.outputs === null) {
            return Promise.resolve(result);
        }

        for (let output of result.outputs) {
            if (output === null) {
                continue;
            }

            let generator = function(output: Output, msg: NodeMessage): Promise<void> {
                let message: NodeMessage = msg;
                if (output.target === 'msg') {
                    message = self.RED.util.cloneMessage(msg);
                }

                output.message = message;

                return self.setOutputValue(output.value, output.target, output.property, output.message);
            };

            promises.push(generator(output, message.data));
        }

        let allPromises = Promise.all(promises);
        return new Promise<ProcessingResult>((resolve, reject) => {
            allPromises
                .then(() => resolve(result))
                .catch((error) => reject(error));
        });
    };

    private setOutputValue(value: any, type: string, property: string, msg: NodeMessage) {
        const self = this;

        return new Promise<void>((resolve, reject) => {
            if (type === 'msg') {
                try {
                    if (! self.RED.util.setMessageProperty(msg, property, value, true)) {
                        reject(new Error('Failed to set output value.'));

                        return;
                    }

                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else if (type === 'flow' || type === 'global') {
                let target = self.node.context()[type];
                let callback = (err: Error) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                };

                let contextKey = self.RED.util.parseContextStore(property);
                if (/\[msg/.test(contextKey.key)) {
                    let key = [];
                    let parts = self.RED.util.normalisePropertyExpression(contextKey.key);
                    for (let part of parts) {
                        key.push('' + part);
                    }

                    target.set(key, value, contextKey.store, callback);
                } else {
                    target.set(contextKey.key, value, contextKey.store, callback);
                }

            } else {
                reject(new Error('Unknown type ' + type + '.'));
            }
        });
    }

    private sendMessages(result: ProcessingResult, message: InternalMessage): ProcessingResult {
        let messages: Array<NodeMessage | null> | null = null;
        if (result.outputs !== null) {
            messages = [];
            for (let output of result.outputs) {
                if (output === null || ! output.sendMessage) {
                    messages.push(null);
                } else {
                    messages.push(output.message);
                }
            }
        }

        if (messages !== null) {
            message.send(messages);
        }

        message.done();

        return result;
    };

    private updateStatus(result: ProcessingResult) {
        if (result.nodeStatus !== null) {
            this.node.status(result.nodeStatus);
        }
    };
}
