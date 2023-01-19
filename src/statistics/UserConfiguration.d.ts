import type {NodeDef} from 'node-red';

export interface UserConfigurationOptions {
    outputMethod?: string,
    slotCount?: number,
    slotResolutionNumber?: number,
    slotResolutionUnit?: string,
    slotMethod?: string,
    interpolation?: string,
    output1Frequency?: string,
    output2Frequency?: string
    inputValueProperty?: string
    inputValueSource?: string
    output1ValueProperty?: string
    output1ValueTarget?: string
    output2ValueProperty?: string
    output2ValueTarget?: string
}

export interface UserConfiguration extends NodeDef, UserConfigurationOptions {
}
