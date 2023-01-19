import type {Action} from './Processing/Action';
import type {Configuration} from './Configuration';
import type {HistoryItem} from './HistoryItem';
import type {Input} from './Processing/Input';
import {Storage} from './Storage';
import {InputDefinition} from './Processing/InputDefinition';
import {OutputDefinition} from './Processing/OutputDefinition';
import {Output} from './Processing/Output';

export class ValueAction implements Action {
    private readonly configuration: Configuration;

    private readonly storage: Storage;
    private history: HistoryItem | null = null;

    constructor(configuration: Configuration) {
        this.configuration = configuration;
        this.storage = new Storage(configuration.slotCount, configuration.slotResolution, configuration.slotMethod);
    }

    defineInput(): InputDefinition {
        const result = new InputDefinition();

        result.set('value', {
            source: this.configuration.inputValueType,
            property: this.configuration.inputValueProperty,
            type: 'number',
            required: true,
        });

        return result;
    }

    defineOutput(): OutputDefinition {
        const result = new OutputDefinition();

        result.set('value', {
            target: this.configuration.output1ValueType,
            property: this.configuration.output1ValueProperty,
            type: 'number',
            channel: 0,
        });

        result.set('object', {
            target: this.configuration.output2ValueType,
            property: this.configuration.output2ValueProperty,
            type: 'object',
            channel: 1,
        });

        return result;
    }

    execute(input: Input): Output {
        let configuration = this.configuration;
        let timestamp = input.getMessage().timestamp;
        let inputValue = input.getRequiredValue<number>('value');

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
            msg: input.getMessage().data,
        };

        let result = new Output();

        if (configuration.output1Frequency === 'always' || (configuration.output1Frequency === 'changes' && isChanged)) {
            result.setValue('value', outputValue);
        }

        if (configuration.output2Frequency === 'always' || (configuration.output2Frequency === 'changes' && isChanged)) {
            let baseMsg = {
                timestamp: timestamp,
                value: inputValue,
                [configuration.outputMethodCode]: outputValue,
            };

            result.setValue('object', Object.assign(statistics, baseMsg));
        }

        if (isChanged) {
            result.setNodeStatus({
                fill: 'green',
                shape: 'dot',
                text: `[${statistics.count}] ${outputValue}`,
            });
        } else {
            result.setNodeStatus({
                fill: 'green',
                shape: 'ring',
                text: `[${statistics.count}] ${outputValue}`,
            });
        }

        return result;
    };
}
