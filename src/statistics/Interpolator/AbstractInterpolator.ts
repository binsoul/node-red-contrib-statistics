import type { Coordinate } from '../Coordinate';
import type { Interpolator } from '../Interpolator';

/**
 * Implements a default interpolate method which fills the output up to the first coordinate and after the last coordinate.
 */
export abstract class AbstractInterpolator implements Interpolator {
    interpolate(coordinates: Array<Coordinate>, numberOfSlots: number): Array<number> {
        if (coordinates.length === 0) {
            return Array(numberOfSlots).fill(null);
        }

        let startIndex = 0;
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
        if (coordinates.length === 1) {
            return result;
        }

        this.fillHoles(startIndex, coordinates, result);

        // fill array to the end
        for (let index = coordinates.length - 1; index >= 0; index--) {
            const lastCoordinate = coordinates[index];
            if (typeof lastCoordinate !== 'undefined') {
                for (let n = lastCoordinate.x; n < numberOfSlots; n++) {
                    result[n] = lastCoordinate.y;
                }

                break;
            }
        }

        return result;
    }

    /**
     * Fills holes between coordinates.
     */
    protected abstract fillHoles(startIndex: number, coordinates: Array<Coordinate>, result: Array<number>): void;
}
