import type {UserConfiguration} from './UserConfiguration';
import {Configuration} from './Configuration';
import {buildInterpolator} from './InterpolatorFactory';
import {buildMethod} from './MethodFactory';

export function buildConfiguration(config: UserConfiguration): Configuration {
    let slotCount = Number(config.slotCount || 15);
    let slotResolution = Number(config.slotResolutionNumber || 1) * 1000;
    if ((config.slotResolutionUnit || 'minutes') === 'minutes') {
        slotResolution *= 60;
    }

    let outputMethodCode = config.outputMethod || 'mean';
    let outputMethod = buildMethod(outputMethodCode);
    let slotMethod = buildMethod(config.slotMethod || 'mean');
    let interpolator = buildInterpolator(config.interpolation || 'stepAfter');
    let output1Frequency = config.output1Frequency || 'changes';
    let output2Frequency = config.output2Frequency || 'never';

    return new Configuration(outputMethod, slotCount, slotResolution, slotMethod, interpolator, output1Frequency, output2Frequency, outputMethodCode);
}
