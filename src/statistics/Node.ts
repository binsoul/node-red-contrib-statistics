import type {Node, NodeInitializer, NodeMessage} from 'node-red';
import type {Configuration} from './Configuration';

import {Storage} from './Storage';
import {buildMethod} from './MethodFactory';
import {buildInterpolator} from './InterpolatorFactory';

const isNumeric = function(str: any) {
    if (typeof str === 'number') {
        return true;
    }

    if (typeof str !== 'string') {
        return false;
    }

    //@ts-ignore
    return ! isNaN(str) && ! isNaN(parseFloat(str));
};

const nodeInitializer: NodeInitializer = (RED): void => {
    function NodeConstructor(this: Node, config: Configuration): void {
        RED.nodes.createNode(this, config);

        let numberOfSlots = Number(config.slotCount);
        let resolutionInMs = Number(config.slotResolutionNumber) * 1000;
        if (config.slotResolutionUnit === 'minutes') {
            resolutionInMs *= 60;
        }

        let outputMethodCode = config.outputMethod;
        let outputMethod = buildMethod(config.outputMethod);
        let slotMethod = buildMethod(config.slotMethod);
        let interpolator = buildInterpolator(config.interpolation);
        let output1Frequency = config.output1Frequency;
        let output2Frequency = config.output2Frequency;

        let storageByTopic = new Map();
        let historyByTopic = new Map();

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

            let storage;
            if (storageByTopic.has(topic.toLowerCase())) {
                storage = storageByTopic.get(topic.toLowerCase());
            } else {
                storage = new Storage(numberOfSlots, resolutionInMs, slotMethod);
                storageByTopic.set(topic, storage);
            }

            storage.addEvent(payload, now);

            let coordinates = storage.getCoordinates(now);
            let interpolatedCoordinates = interpolator(coordinates, numberOfSlots);
            let outputValue = outputMethod(interpolatedCoordinates);
            let statistics = storage.getStatistics();

            let previousOutputValue = null;
            if (historyByTopic.has(topic.toLowerCase())) {
                previousOutputValue = historyByTopic.get(topic.toLowerCase());
            }

            let isChanged = previousOutputValue !== outputValue;
            historyByTopic.set(topic.toLowerCase(), outputValue);

            let output: Array<NodeMessage | null> = [null, null];

            if (output1Frequency === 'always' || (output1Frequency === 'changes' && isChanged)) {
                let msg1 = RED.util.cloneMessage(msg);
                msg1.payload = outputValue;
                output[0] = msg1;
            }

            if (output2Frequency === 'always' || (output2Frequency === 'changes' && isChanged)) {
                let baseMsg = {
                    timestamp: now,
                    value: payload,
                };

                RED.util.setObjectProperty(baseMsg, outputMethodCode, outputValue, false);

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
