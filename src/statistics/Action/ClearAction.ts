import type {Action} from '../Processing/Action';
import {InputDefinition} from '../Processing/InputDefinition';
import type {ValueAction} from './ValueAction';
import {OutputDefinition} from '../Processing/OutputDefinition';
import {Output} from '../Processing/Output';
import type {I18nTFunction} from '@node-red/util';

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

        let output = new Output();
        output.setNodeStatus({
            fill: 'yellow',
            shape: 'dot',
            text: `[${this.valueAction.getId()}] ${this.translate('binsoul-statistics.status.cleared')}`,
        });

        return output;
    };
}
