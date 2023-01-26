import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the Catmull-Rom interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class CatmullRomInterpolator extends AbstractInterpolator {
    protected calculateValue(coordinate0: Coordinate, coordinate1: Coordinate, coordinate2: Coordinate, coordinate3: Coordinate, mu: number): number {
        const y0 = coordinate0.y;
        const y1 = coordinate1.y;
        const y2 = coordinate2.y;
        const y3 = coordinate3.y;

        const mu2 = mu * mu;

        const a0 = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3;
        const a1 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
        const a2 = -0.5 * y0 + 0.5 * y2;
        const a3 = y1;

        return a0 * mu * mu2 + a1 * mu2 + a2 * mu + a3;
    }
}
