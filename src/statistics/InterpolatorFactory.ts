import type { Interpolator } from './Interpolator';
import { CatmullRomInterpolator } from './Interpolator/CatmullRomInterpolator';
import { CosineInterpolator } from './Interpolator/CosineInterpolator';
import { CubicInterpolator } from './Interpolator/CubicInterpolator';
import { HermiteInterpolator } from './Interpolator/HermiteInterpolator';
import { LinearInterpolator } from './Interpolator/LinearInterpolator';
import { NoneInterpolator } from './Interpolator/NoneInterpolator';
import { StepAfterInterpolator } from './Interpolator/StepAfterInterpolator';
import { StepBeforeInterpolator } from './Interpolator/StepBeforeInterpolator';
import { StepMiddleInterpolator } from './Interpolator/StepMiddleInterpolator';

/**
 * Builds an interpolator for the given code.
 */
export function buildInterpolator(interpolatorCode: string): Interpolator {
    switch (interpolatorCode.toLowerCase()) {
        case 'catmullrom':
            return new CatmullRomInterpolator();
        case 'cosine':
            return new CosineInterpolator();
        case 'cubic':
            return new CubicInterpolator();
        case 'hermitelowtension':
            return new HermiteInterpolator(-1, 0);
        case 'hermitenormaltension':
            return new HermiteInterpolator(0, 0);
        case 'hermitehightension':
            return new HermiteInterpolator(1, 0);
        case 'linear':
            return new LinearInterpolator();
        case 'none':
            return new NoneInterpolator();
        case 'stepbefore':
            return new StepBeforeInterpolator();
        case 'stepmiddle':
            return new StepMiddleInterpolator();
        case 'stepafter':
        default:
            return new StepAfterInterpolator();
    }
}
