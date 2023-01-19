import type {Action} from './Processing/Action';
import type {Configuration} from './Configuration';
import {Storage} from './Storage';
import type {HistoryItem} from './HistoryItem';
import {InputDefinition} from './Processing/InputDefinition';
import type {Message} from './Processing/Message';
import type {Result} from './Processing/Result';

export class ValueAction implements Action {
    private readonly configuration: Configuration;

    private readonly storage: Storage;
    private history: HistoryItem | null = null;

    constructor(configuration: Configuration) {
        this.configuration = configuration;
        this.storage = new Storage(configuration.slotCount, configuration.slotResolution, configuration.slotMethod);
    }

    defineInputs(): InputDefinition {
        const result = new InputDefinition();

        result.set('value', {
            source: this.configuration.inputValueType,
            property: this.configuration.inputValueProperty,
            type: 'number',
            required: true,
        });

        return result;
    }

    execute(inputValues: Map<string, any>, message: Message): Result {
        let configuration = this.configuration;
        let timestamp = message.timestamp;
        let inputValue = Number(inputValues.get('value'));

        let storage = this.storage;
        this.storage.addEvent(inputValue, timestamp);

        let coordinates = storage.getCoordinates(timestamp);
        let interpolatedCoordinates = configuration.interpolator(coordinates, configuration.slotCount);
        let outputValue = configuration.outputMethod(interpolatedCoordinates);
        let statistics = storage.getStatistics();

        let isChanged = true;
        if (this.history !== null) {
            isChanged = this.history.outputValue !== outputValue;
        }

        this.history = {
            timestamp: timestamp,
            inputValue: inputValue,
            outputValue: outputValue,
            msg: message.data,
        };

        let result: Result = {
            outputs: [null, null],
            nodeStatus: null,
        };

        if (configuration.output1Frequency === 'always' || (configuration.output1Frequency === 'changes' && isChanged)) {
            result.outputs = result.outputs || [null, null];

            result.outputs[0] = {
                target: configuration.output1ValueType,
                property: configuration.output1ValueProperty,
                value: outputValue,
                sendMessage: true,
                message: null,
            };
        }

        if (configuration.output2Frequency === 'always' || (configuration.output2Frequency === 'changes' && isChanged)) {
            let baseMsg = {
                timestamp: timestamp,
                value: inputValue,
                [configuration.outputMethodCode]: outputValue,
            };

            result.outputs = result.outputs || [null, null];
            result.outputs[1] = {
                target: configuration.output2ValueType,
                property: configuration.output2ValueProperty,
                value: Object.assign(baseMsg, statistics),
                sendMessage: true,
                message: null,
            };
        }

        if (isChanged) {
            result.nodeStatus = {
                fill: 'green',
                shape: 'dot',
                text: `[${statistics.count}] ${outputValue}`,
            };
        } else {
            result.nodeStatus = {
                fill: 'green',
                shape: 'ring',
                text: `[${statistics.count}] ${outputValue}`,
            };
        }

        return result;
    };
}
