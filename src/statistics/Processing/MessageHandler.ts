import type {NodeMessage, NodeMessageInFlow} from 'node-red';
import type {Action} from './Action';
import type {InputDefinition, InputValueDefinition} from './InputDefinition';
import type {Output} from './Output';
import type {Message} from './Message';
import type {ActionFactory} from './ActionFactory';
import type {Node, NodeAPI} from '@node-red/registry';
import {Input} from './Input';
import type {OutputValueDefinition} from './OutputDefinition';
import type {OutputDefinition} from './OutputDefinition';

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
            self.activeMessagePromise = self.processMessage(nextMessage)
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

    private processMessage(message: InternalMessage): Promise<void[]> {
        const self = this;

        let possibleActions = self.actionFactory.build(message);
        if (possibleActions === null) {
            return Promise.resolve([]);
        }

        if (! Array.isArray(possibleActions)) {
            possibleActions = [possibleActions];
        }

        if (possibleActions.length === 0) {
            return Promise.resolve([]);
        }

        let promises = [];

        for (let possibleAction of possibleActions) {
            let generator = function(action: Action): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let inputDefinition = action.defineInput();
                    let outputDefinition = action.defineOutput();

                    self.readInputValues(inputDefinition, message)
                        .then((input: Input) => action.execute(input))
                        .then((output: Output) => self.writeOutputValues(outputDefinition, output))
                        .then((output: Output) => self.sendMessages(outputDefinition, output, message))
                        .then(function(output: Output) {
                            resolve();
                            self.updateStatus(output);
                        })
                        .catch((error: Error) => reject(error));
                });
            };

            promises.push(generator(possibleAction));
        }

        return Promise.all(promises);
    };

    private readInputValues(inputDefinition: InputDefinition, message: InternalMessage): Promise<Input> {
        const self = this;
        let promises = [];

        for (let [name, definition] of inputDefinition.entries()) {
            if (definition.source === 'date') {
                promises.push(Promise.resolve([name, message.timestamp]));
            } else {
                let generator = function(name: string, definition: InputValueDefinition): Promise<any> {
                    return new Promise<any>((resolve, reject) => {
                        self.RED.util.evaluateNodeProperty(definition.property, definition.source, self.node, message.data, (error: Error | null, value: any) => {
                            if (error) {
                                value = definition.default;

                                if (definition.required && typeof value === 'undefined') {
                                    reject(error);
                                    return;
                                }
                            }

                            if (definition.type === 'number') {
                                if (isNumeric(value)) {
                                    value = Number(value);
                                } else {
                                    if (definition.required) {
                                        let propertyName = definition.source;
                                        if (definition.property.trim() !== '') {
                                            propertyName += '.' + definition.property;
                                        }

                                        reject(new Error(`Value of "${propertyName}" is not numeric.`));

                                        return;
                                    }

                                    value = void 0;
                                }
                            }

                            resolve([name, value]);
                        });
                    });
                };

                promises.push(generator(name, definition));
            }
        }

        let allPromises = Promise.all(promises);
        return new Promise<Input>((resolve, reject) => {
            allPromises
                .then((values: Array<[string, any]>) => {
                    const map = new Map();
                    for (let value of values) {
                        map.set(value[0], value[1]);
                    }

                    resolve(new Input(map, message));
                })
                .catch((error) => reject(error));
        });
    };

    private writeOutputValues(outputDefinition: OutputDefinition, output: Output): Promise<Output> {
        const self = this;

        let promises = [];

        if (outputDefinition.size === 0) {
            return Promise.resolve(output);
        }

        for (let [name, definition] of outputDefinition.entries()) {
            let value = output.getValue(name);
            if (typeof value === 'undefined') {
                continue;
            }

            if (definition.target !== 'msg') {
                let generator = function(definition: OutputValueDefinition, value: any): Promise<void> {
                    return self.setOutputValue(value, definition.target, definition.property);
                };

                promises.push(generator(definition, value));
            }
        }

        if (promises.length === 0) {
            return Promise.resolve(output);
        }

        let allPromises = Promise.all(promises);
        return new Promise<Output>((resolve, reject) => {
            allPromises
                .then(() => resolve(output))
                .catch((error) => reject(error));
        });
    };

    private setOutputValue(value: any, type: string, property: string): Promise<void> {
        const self = this;

        return new Promise<void>((resolve, reject) => {
            if (type === 'msg') {
                // handled by sendMessages
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

    private sendMessages(outputDefinition: OutputDefinition, output: Output, message: InternalMessage): Output {
        let self = this;
        let messages: Array<NodeMessage | null> | null = null;

        if (outputDefinition.size > 0) {
            messages = [];
            for (let [name, definition] of outputDefinition.entries()) {
                let value = output.getValue(name);

                if (typeof value === 'undefined') {
                    messages[definition.channel] = messages[definition.channel] || null;
                } else {
                    let nodeMessage = messages[definition.channel] || definition.message || message.data;

                    if (definition.target === 'msg') {
                        let clonedMessage = self.RED.util.cloneMessage(nodeMessage);
                        if (typeof clonedMessage._msgid !== 'undefined') {
                            clonedMessage._msgid = self.RED.util.generateId();
                        }

                        if (! self.RED.util.setMessageProperty(clonedMessage, definition.property, value, true)) {
                            throw new Error(`Failed to set message property "${definition.property}".`);
                        }

                        messages[definition.channel] = clonedMessage;
                    } else {
                        messages[definition.channel] = nodeMessage;
                    }
                }
            }
        }

        if (messages !== null) {
            let messageValues: Array<NodeMessage | null> = [];
            for (let message of messages) {
                messageValues.push(message);
            }

            message.send(messageValues);
        }

        message.done();

        return output;
    };

    private updateStatus(output: Output) {
        let nodeStatus = output.getNodeStatus();

        if (nodeStatus !== null) {
            this.node.status(nodeStatus);
        }
    };
}
