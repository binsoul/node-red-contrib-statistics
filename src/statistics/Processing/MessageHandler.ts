import type { Node, NodeAPI } from '@node-red/registry';
import type { NodeMessage, NodeMessageInFlow } from 'node-red';
import type { Action } from './Action';
import type { ActionFactory } from './ActionFactory';
import { Input } from './Input';
import type { InputDefinition, InputValueDefinition } from './InputDefinition';
import type { Message } from './Message';
import type { Output } from './Output';
import type { OutputDefinition, OutputValueDefinition } from './OutputDefinition';

/**
 * Adds the "send" and "done" functions to a {@link Message}.
 */
interface InternalMessage extends Message {
    send: (message: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void;
    done: (error?: Error) => void;
}

/**
 * Returns if a given value is numeric.
 */
const isNumeric = function (str: unknown) {
    if (typeof str === 'number') {
        return true;
    }

    if (typeof str !== 'string') {
        return false;
    }

    return !isNaN(<number>(<unknown>str)) && !isNaN(parseFloat(str));
};

/**
 * Receives messages and processes them using {@link Action} objects.
 */
export class MessageHandler {
    /**
     * List of all unprocessed messages
     */
    private pendingMessages: Array<InternalMessage> = [];
    /**
     * Promise for currently processed message.
     */
    private activeMessagePromise: Promise<((message: InternalMessage | void) => unknown) | void> | null = null;
    private RED: NodeAPI;
    private node: Node;
    private actionFactory: ActionFactory;

    constructor(RED: NodeAPI, node: Node, actionFactory: ActionFactory) {
        this.RED = RED;
        this.node = node;
        this.actionFactory = actionFactory;
    }

