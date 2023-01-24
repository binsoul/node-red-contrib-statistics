import type {Message} from './Processing/Message';
import type {Action} from './Processing/Action';

/**
 * Builds an {@link Action} for a {@link Message}.
 */
export interface ActionFactory {
    build: (message: Message) => Action | Array<Action> | null;
}
