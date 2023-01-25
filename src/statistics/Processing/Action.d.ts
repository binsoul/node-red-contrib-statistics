import type { Input } from './Input';
import type { InputDefinition } from './InputDefinition';
import { Output } from './Output';
import type { OutputDefinition } from './OutputDefinition';

/**
 * Represents a piece of code that generates an output from an input.
 */
export interface Action {
    defineInput: () => InputDefinition;
    defineOutput: () => OutputDefinition;
    execute: (input: Input) => Output;
}
