import type { NodeMessageInFlow } from 'node-red';

/**
 * Extends a message with a timestamp when the message was received.
 */
export interface Message {
    data: NodeMessageInFlow;
    timestamp: number;
}
