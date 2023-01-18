import type {UserConfiguration} from './UserConfiguration';
import {Configuration} from './Configuration';
import {buildInterpolator} from './InterpolatorFactory';
import {buildMethod} from './MethodFactory';

const getString = function(value: any, defaultValue: string): string {
    let result = value || defaultValue;

    result = result + '';
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
    let output1Frequency = getString(config.output1Frequency, 'changes');
    let output2Frequency = getString(config.output2Frequency, 'never');
    let inputValueProperty = getString(config.inputValueProperty, 'payload');
    let inputValueType = getString(config.inputValueType, 'msg');
    let output1ValueProperty = getString(config.output1ValueProperty, 'payload');
    let output1ValueType = getString(config.output1ValueType, 'msg');
    let output2ValueProperty = getString(config.output2ValueProperty, 'payload');
    let output2ValueType = getString(config.output2ValueType, 'msg');

    return new Configuration(
        outputMethod,
        slotCount,
        slotResolution,
        slotMethod,
        interpolator,
        output1Frequency,
        output2Frequency,
        outputMethodCode,
        inputValueProperty,
        inputValueType,
        output1ValueProperty,
        output1ValueType,
        output2ValueProperty,
        output2ValueType,
    );
}
