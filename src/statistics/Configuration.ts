import type { Interpolator } from './Interpolator';
import type { Method } from './Method';

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
        slotCount = 15,
        slotResolution = 900000,
        slotMethod: Method,
        interpolator: Interpolator,
        precision = 'infinite',
        output1Frequency = 'changes',
        output2Frequency = 'never',
        outputMethodCode = 'mean',
        inputValueProperty = 'payload',
        inputValueSource = 'msg',
        inputTimestampProperty = '',
        inputTimestampSource = 'date',
        output1ValueProperty = 'payload',
        output1ValueTarget = 'msg',
        output2ValueProperty = 'payload',
        output2ValueTarget = 'msg',
        updateMode = 'never',
        updateFrequency = 5,
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
