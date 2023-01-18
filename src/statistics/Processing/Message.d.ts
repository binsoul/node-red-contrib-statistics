import type {NodeMessageInFlow} from 'node-red';

export interface Message {
    data: NodeMessageInFlow,
    timestamp: number
}
