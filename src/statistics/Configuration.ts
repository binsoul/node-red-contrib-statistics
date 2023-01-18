import type {Interpolator} from './Interpolator';
import type {Method} from './Method';

export class Configuration {
    outputMethod: Method;
    slotCount: number;
    slotResolution: number;
    slotMethod: Method;
    interpolator: Interpolator;
    output1Frequency: string;
    output2Frequency: string;
    outputMethodCode: string;

    inputValueProperty: string;
    inputValueType: string;
    output1ValueProperty: string;
    output1ValueType: string;
    output2ValueProperty: string;
    output2ValueType: string;

    constructor(
        outputMethod: Method,
        slotCount: number = 15,
        slotResolution: number = 15 * 60 * 1000,
        slotMethod: Method,
        interpolator: Interpolator,
        output1Frequency: string = 'changes',
        output2Frequency: string = 'never',
        outputMethodCode: string = 'mean',
        inputValueProperty: string = 'payload',
        inputValueType: string = 'msg',
        output1ValueProperty: string = 'payload',
        output1ValueType: string = 'msg',
        output2ValueProperty: string = 'payload',
        output2ValueType: string = 'msg',
    ) {
        this.outputMethod = outputMethod;
        this.slotCount = slotCount;
        this.slotResolution = slotResolution;
        this.slotMethod = slotMethod;
        this.interpolator = interpolator;
        this.output1Frequency = output1Frequency;
        this.output2Frequency = output2Frequency;
        this.outputMethodCode = outputMethodCode;
        this.inputValueProperty = inputValueProperty;
        this.inputValueType = inputValueType;
        this.output1ValueProperty = output1ValueProperty;
        this.output1ValueType = output1ValueType;
        this.output2ValueProperty = output2ValueProperty;
        this.output2ValueType = output2ValueType;
    }
}
