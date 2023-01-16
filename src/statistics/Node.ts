import type {Node, NodeInitializer, NodeMessage} from 'node-red';
import type {UserConfiguration} from './UserConfiguration';

import {Storage} from './Storage';
import type {HistoryItem} from './HistoryItem';
import {buildConfiguration} from './ConfigurationBuilder';

const isNumeric = function(str: any) {
    if (typeof str === 'number') {
        return true;
    }

    if (typeof str !== 'string') {
        return false;
    }

    return ! isNaN(<number>(<unknown>str)) && ! isNaN(parseFloat(str));
};

const nodeInitializer: NodeInitializer = (RED): void => {
    function NodeConstructor(this: Node, userConfiguration: UserConfiguration): void {
        RED.nodes.createNode(this, userConfiguration);

        const configuration = buildConfiguration(userConfiguration);

        let storageByTopic = new Map<string, Storage>();
        let historyByTopic = new Map<string, HistoryItem>();

        let node = this;
        node.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'binsoul-statistics.status.noEvents',
        });

        this.on('input', function(msg, send, done) {
            let payload = RED.util.evaluateNodeProperty('payload', 'msg', node, msg);

            if (! isNumeric(payload)) {
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: 'binsoul-statistics.status.invalidPayload',
                });
                done();
                return;
            }

            payload = Number(payload);

            let now = new Date().getTime();
            let topic = RED.util.getMessageProperty(msg, 'topic') || 'topic';

            let storage = null;
            if (storageByTopic.has(topic.toLowerCase())) {
                storage = storageByTopic.get(topic.toLowerCase());
            }

            if (storage === null || typeof storage === 'undefined') {
                storage = new Storage(configuration.slotCount, configuration.slotResolution, configuration.slotMethod);
                storageByTopic.set(topic, storage);
            }

            storage.addEvent(payload, now);

            let coordinates = storage.getCoordinates(now);
            let interpolatedCoordinates = configuration.interpolator(coordinates, configuration.slotCount);
            let outputValue = configuration.outputMethod(interpolatedCoordinates);
            let statistics = storage.getStatistics();

            let history = null;
            if (historyByTopic.has(topic.toLowerCase())) {
                history = historyByTopic.get(topic.toLowerCase());
            }

            let isChanged = true;
            if (history !== null && typeof history !== 'undefined') {
                isChanged = history.output !== outputValue;
            }

            historyByTopic.set(topic.toLowerCase(), {
                timestamp: now,
                input: msg,
                output: outputValue,
            });

            let output: Array<NodeMessage | null> = [null, null];

            if (configuration.output1Frequency === 'always' || (configuration.output1Frequency === 'changes' && isChanged)) {
                let msg1 = RED.util.cloneMessage(msg);
                msg1.payload = outputValue;
                output[0] = msg1;
            }

            if (configuration.output2Frequency === 'always' || (configuration.output2Frequency === 'changes' && isChanged)) {
                let baseMsg = {
                    timestamp: now,
                    value: payload,
                };

                RED.util.setObjectProperty(baseMsg, configuration.outputMethodCode, outputValue, false);

                let msg2 = RED.util.cloneMessage(msg);
                msg2.payload = Object.assign(baseMsg, statistics);
                output[1] = msg2;
            }

            send(output);
            done();

            if (isChanged) {
                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: `[${statistics.count}] ${outputValue}`,
                });
            } else {
                node.status({
                    fill: 'green',
                    shape: 'ring',
                    text: `[${statistics.count}] ${outputValue}`,
                });
            }
        });
    }

    RED.nodes.registerType('binsoul-statistics', NodeConstructor);
};

export = nodeInitializer;
