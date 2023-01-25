import type { NodeStatus } from '@node-red/registry';

/**
 * Contains all output values of an {@link Action}.
 */
export class Output {
    private values: Map<string, unknown> = new Map();
    private nodeStatus: string | NodeStatus | null = null;

    hasValue(key: string): boolean {
        return this.values.has(key);
    }

    getValue<T>(key: string): T | undefined {
        return <T | undefined>this.values.get(key);
    }

    setValue(key: string, value: unknown): void {
        this.values.set(key, value);
    }

    getNodeStatus(): string | NodeStatus | null {
        return this.nodeStatus;
    }

    setNodeStatus(value: string | NodeStatus | null) {
        this.nodeStatus = value;
    }
}
