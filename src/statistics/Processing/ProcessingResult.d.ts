import type {Output} from './Output';
import type {NodeStatus} from '@node-red/registry';

export interface ProcessingResult {
    outputs: Array<Output | null> | null,
    nodeStatus: string | NodeStatus | null
}
