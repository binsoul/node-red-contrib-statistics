import type {NodeMessage} from 'node-red';

export interface Output {
    target: string,
    property: string,
    value: any,
    sendMessage: boolean,
    message: NodeMessage | null,
}
