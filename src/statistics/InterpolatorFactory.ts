import type {Interpolator} from './Interpolator';
import {noneInterpolator} from './Interpolator/NoneInterpolator';
import {stepAfterInterpolator} from './Interpolator/StepAfterInterpolator';

export function buildInterpolator(interpolatorCode: string): Interpolator {
    switch (interpolatorCode) {
        case 'none':
            return noneInterpolator;
        case 'stepAfter':
        default:
            return stepAfterInterpolator;
    }
}
