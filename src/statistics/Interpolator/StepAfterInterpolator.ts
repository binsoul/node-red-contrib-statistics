/**
 * Applies the step after algorithm to the given coordinates to generate an array with the requested length.
 */
export function stepAfterInterpolator(coordinates: Array<Record<'x' | 'y', number>>, numberOfSlots: number): Array<number> {
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

    // fill holes between coordinates
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
