import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the step after interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class StepAfterInterpolator extends AbstractInterpolator {
    protected calculateValue(coordinate0: Coordinate, coordinate1: Coordinate, coordinate2: Coordinate, coordinate3: Coordinate, mu: number): number {
        if (mu >= 1) {
            return coordinate2.y;
        }

        return coordinate1.y;
    }
}
