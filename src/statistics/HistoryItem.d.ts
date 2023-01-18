import {NodeMessageInFlow} from 'node-red';

export interface HistoryItem {
    timestamp: number,
    inputValue: number
    outputValue: number
    msg: NodeMessageInFlow,
}
