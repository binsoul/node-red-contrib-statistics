import type {Interpolator} from './Interpolator';
import type {Method} from './Method';

/**
 * Sanitized configuration generated from user input.
 */
export class Configuration {
    outputMethod: Method;
    slotCount: number;
    slotResolution: number;
    slotMethod: Method;
    interpolator: Interpolator;
    precision: string;
    output1Frequency: string;
    output2Frequency: string;
    outputMethodCode: string;

    inputValueProperty: string;
    inputValueSource: string;
    inputTimestampProperty: string;
    inputTimestampSource: string;
    output1ValueProperty: string;
    output1ValueTarget: string;
    output2ValueProperty: string;
    output2ValueTarget: string;
    updateMode: string;
    updateFrequency: number;

    constructor(
        outputMethod: Method,
        slotCount: number = 15,
        slotResolution: number = 15 * 60 * 1000,
        slotMethod: Method,
        interpolator: Interpolator,
        precision: string,
        output1Frequency: string = 'changes',
        output2Frequency: string = 'never',
        outputMethodCode: string = 'mean',
        inputValueProperty: string = 'payload',
        inputValueSource: string = 'msg',
        inputTimestampProperty: string = '',
        inputTimestampSource: string = 'date',
        output1ValueProperty: string = 'payload',
        output1ValueTarget: string = 'msg',
        output2ValueProperty: string = 'payload',
        output2ValueTarget: string = 'msg',
        updateMode: string = 'never',
        updateFrequency: number = 5,
    ) {
        this.outputMethod = outputMethod;
        this.slotCount = slotCount;
        this.slotResolution = slotResolution;
        this.slotMethod = slotMethod;
        this.interpolator = interpolator;
        this.precision = precision;
        this.output1Frequency = output1Frequency;
        this.output2Frequency = output2Frequency;
        this.outputMethodCode = outputMethodCode;
        this.inputValueProperty = inputValueProperty;
        this.inputValueSource = inputValueSource;
        this.inputTimestampProperty = inputTimestampProperty;
        this.inputTimestampSource = inputTimestampSource;
        this.output1ValueProperty = output1ValueProperty;
        this.output1ValueTarget = output1ValueTarget;
        this.output2ValueProperty = output2ValueProperty;
        this.output2ValueTarget = output2ValueTarget;
        this.updateMode = updateMode;
        this.updateFrequency = updateFrequency;
    }
}
