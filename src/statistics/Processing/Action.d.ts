import type {InputDefinition} from './InputDefinition';
import type {Message} from './Message';
import type {Result} from './Result';

export interface Action {
    defineInputs: () => InputDefinition;
    execute: (inputValues: Map<string, any>, message: Message) => Result;
}
