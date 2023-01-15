import type {Interpolator} from './Interpolator';
import {noneInterpolator} from './NoneInterpolator';
import {stepAfterInterpolator} from './StepAfterInterpolator';

export function buildInterpolator(interpolatorCode: string): Interpolator {
    switch (interpolatorCode) {
        case 'none':
            return noneInterpolator;
        case 'stepAfter':
        default:
            return stepAfterInterpolator;
    }
}
