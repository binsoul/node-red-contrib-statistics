import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the linear interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class LinearInterpolator extends AbstractInterpolator {
    protected fillHoles(startIndex: number, coordinates: Array<Coordinate>, result: Array<number>): void {
        for (let index = startIndex - 1; index < coordinates.length - 1; index++) {
            const currentCoordinate = coordinates[index];
            const nextCoordinate = coordinates[index + 1];

            if (typeof currentCoordinate === 'undefined' || typeof nextCoordinate === 'undefined') {
                continue;
            }

            for (let x = currentCoordinate.x; x <= nextCoordinate.x; x++) {
                const y1 = currentCoordinate.y;
                const y2 = nextCoordinate.y;
                const x1 = currentCoordinate.x;
                const x2 = nextCoordinate.x;

                result[x] = y1 + ((y2 - y1) / (x2 - x1)) * (x - x1);
            }
        }
    }
}
