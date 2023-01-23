import type {UserConfiguration} from './UserConfiguration';
import {Configuration} from './Configuration';
import {buildInterpolator} from './InterpolatorFactory';
import {buildMethod} from './MethodFactory';

const getString = function(value: any, defaultValue: string): string {
    let result = value || defaultValue;

    result = '' + result;
    if (result.trim() === '') {
        return defaultValue;
    }

    return result;
};

export function buildConfiguration(config: UserConfiguration): Configuration {
    let slotCount = Number(config.slotCount || 15);
    let slotResolution = Number(config.slotResolutionNumber || 1) * 1000;
    if (getString(config.slotResolutionUnit, 'minutes') === 'minutes') {
        slotResolution *= 60;
    }

    let outputMethodCode = getString(config.outputMethod, 'mean');
    let outputMethod = buildMethod(outputMethodCode);
    let slotMethod = buildMethod(getString(config.slotMethod, 'mean'));
    let interpolator = buildInterpolator(getString(config.interpolation, 'stepAfter'));
    let precision = getString(config.precision, 'infinite');
    let updateMode = getString(config.updateMode, 'events');
    let updateFrequency = Number(config.updateFrequency || 5);

    let output1Frequency = getString(config.output1Frequency, 'changes');
    let output2Frequency = getString(config.output2Frequency, 'never');

    let inputValueProperty = getString(config.inputValueProperty, 'payload');
    let inputValueSource = getString(config.inputValueSource, 'msg');
    let inputTimestampProperty = getString(config.inputTimestampProperty, '');
    let inputTimestampSource = getString(config.inputTimestampSource, 'date');

    let output1ValueProperty = getString(config.output1ValueProperty, 'payload');
    let output1ValueTarget = getString(config.output1ValueTarget, 'msg');
    let output2ValueProperty = getString(config.output2ValueProperty, 'payload');
    let output2ValueTarget = getString(config.output2ValueTarget, 'msg');

    return new Configuration(
        outputMethod,
        slotCount,
        slotResolution,
        slotMethod,
        interpolator,
        precision,
        output1Frequency,
        output2Frequency,
        outputMethodCode,
        inputValueProperty,
        inputValueSource,
        inputTimestampProperty,
        inputTimestampSource,
        output1ValueProperty,
        output1ValueTarget,
        output2ValueProperty,
        output2ValueTarget,
        updateMode,
        updateFrequency,
    );
}
