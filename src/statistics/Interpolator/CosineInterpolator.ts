import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the cosine interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class CosineInterpolator extends AbstractInterpolator {
    protected fillHoles(startIndex: number, coordinates: Array<Coordinate>, result: Array<number>): void {
        for (let index = startIndex - 1; index < coordinates.length - 1; index++) {
            const currentCoordinate = coordinates[index];
            const nextCoordinate = coordinates[index + 1];

            if (typeof currentCoordinate === 'undefined' || typeof nextCoordinate === 'undefined') {
                continue;
            }

            for (let x = Math.max(currentCoordinate.x, 0); x <= nextCoordinate.x; x++) {
                const y1 = currentCoordinate.y;
                const y2 = nextCoordinate.y;
                const x1 = currentCoordinate.x;
                const x2 = nextCoordinate.x;

                const mu = (x - x1) / (x2 - x1);
                const mu2 = (1 - Math.cos(mu * Math.PI)) / 2;

                result[x] = y1 * (1 - mu2) + y2 * mu2;
            }
        }
    }
}
