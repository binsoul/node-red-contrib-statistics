import { Configuration } from './Configuration';
import { buildInterpolator } from './InterpolatorFactory';
import { buildMethod } from './MethodFactory';
import type { UserConfiguration } from './UserConfiguration';

const getString = function (value: unknown, defaultValue: string): string {
    const result = value || defaultValue;

    const stringValue = '' + result;
    if (stringValue.trim() === '') {
        return defaultValue;
    }

    return stringValue;
};

/**
 * Creates a sanitized configuration from user input.
 */
export function buildConfiguration(config: UserConfiguration): Configuration {
    const slotCount = Number(config.slotCount || 15);
    let slotResolution = Number(config.slotResolutionNumber || 1) * 1000;
    if (getString(config.slotResolutionUnit, 'minutes') === 'minutes') {
        slotResolution *= 60;
    }

    const outputMethodCode = getString(config.outputMethod, 'mean');
    const outputMethod = buildMethod(outputMethodCode);
    const slotMethod = buildMethod(getString(config.slotMethod, 'mean'));
    const interpolator = buildInterpolator(getString(config.interpolation, 'stepAfter'));
    const precision = getString(config.precision, 'infinite');
    const updateMode = getString(config.updateMode, 'never');
    const updateFrequency = Number(config.updateFrequency || 5);

    const output1Frequency = getString(config.output1Frequency, 'changes');
    const output2Frequency = getString(config.output2Frequency, 'never');

    const inputValueProperty = getString(config.inputValueProperty, 'payload');
    const inputValueSource = getString(config.inputValueSource, 'msg');
    const inputTimestampProperty = getString(config.inputTimestampProperty, '');
    const inputTimestampSource = getString(config.inputTimestampSource, 'date');

    const output1ValueProperty = getString(config.output1ValueProperty, 'payload');
    const output1ValueTarget = getString(config.output1ValueTarget, 'msg');
    const output2ValueProperty = getString(config.output2ValueProperty, 'payload');
    const output2ValueTarget = getString(config.output2ValueTarget, 'msg');

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
