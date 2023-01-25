/**
 * Defines a single input value for an {@link Action}.
 */
export interface InputValueDefinition {
    /**
     * Object, e.g. msg, flow or global, where the input value should be read from.
     */
    source: string;
    /**
     * Property of the object where the input value should be read from.
     */
    property: string;
    /**
     * Type of the value
     */
    type: string;
    /**
     * Indicates if the input value is required or optional.
     */
    required: boolean;
    /**
     * Will be used as the default if no input value can be read.
     */
    default?: unknown;
}

/**
 * Defines a list of input values for an {@link Action}.
 */
export class InputDefinition extends Map<string, InputValueDefinition> {}
