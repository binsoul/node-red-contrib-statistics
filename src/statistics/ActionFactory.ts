import type {Configuration} from './Configuration';
import {ValueAction} from './Action/ValueAction';
import type {Message} from './Processing/Message';
import type {Action} from './Processing/Action';
import type {SetupResult} from './SetupResult';
import type {ActionFactory as ActionFactoryInterface} from './Processing/ActionFactory';
import {UpdateAction} from './Action/UpdateAction';
import type {NodeMessageInFlow} from 'node-red';
import {ClearAction} from './Action/ClearAction';
import type {Node, NodeAPI} from '@node-red/registry';

interface MessageData extends NodeMessageInFlow {
    command?: string | undefined,
}

export class ActionFactory implements ActionFactoryInterface {
    private readonly configuration: Configuration;
    private readonly RED: NodeAPI;
    private readonly node: Node;

    private actionsByTopic = new Map<string, ValueAction>();

    constructor(RED: NodeAPI, node: Node, configuration: Configuration) {
        this.RED = RED;
        this.node = node;
        this.configuration = configuration;
    }

    build(message: Message): Action | Array<Action> | null {
        let data: MessageData = message.data;
        let topic = data.topic;
        if (typeof topic === 'undefined' || ('' + topic).trim() === '') {
            return null;
        }

        topic = topic.toLowerCase();
        let command = data.command;
        if (typeof command !== 'undefined' && ('' + command).trim() !== '') {
            const valueAction = this.actionsByTopic.get(topic);
            let actions = [];

            switch (command.toLowerCase()) {
                case 'update':
                    if (typeof valueAction === 'undefined') {
                        return null;
                    }

                    return new UpdateAction(this.configuration, valueAction);
                case 'updateall':
                    for (let valueAction of this.actionsByTopic.values()) {
                        actions.push(new UpdateAction(this.configuration, valueAction));
                    }

                    return actions;
                case 'clear':
                    if (typeof valueAction === 'undefined') {
                        return null;
                    }

                    return new ClearAction(valueAction, this.RED._);
                case 'clearall':
                    for (let valueAction of this.actionsByTopic.values()) {
                        actions.push(new ClearAction(valueAction, this.RED._));
                    }

                    return actions;
                default:
                    return null;
            }
        }

        let action = null;
        if (this.actionsByTopic.has(topic)) {
            action = this.actionsByTopic.get(topic);
        }

        if (action === null || typeof action === 'undefined') {
            action = new ValueAction(this.configuration);
            this.actionsByTopic.set(topic, action);

            this.updateActionIds();
        }

        return action;
    }

    setup(): SetupResult | null {
        return {
            nodeStatus: {
                fill: 'yellow',
                shape: 'dot',
                text: 'binsoul-statistics.status.noEvents',
            },
        };
    }

    teardown(): void {
    }

    private updateActionIds(): void {
        let size = '' + this.actionsByTopic.size;
        let index = 0;
        for (let action of this.actionsByTopic.values()) {
            index++;
            action.setId(('' + index).padStart(size.length, '0'));
        }
    }
}
