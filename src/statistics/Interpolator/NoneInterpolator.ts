import type {Coordinate} from '../Coordinate';

/**
 * Returns the Y value of all given coordinates if there X value is greater or equal zero.
 */
export function noneInterpolator(coordinates: Array<Coordinate>): Array<number> {
    if (coordinates.length === 0) {
        return Array(1).fill(null);
    }

    let result = [];
    for (let index = 0; index < coordinates.length; index++) {
        let coordinate = coordinates[index];
        if (typeof coordinate === 'undefined') {
            continue;
        }

        if (coordinate.x >= 0) {
            result.push(coordinate.y);
        }
    }

    return result;
}
