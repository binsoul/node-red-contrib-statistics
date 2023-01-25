import type { NodeMessage } from 'node-red';

/**
 * Defines a single input value for an {@link Action}.
 */
export interface OutputValueDefinition {
    /**
     * Object, e.g. msg, flow or global, where the output value should be written to.
     */
    target: string;
    /**
     * Property of the object where the output value should be written to.
     */
    property: string;
    /**
     * Type of the value.
     */
    type: string;
    /**
     * Determines which output channel is used to send a message.
     */
    channel: number;
    /**
     * Used instead of the currently processed message if not null.
     */
    message?: NodeMessage | null;
}

/**
 * Defines a list of output values for an {@link Action}.
 */
export class OutputDefinition extends Map<string, OutputValueDefinition> {}