    /**
     * Handles incoming messages.
     */
    handle(msg: NodeMessageInFlow, send: (message: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void, done: (error?: Error) => void) {
        const internalMessage: InternalMessage = {
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
    }

    /**
     * Processes all pending messages.
     */
    private processMessageQueue() {
        if (this.pendingMessages.length === 0) {
            this.activeMessagePromise = null;
            return;
        }

        let nextMessage: InternalMessage | null = null;
        while (this.pendingMessages.length > 0) {
            const item = this.pendingMessages.shift();
            if (typeof item !== 'undefined') {
                nextMessage = item;
                break;
            }
        }

        if (nextMessage) {
            this.activeMessagePromise = this.processMessage(nextMessage)
                .then(() => {
                    // process next message
                    this.activeMessagePromise = null;
                    this.processMessageQueue();
                })
                .catch((error) => {
                    if (nextMessage) {
                        // output error
                        if (error instanceof Error) {
                            nextMessage.done(error);
                            this.node.error(error.message, nextMessage.data);
                            this.node.status({
                                fill: 'red',
                                shape: 'dot',
                                text: error.message,
                            });
                        } else {
                            nextMessage.done();
                            this.node.error('error', nextMessage.data);
                            this.node.status({
                                fill: 'red',
                                shape: 'dot',
                                text: 'error',
                            });
                        }
                    }

                    // process next message
                    this.activeMessagePromise = null;
                    this.processMessageQueue();
                });
        }
    }

    /**
     * Processes a single message.
     */
    private processMessage(message: InternalMessage): Promise<void[]> {
        let possibleActions = this.actionFactory.build(message);
        if (possibleActions === null) {
            return Promise.resolve([]);
        }

        if (!Array.isArray(possibleActions)) {
            possibleActions = [possibleActions];
        }

        if (possibleActions.length === 0) {
            return Promise.resolve([]);
        }

        const promises = [];

        for (const possibleAction of possibleActions) {
            // generate a Promise for each Action
            const generator = (action: Action): Promise<void> => {
                return new Promise<void>((resolve, reject) => {
                    const inputDefinition = action.defineInput();
                    const outputDefinition = action.defineOutput();

                    this.readInputValues(inputDefinition, message)
                        .then((input: Input) => action.execute(input))
                        .then((output: Output) => this.writeOutputValues(outputDefinition, output))
                        .then((output: Output) => this.sendMessages(outputDefinition, output, message))
                        .then((output: Output) => {
                            resolve();
                            this.setNodeStatus(output);
                        })
                        .catch((error: Error) => reject(error));
                });
            };

            promises.push(generator(possibleAction));
        }

        return Promise.all(promises);
    }

    /**
     * Reads all input values of an {@link Action}.
     */
    private readInputValues(inputDefinition: InputDefinition, message: InternalMessage): Promise<Input> {
        const promises = [];

        for (const [name, definition] of inputDefinition.entries()) {
            if (definition.source === 'date') {
                promises.push(Promise.resolve([name, message.timestamp]));
            } else {
                const generator = (name: string, definition: InputValueDefinition): Promise<[string, unknown]> => {
                    return new Promise((resolve, reject) => {
                        this.RED.util.evaluateNodeProperty(definition.property, definition.source, this.node, message.data, (error: Error | null, value: unknown) => {
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

        const allPromises = Promise.all(promises);
        return new Promise((resolve, reject) => {
            allPromises
                .then((values: ((string | unknown)[] | [string, unknown])[]) => {
                    const map = new Map<string, unknown>();
                    for (const value of values) {
                        map.set(<string>value[0], value[1]);
                    }

                    resolve(new Input(map, message));
                })
                .catch((error) => reject(error));
        });
    }

    /**
     * Writes all output values of an {@link Action} except msg properties.
     */
    private writeOutputValues(outputDefinition: OutputDefinition, output: Output): Promise<Output> {
        const promises = [];

        if (outputDefinition.size === 0) {
            return Promise.resolve(output);
        }

        for (const [name, definition] of outputDefinition.entries()) {
            const value = output.getValue(name);
            if (typeof value === 'undefined') {
                continue;
            }

            if (definition.target !== 'msg') {
                const generator = (definition: OutputValueDefinition, value: unknown): Promise<void> => this.setOutputValue(value, definition.target, definition.property);

                promises.push(generator(definition, value));
            }
        }

        if (promises.length === 0) {
            return Promise.resolve(output);
        }

        const allPromises = Promise.all(promises);
        return new Promise<Output>((resolve, reject) => {
            allPromises.then(() => resolve(output)).catch((error) => reject(error));
        });
    }

    /**
     * Writes a single output value of an {@link Action}.
     */
    private setOutputValue(value: unknown, type: string, property: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (type === 'msg') {
                // handled by sendMessages
            } else if (type === 'flow' || type === 'global') {
                const target = this.node.context()[type];
                const callback = (err: Error) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                };

                const contextKey = this.RED.util.parseContextStore(property);

                if (/\[msg/.test(contextKey.key)) {
                    const key = [];
                    const parts = this.RED.util.normalisePropertyExpression(contextKey.key);
                    for (const part of parts) {
                        key.push('' + part);
                    }

                    target.set(key.join('.'), value, contextKey.store, callback);
                } else {
                    target.set(contextKey.key, value, contextKey.store, callback);
                }
            } else {
                reject(new Error('Unknown type ' + type + '.'));
            }
        });
    }

    /**
     * Sends all messages generated by an {@link Action}.
     */
    private sendMessages(outputDefinition: OutputDefinition, output: Output, message: InternalMessage): Output {
        let messages: Array<NodeMessage | null> | null = null;

        if (outputDefinition.size > 0) {
            messages = [];
            for (const [name, definition] of outputDefinition.entries()) {
                const value = output.getValue(name);

                if (typeof value === 'undefined') {
                    // Send null message because Action set no output value
                    messages[definition.channel] = messages[definition.channel] || null;
                } else {
                    const nodeMessage = messages[definition.channel] || definition.message || message.data;

                    if (definition.target === 'msg') {
                        // Write output value into a new message
                        const clonedMessage = this.RED.util.cloneMessage(nodeMessage);
                        if (typeof clonedMessage._msgid !== 'undefined') {
                            clonedMessage._msgid = this.RED.util.generateId();
                        }

                        if (!this.RED.util.setMessageProperty(clonedMessage, definition.property, value, true)) {
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
            // Remove channel numbers
            const messageValues: Array<NodeMessage | null> = [];
            for (const message of messages) {
                messageValues.push(message);
            }

            message.send(messageValues);
        }

        message.done();

        return output;
    }

    /**
     * Sets the status of the node in the editor.
     */
    private setNodeStatus(output: Output) {
        const nodeStatus = output.getNodeStatus();

        if (nodeStatus !== null) {
            this.node.status(nodeStatus);
        }
    }
}
