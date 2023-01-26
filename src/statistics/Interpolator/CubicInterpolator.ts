import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the cubic interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class CubicInterpolator extends AbstractInterpolator {
    protected calculateValue(coordinate0: Coordinate, coordinate1: Coordinate, coordinate2: Coordinate, coordinate3: Coordinate, mu: number): number {
        const y0 = coordinate0.y;
        const y1 = coordinate1.y;
        const y2 = coordinate2.y;
        const y3 = coordinate3.y;

        const mu2 = mu * mu;

        const a0 = y3 - y2 - y0 + y1;
        const a1 = y0 - y1 - a0;
        const a2 = y2 - y0;
        const a3 = y1;

        return a0 * mu * mu2 + a1 * mu2 + a2 * mu + a3;
    }
}
