import type {Configuration} from './Configuration';
import {ValueAction} from './Action/ValueAction';
import type {Message} from './Processing/Message';
import type {Action} from './Processing/Action';
import type {SetupResult} from './SetupResult';
import type {ActionFactory as ActionFactoryInterface} from './Processing/ActionFactory';
import {UpdateAction} from './Action/UpdateAction';
import type {NodeMessageInFlow} from 'node-red';

interface MessageData extends NodeMessageInFlow {
    command?: string | undefined,
}

export class ActionFactory implements ActionFactoryInterface {
    private readonly configuration: Configuration;
    private actionsByTopic = new Map<string, ValueAction>();

    constructor(configuration: Configuration) {
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
            switch (command.toLowerCase()) {
                case 'update':
                    const valueAction = this.actionsByTopic.get(topic);
                    if (typeof valueAction === 'undefined') {
                        return null;
                    }

                    return new UpdateAction(this.configuration, valueAction);
                case 'updateall':
                    let actions = [];
                    for (let valueAction of this.actionsByTopic.values()) {
                        actions.push(new UpdateAction(this.configuration, valueAction));
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
}
