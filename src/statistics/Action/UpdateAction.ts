import { Action, Input, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import type { Configuration } from '../Configuration';
import type { ValueAction } from './ValueAction';

/**
 * Generates a new output for a value action.
 */
export class UpdateAction implements Action {
    private readonly configuration: Configuration;
    private readonly valueAction: ValueAction;

    constructor(configuration: Configuration, valueAction: ValueAction) {
        this.configuration = configuration;
        this.valueAction = valueAction;
    }

    defineInput(): InputDefinition {
        const result = new InputDefinition();

        result.set('timestamp', {
            source: this.configuration.inputTimestampSource,
            property: this.configuration.inputTimestampProperty,
            type: 'number',
            required: false,
        });

        return result;
    }

    defineOutput(): OutputDefinition {
        const definition = this.valueAction.defineOutput();

        const lastMessage = this.valueAction.getLastMessage();
        for (const output of definition.values()) {
            output.message = lastMessage;
        }

        return definition;
    }

    execute(input: Input): Output {
        let timestamp = input.getOptionalValue<number>('timestamp');
        if (typeof timestamp === 'undefined') {
            timestamp = input.getMessage().timestamp;
        }

        return this.valueAction.generateOutput(timestamp);
    }
}
