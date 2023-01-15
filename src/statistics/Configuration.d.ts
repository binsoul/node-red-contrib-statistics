import type {NodeDef} from 'node-red';

export interface ConfigurationOptions {
    outputMethod: string,
    slotCount: number,
    slotResolutionNumber: number,
    slotResolutionUnit: string,
    slotMethod: string,
    interpolation: string,
    output1Frequency: string,
    output2Frequency: string
}

export interface Configuration extends NodeDef, ConfigurationOptions {
}
