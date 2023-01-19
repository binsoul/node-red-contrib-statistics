import type {Message} from './Processing/Message';
import type {Action} from './Processing/Action';

export interface ActionFactory {

    build: (message: Message) => Action | null;
}
