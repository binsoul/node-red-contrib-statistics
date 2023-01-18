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
    inputValueType?: string
    output1ValueProperty?: string
    output1ValueType?: string
    output2ValueProperty?: string
    output2ValueType?: string
}

export interface UserConfiguration extends NodeDef, UserConfigurationOptions {
}
