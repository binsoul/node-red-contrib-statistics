import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the cosine interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class CosineInterpolator extends AbstractInterpolator {
    protected calculateValue(coordinate0: Coordinate, coordinate1: Coordinate, coordinate2: Coordinate, coordinate3: Coordinate, mu: number): number {
        const y1 = coordinate1.y;
        const y2 = coordinate2.y;

        const mu2 = (1 - Math.cos(mu * Math.PI)) / 2;

        return y1 * (1 - mu2) + y2 * mu2;
    }
}
