import type {InputDefinition} from './InputDefinition';
import type {OutputDefinition} from './OutputDefinition';
import type {Input} from './Input';
import {Output} from './Output';

export interface Action {
    defineInput: () => InputDefinition;
    defineOutput: () => OutputDefinition;
    execute: (input: Input) => Output;
}
