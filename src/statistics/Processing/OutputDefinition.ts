import type {NodeMessage} from 'node-red';

export interface OutputValueDefinition {
    target: string,
    property: string,
    type: string,
    /**
     * Determines which output channel is used to send a message.
     */
    channel: number
    /**
     * If set it is used instead of the currently processed message.
     */
    message?: NodeMessage | null;
}

export class OutputDefinition extends Map<string, OutputValueDefinition> {
}
