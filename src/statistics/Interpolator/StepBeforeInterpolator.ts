import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the step before interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class StepBeforeInterpolator extends AbstractInterpolator {
    protected calculateValue(coordinate0: Coordinate, coordinate1: Coordinate, coordinate2: Coordinate, coordinate3: Coordinate, mu: number): number {
        if (mu <= 0) {
            return coordinate1.y;
        }

        return coordinate2.y;
    }
}
