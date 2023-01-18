import type {Processor} from './Processing/Processor';
import type {Configuration} from './Configuration';
import {Storage} from './Storage';
import type {HistoryItem} from './HistoryItem';
import type {InputDefinition} from './Processing/InputDefinition';
import type {Message} from './Processing/Message';
import type {ProcessingResult} from './Processing/ProcessingResult';

export class ValueProcessor implements Processor {
    private readonly configuration: Configuration;

    private readonly storage: Storage;
    private history: HistoryItem | null = null;

    constructor(configuration: Configuration) {
        this.configuration = configuration;
        this.storage = new Storage(configuration.slotCount, configuration.slotResolution, configuration.slotMethod);
    }

    defineInputs(): Array<InputDefinition> {
        return [
            {
                source: this.configuration.inputValueType,
                property: this.configuration.inputValueProperty,
                type: 'number',
            },
        ];
    }

    process(inputValues: Array<number>, message: Message): ProcessingResult {
        let configuration = this.configuration;
        let timestamp = message.timestamp;
        let inputValue = Number(inputValues.shift());

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

        let result: ProcessingResult = {
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
