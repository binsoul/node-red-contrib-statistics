import type {Message} from './Processing/Message';
import type {Processor} from './Processing/Processor';

export interface ProcessorFactory {

    build: (message: Message) => Processor | null;
}
