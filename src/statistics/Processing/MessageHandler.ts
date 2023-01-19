import type {NodeMessage, NodeMessageInFlow} from 'node-red';
import type {Action} from './Action';
import type {Result} from './Result';
import type {InputDefinition, InputItem} from './InputDefinition';
import type {Output} from './Output';
import type {Message} from './Message';
import type {ActionFactory} from './ActionFactory';
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
    private actionFactory: ActionFactory;

    constructor(RED: NodeAPI, node: Node, actionFactory: ActionFactory) {
        this.RED = RED;
        this.node = node;
        this.actionFactory = actionFactory;
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
            let possibleAction = self.actionFactory.build(message);
            if (possibleAction === null) {
                resolve();

                return;
            }

            let action: Action = possibleAction;

            self.readInputValues(action.defineInputs(), message)
                .then((values: Map<string, any>) => action.execute(values, message))
                .then((result: Result) => self.writeOutputValues(result, message))
                .then((result: Result) => self.sendMessages(result, message))
                .then(function(result: Result) {
                    resolve();
                    self.updateStatus(result);
                })
                .catch((error: Error) => reject(error));
        });
    };

    private readInputValues(definition: InputDefinition, message: InternalMessage): Promise<Map<string, any>> {
        const self = this;
        let promises = [];

        for (let [name, value] of definition.entries()) {
            let generator = function(name: string, input: InputItem): Promise<any> {
                return new Promise<any>((resolve, reject) => {
                    self.RED.util.evaluateNodeProperty(input.property, input.source, self.node, message.data, (error: Error | null, value: any) => {
                        if (error) {
                            value = input.default;

                            if (input.required && typeof value === 'undefined') {
                                reject(error);
                                return;
                            }
                        }

                        if (input.type === 'number') {
                            if (! isNumeric(value)) {
                                reject(new Error(self.RED._('invalid input')));
                                return;
                            }

                            value = Number(value);
                        }

                        resolve([name, value]);
                    });
                });
            };

            promises.push(generator(name, value));
        }

        let allPromises = Promise.all(promises);
        return new Promise<Map<string, any>>((resolve, reject) => {
            allPromises
                .then((values: Array<[string, any]>) => {
                    const result = new Map();
                    for (let value of values) {
                        result.set(value[0], value[1]);
                    }

                    resolve(result);
                })
                .catch((error) => reject(error));
        });
    };

    private writeOutputValues(result: Result, message: InternalMessage): Promise<Result> {
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
        return new Promise<Result>((resolve, reject) => {
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

    private sendMessages(result: Result, message: InternalMessage): Result {
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

    private updateStatus(result: Result) {
        if (result.nodeStatus !== null) {
            this.node.status(result.nodeStatus);
        }
    };
}
