import {NodeMessageInFlow} from 'node-red';

export interface HistoryItem {
    timestamp: number,
    input: NodeMessageInFlow,
    output: number
}
