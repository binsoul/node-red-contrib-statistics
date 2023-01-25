import type { Interpolator } from './Interpolator';
import { noneInterpolator } from './Interpolator/NoneInterpolator';
import { stepAfterInterpolator } from './Interpolator/StepAfterInterpolator';

/**
 * Builds an interpolator for the given code.
 */
export function buildInterpolator(interpolatorCode: string): Interpolator {
    switch (interpolatorCode) {
        case 'none':
            return noneInterpolator;
        case 'stepAfter':
        default:
            return stepAfterInterpolator;
    }
}
