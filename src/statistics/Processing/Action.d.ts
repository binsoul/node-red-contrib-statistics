import type {InputDefinition} from './InputDefinition';
import type {OutputDefinition} from './OutputDefinition';
import type {Input} from './Input';
import {Output} from './Output';

/**
 * Represents a piece of code that generates an output from an input.
 */
export interface Action {
    defineInput: () => InputDefinition;
    defineOutput: () => OutputDefinition;
    execute: (input: Input) => Output;
}
