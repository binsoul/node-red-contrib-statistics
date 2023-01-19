import type {Output} from './Output';
import type {NodeStatus} from '@node-red/registry';

export interface Result {
    outputs: Array<Output | null> | null,
    nodeStatus: string | NodeStatus | null
}
