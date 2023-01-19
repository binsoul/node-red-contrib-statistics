import type {Configuration} from './Configuration';
import {ValueAction} from './ValueAction';
import type {Message} from './Processing/Message';
import type {Action} from './Processing/Action';
import type {SetupResult} from './SetupResult';
import type {ActionFactory as ActionFactoryInterface} from './Processing/ActionFactory';

export class ActionFactory implements ActionFactoryInterface {
    private readonly configuration: Configuration;
    private actionsByTopic = new Map<string, ValueAction>();

    constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    build(message: Message): Action | null {
        let topic = message.data.topic;
        if (typeof topic === 'undefined' || ('' + topic).trim() === '') {
            return null;
        }

        let action = null;
        if (this.actionsByTopic.has(topic.toLowerCase())) {
            action = this.actionsByTopic.get(topic.toLowerCase());
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
