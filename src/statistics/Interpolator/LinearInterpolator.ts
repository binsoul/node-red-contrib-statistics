import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the linear interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class LinearInterpolator extends AbstractInterpolator {
    protected calculateValue(coordinate0: Coordinate, coordinate1: Coordinate, coordinate2: Coordinate, coordinate3: Coordinate, mu: number): number {
        const y1 = coordinate1.y;
        const y2 = coordinate2.y;

        return y1 * (1 - mu) + y2 * mu;
    }
}
