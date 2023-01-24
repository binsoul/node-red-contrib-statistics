import {setTimeout, clearTimeout} from 'timers';
import type {Configuration} from './Configuration';
import {ValueAction} from './Action/ValueAction';
import type {Message} from './Processing/Message';
import type {Action} from './Processing/Action';
import type {ActionFactory as ActionFactoryInterface} from './Processing/ActionFactory';
import {UpdateAction} from './Action/UpdateAction';
import type {NodeMessageInFlow} from 'node-red';
import {ClearAction} from './Action/ClearAction';
import type {Node, NodeAPI} from '@node-red/registry';

interface MessageData extends NodeMessageInFlow {
    command?: string,
    timestamp?: number,
}

/**
 * Generates Actions and handles automatic updates.
 */
export class ActionFactory implements ActionFactoryInterface {
    private readonly configuration: Configuration;
    private readonly RED: NodeAPI;
    private readonly node: Node;

    private actionsByTopic = new Map<string, ValueAction>();
    private updateTimer: NodeJS.Timeout | null = null;

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
            // message contains a command
            const valueAction = this.actionsByTopic.get(topic);
            let actions = [];

            switch (command.toLowerCase()) {
                case 'update':
                    if (typeof valueAction === 'undefined') {
                        return null;
                    }

                    this.scheduleUpdate();

                    return new UpdateAction(this.configuration, valueAction);
                case 'updateall':
                    for (let valueAction of this.actionsByTopic.values()) {
                        actions.push(new UpdateAction(this.configuration, valueAction));
                    }

                    this.scheduleUpdate();

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

                    if (this.updateTimer !== null) {
                        clearTimeout(this.updateTimer);
                    }

                    return actions;
                default:
                    this.node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'binsoul-statistics.status.invalidCommand',
                    });
                    return null;
            }
        }

        // message contains a new event
        let action = null;
        if (this.actionsByTopic.has(topic)) {
            action = this.actionsByTopic.get(topic);
        }

        if (action === null || typeof action === 'undefined') {
            action = new ValueAction(this.configuration);
            this.actionsByTopic.set(topic, action);

            this.updateActionIds();
        }

        this.scheduleUpdate();

        return action;
    }

    setup(): void {
        this.node.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'binsoul-statistics.status.noEvents',
        });
    }

    teardown(): void {
        if (this.updateTimer !== null) {
            clearTimeout(this.updateTimer);
        }
    }

    /**
     * Updates the displayed id of all actions.
     */
    private updateActionIds(): void {
        let size = '' + this.actionsByTopic.size;
        let index = 0;
        for (let action of this.actionsByTopic.values()) {
            index++;
            action.setId(('' + index).padStart(size.length, '0'));
        }
    }

    /**
     * Starts a timer if automatic updates are enabled and no timer exists.
     */
    private scheduleUpdate(): void {
        const self = this;

        if (self.updateTimer !== null || self.configuration.updateMode === 'never') {
            return;
        }

        const now = (new Date()).getTime();
        self.updateTimer = setTimeout(() => {
            self.executeUpdate();
        }, (self.getEndOfSlot(now) - now) + (self.configuration.updateFrequency * self.configuration.slotResolution));
    }

    /**
     * Handles automatic updates.
     */
    executeUpdate(): void {
        const now = (new Date()).getTime();
        const startOfSlot = this.getStartOfSlot(now);
        const updateTime = (this.configuration.updateFrequency + 1) * this.configuration.slotResolution;

        let shortestTimeout = null;
        let updateTopics = [];

        for (let [topic, valueAction] of this.actionsByTopic) {
            let lastUpdateTimestamp = valueAction.getLastUpdateTimestamp();
            let lastEventTimestamp = valueAction.getLastEventTimestamp();

            if (valueAction.getEventCount() === 0 || lastUpdateTimestamp === null || lastEventTimestamp === null) {
                // there are no current events
                continue;
            }

            if (lastUpdateTimestamp < lastEventTimestamp) {
                lastUpdateTimestamp = this.getEndOfSlot(lastEventTimestamp);
            } else {
                lastUpdateTimestamp = this.getStartOfSlot(lastUpdateTimestamp);
            }

            let nextUpdateAt = lastUpdateTimestamp + updateTime;

            if (nextUpdateAt <= startOfSlot) {
                // an update should be triggered
                updateTopics.push(topic);
            } else {
                // calculate the shortest time difference for the next timeout
                if (shortestTimeout === null) {
                    shortestTimeout = updateTime;
                }

                shortestTimeout = Math.min(shortestTimeout, nextUpdateAt - now);
            }
        }

        if (shortestTimeout !== null) {
            // generate new timeout
            const self = this;
            self.updateTimer = setTimeout(() => {
                self.executeUpdate();
            }, shortestTimeout);
        } else {
            // expire current timeout
            this.updateTimer = null;
        }

        for (let topic of updateTopics) {
            // trigger node.on('input', () => {})
            this.node.receive(<MessageData>{
                'topic': topic,
                'command': 'update',
                'timestamp': now,
            });
        }
    }

    private getStartOfSlot(timestamp: number) {
        return Math.floor(timestamp / this.configuration.slotResolution) * this.configuration.slotResolution;
    }

    private getEndOfSlot(timestamp: number) {
        return Math.ceil(timestamp / this.configuration.slotResolution) * this.configuration.slotResolution;
    }
}
