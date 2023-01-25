import type { Interpolator } from './Interpolator';
import { LinearInterpolator } from './Interpolator/LinearInterpolator';
import { NoneInterpolator } from './Interpolator/NoneInterpolator';
import { StepAfterInterpolator } from './Interpolator/StepAfterInterpolator';

/**
 * Builds an interpolator for the given code.
 */
export function buildInterpolator(interpolatorCode: string): Interpolator {
    switch (interpolatorCode) {
        case 'none':
            return new NoneInterpolator();
        case 'linear':
            return new LinearInterpolator();
        case 'stepAfter':
        default:
            return new StepAfterInterpolator();
    }
}
