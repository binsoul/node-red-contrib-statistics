import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the step after interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class StepAfterInterpolator extends AbstractInterpolator {
    protected fillHoles(startIndex: number, coordinates: Array<Coordinate>, result: Array<number>): void {
        for (let index = startIndex; index < coordinates.length - 1; index++) {
            const currentCoordinate = coordinates[index];
            const nextCoordinate = coordinates[index + 1];

            if (typeof currentCoordinate === 'undefined' || typeof nextCoordinate === 'undefined') {
                continue;
            }

            for (let n = currentCoordinate.x; n < nextCoordinate.x; n++) {
                result[n] = currentCoordinate.y;
            }
        }
    }
}
