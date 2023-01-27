import { Action, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import type { I18nTFunction } from '@node-red/util';
import type { ValueAction } from './ValueAction';

/**
 * Clears the storage of a value action.
 */
export class ClearAction implements Action {
    private readonly valueAction: ValueAction;
    private readonly translate: I18nTFunction;

    constructor(valueAction: ValueAction, translate: I18nTFunction) {
        this.valueAction = valueAction;
        this.translate = translate;
    }

    defineInput(): InputDefinition {
        return new InputDefinition();
    }

    defineOutput(): OutputDefinition {
        return new OutputDefinition();
    }

    execute(): Output {
        this.valueAction.clear();

        const output = new Output();
        output.setNodeStatus({
            fill: 'yellow',
            shape: 'dot',
            text: `[${this.valueAction.getId()}] ${this.translate('binsoul-statistics.status.cleared')}`,
        });

        return output;
    }
}
