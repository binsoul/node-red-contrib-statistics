import type { Coordinate } from '../Coordinate';
import type { Interpolator } from '../Interpolator';

/**
 * Implements a default interpolate method which fills the output up to the first coordinate and after the last coordinate.
 */
export abstract class AbstractInterpolator implements Interpolator {
    interpolate(coordinates: Array<Coordinate>, numberOfSlots: number): Array<number> {
        if (coordinates.length === 0) {
            return [];
        }

        let startIndex = null;
        let firstY = null;

        for (let index = 0; index < coordinates.length; index++) {
            const coordinate = coordinates[index];
            if (typeof coordinate === 'undefined') {
                continue;
            }

            if (firstY === null) {
                firstY = coordinate.y;
            }

            if (coordinate.x < 0) {
                firstY = coordinate.y;
            } else {
                startIndex = index;
                break;
            }
        }

        // fill array with initial value
        const result = Array(numberOfSlots).fill(firstY);
        if (coordinates.length === 1 || startIndex === null) {
            return result;
        }

        // interpolate between coordinates
        for (let index = startIndex - 1; index < coordinates.length - 1; index++) {
            const coordinate1 = coordinates[index];
            const coordinate2 = coordinates[index + 1];

            if (typeof coordinate1 === 'undefined' || typeof coordinate2 === 'undefined') {
                continue;
            }

            let coordinate0 = coordinates[index - 1];

            if (typeof coordinate0 === 'undefined') {
                coordinate0 = {
                    x: coordinate1.x - (coordinate2.x - coordinate1.x),
                    y: coordinate1.y,
                };
            }

            let coordinate3 = coordinates[index + 2];

            if (typeof coordinate3 === 'undefined') {
                coordinate3 = {
                    x: coordinate2.x + (coordinate2.x - coordinate1.x),
                    y: coordinate2.y,
                };
            }

            for (let x = Math.max(coordinate1.x, 0); x <= Math.min(coordinate2.x, numberOfSlots - 1); x++) {
                const x1 = coordinate1.x;
                const x2 = coordinate2.x;
                const mu = (x - x1) / (x2 - x1);

                result[x] = this.calculateValue(coordinate0, coordinate1, coordinate2, coordinate3, mu);
            }
        }

        // fill array to the end
        for (let index = coordinates.length - 1; index >= 0; index--) {
            const lastCoordinate = coordinates[index];
            if (typeof lastCoordinate !== 'undefined') {
                for (let x = lastCoordinate.x; x < numberOfSlots; x++) {
                    result[x] = lastCoordinate.y;
                }

                break;
            }
        }

        return result;
    }

    /**
     * Calculates an interpolated value between coordinate 1 and 2 for a mu between 0 and 1.
     */
    protected abstract calculateValue(coordinate0: Coordinate, coordinate1: Coordinate, coordinate2: Coordinate, coordinate3: Coordinate, mu: number): number;
}
