import type {NodeStatus} from '@node-red/registry';

export class Output {
    private values: Map<string, any> = new Map();
    private nodeStatus: string | NodeStatus | null = null;

    hasValue(key: string): boolean {
        return this.values.has(key);
    }

    getValue<T>(key: string): T | undefined {
        return this.values.get(key);
    }

    setValue(key: string, value: any): void {
        this.values.set(key, value);
    }

    getNodeStatus(): string | NodeStatus | null {
        return this.nodeStatus;
    }

    setNodeStatus(value: string | NodeStatus | null) {
        this.nodeStatus = value;
    }
}
