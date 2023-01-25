import type { Action } from './Processing/Action';
import type { Message } from './Processing/Message';

/**
 * Builds an {@link Action} for a {@link Message}.
 */
export interface ActionFactory {
    build: (message: Message) => Action | Array<Action> | null;
}
