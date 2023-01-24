import type {Message} from './Message';

/**
 * Contains all resolved input values for an {@link Action}.
 */
export class Input {
    private values: Map<string, any>;
    private message: Message;

    constructor(values: Map<string, any>, message: Message) {
        this.values = values;
        this.message = message;
    }

    hasValue(key: string): boolean {
        return this.values.has(key);
    }

    getRequiredValue<T>(key: string): T {
        let result = this.values.get(key);
        if (typeof result === 'undefined') {
            throw new Error(key + ' is undefined.');
        }

        return result;
    }

    getOptionalValue<T>(key: string): T | undefined {
        return this.values.get(key);
    }

    getMessage(): Message {
        return this.message;
    }
}
