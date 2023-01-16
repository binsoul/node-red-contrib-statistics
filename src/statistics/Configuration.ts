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

    constructor(
        outputMethod: Method,
        slotCount: number = 15,
        slotResolution: number = 15 * 60 * 1000,
        slotMethod: Method,
        interpolator: Interpolator,
        output1Frequency: string = 'changes',
        output2Frequency: string = 'never',
        outputMethodCode: string = 'mean',
    ) {
        this.outputMethod = outputMethod;
        this.slotCount = slotCount;
        this.slotResolution = slotResolution;
        this.slotMethod = slotMethod;
        this.interpolator = interpolator;
        this.output1Frequency = output1Frequency;
        this.output2Frequency = output2Frequency;
        this.outputMethodCode = outputMethodCode;
    }
}
