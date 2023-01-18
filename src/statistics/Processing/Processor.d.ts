import type {InputDefinition} from './InputDefinition';
import type {Message} from './Message';
import type {ProcessingResult} from './ProcessingResult';

export interface Processor {
    defineInputs: () => Array<InputDefinition>;
    process: (inputValues: Array<number>, message: Message) => ProcessingResult;
}
