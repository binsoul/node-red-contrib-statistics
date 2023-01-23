import type {Action} from '../Processing/Action';
import type {Configuration} from '../Configuration';
import type {Input} from '../Processing/Input';
import {Storage} from '../Storage';
import {InputDefinition} from '../Processing/InputDefinition';
import {OutputDefinition} from '../Processing/OutputDefinition';
import {Output} from '../Processing/Output';
import type {NodeMessage} from 'node-red';

interface HistoryItem {
    lastEventAt: number | null,
    lastUpdateAt: number | null,
    inputValue: number | null
    outputValue: number | null
    msg: NodeMessage | null,
}

export class ValueAction implements Action {
    private readonly configuration: Configuration;

    private readonly storage: Storage;
    private history: HistoryItem = {
        lastEventAt: null,
        lastUpdateAt: null,
        inputValue: null,
        outputValue: null,
        msg: null,
    };

    private id: string = '';

    constructor(configuration: Configuration) {
        this.configuration = configuration;
        this.storage = new Storage(configuration.slotCount, configuration.slotResolution, configuration.slotMethod);
    }

    defineInput(): InputDefinition {
        const result = new InputDefinition();

        result.set('value', {
            source: this.configuration.inputValueSource,
            property: this.configuration.inputValueProperty,
            type: 'number',
            required: true,
        });

        result.set('timestamp', {
            source: this.configuration.inputTimestampSource,
            property: this.configuration.inputTimestampProperty,
            type: 'number',
            required: true,
        });

        return result;
    }

    defineOutput(): OutputDefinition {
        const result = new OutputDefinition();

        result.set('value', {
            target: this.configuration.output1ValueTarget,
            property: this.configuration.output1ValueProperty,
            type: 'number',
            channel: 0,
        });

        result.set('object', {
            target: this.configuration.output2ValueTarget,
            property: this.configuration.output2ValueProperty,
            type: 'object',
            channel: 1,
        });

        return result;
    }

    execute(input: Input): Output {
        let timestamp = input.getRequiredValue<number>('timestamp');
        let inputValue = input.getRequiredValue<number>('value');

        this.storage.addEvent(inputValue, timestamp);

        this.history.lastEventAt = (new Date()).getTime();
        this.history.inputValue = inputValue;
        this.history.msg = input.getMessage().data;

        return this.generateOutput(this.history.lastEventAt);
    }

    generateOutput(timestamp: number): Output {
        let configuration = this.configuration;
        let storage = this.storage;

        let history = this.history;
        history.lastUpdateAt = (new Date()).getTime();

        if (history.lastEventAt !== null && timestamp < history.lastEventAt) {
            timestamp = history.lastEventAt;
        }

        let coordinates = storage.getCoordinates(timestamp);
        if (coordinates.length === 0) {
            return new Output();
        }

        let interpolatedCoordinates = configuration.interpolator(coordinates, configuration.slotCount);
        let outputValue = configuration.outputMethod(interpolatedCoordinates);
        if (configuration.precision !== 'infinite') {
            outputValue = this.round(outputValue, configuration.precision);
        }

        let isChanged = history.outputValue !== outputValue;
        history.outputValue = outputValue;

        let result = new Output();

        if (configuration.output1Frequency === 'always' || (configuration.output1Frequency === 'changes' && isChanged)) {
            result.setValue('value', outputValue);
        }

        if (configuration.output2Frequency === 'always' || (configuration.output2Frequency === 'changes' && isChanged)) {
            let baseMsg = {
                timestamp: timestamp,
                [configuration.outputMethodCode]: outputValue,
            };

            result.setValue('object', Object.assign(baseMsg, this.getStatistics(interpolatedCoordinates)));
        }

        result.setNodeStatus({
            fill: 'green',
            shape: (isChanged ? 'dot' : 'ring'),
            text: `[${this.id}] ${this.format(storage.getEventCount())}+${this.format(storage.getHistoryCount())} ⇒ ${this.format(outputValue)}`,
        });

        return result;
    };

    getId(): string {
        return this.id;
    }

    setId(value: string) {
        this.id = value;
    }

    getLastMessage(): NodeMessage | null {
        return this.history.msg;
    }

    getLastEventTimestamp(): number | null {
        return this.history.lastEventAt;
    }

    getLastUpdateTimestamp(): number | null {
        return this.history.lastUpdateAt;
    }

    getEventCount(): number {
        return this.storage.getEventCount();
    }

    clear(): void {
        this.storage.clear();

        this.history.lastEventAt = null;
        this.history.lastUpdateAt = null;
        this.history.inputValue = null;
        this.history.outputValue = null;
        this.history.msg = null;
    }

    private getStatistics(interpolatedCoordinates: Array<number>): Record<'value' | 'minimum' | 'maximum' | 'count', number | null> {
        let minimum = null;
        let maximum = null;
        let value = null;

        for (let n = 0; n < interpolatedCoordinates.length; n++) {
            let number = interpolatedCoordinates[n];
            if (typeof number === 'undefined') {
                continue;
            }

            value = number;

            if (minimum === null || value < minimum) {
                minimum = value;
            }
            if (maximum === null || value > maximum) {
                maximum = value;
            }
        }

        return {
            value: value,
            minimum: minimum,
            maximum: maximum,
            count: this.storage.getEventCount(),
        };
    }

    private round(value: number, decimals: string): number {
        return Number(Math.round(<number><unknown>(value + 'e' + decimals)) + 'e-' + decimals);
    }

    private format(value: number): string {
        return value.toLocaleString(undefined, {
            maximumFractionDigits: this.configuration.precision !== 'infinite' ? Number(this.configuration.precision) : 10,
            minimumFractionDigits: 0,
        });
    }
}
