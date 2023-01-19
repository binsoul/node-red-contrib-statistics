import type {NodeStatus} from '@node-red/registry';

export interface SetupResult {
    nodeStatus: string | NodeStatus | null;
}
