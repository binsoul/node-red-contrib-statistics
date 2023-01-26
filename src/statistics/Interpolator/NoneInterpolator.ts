import type { Coordinate } from '../Coordinate';
import type { Interpolator } from '../Interpolator';

/**
 * Returns the Y value of all given coordinates if there X value is greater or equal zero.
 */
export class NoneInterpolator implements Interpolator {
    interpolate(coordinates: Array<Coordinate>): Array<number> {
        if (coordinates.length === 0) {
            return [];
        }

        const result = [];
        for (let index = 0; index < coordinates.length; index++) {
            const coordinate = coordinates[index];
            if (typeof coordinate === 'undefined') {
                continue;
            }

            if (coordinate.x >= 0) {
                result.push(coordinate.y);
            }
        }

        return result.length > 0 ? result : [];
    }
}
