import { Coordinate } from './Coordinate';

/**
 * Represents an interpolation algorithm.
 */
export interface Interpolator {
    /**
     * Generates an array of numbers from the given coordinates.
     */
    interpolate: (coordinates: Array<Coordinate>, numberOfSlots: number) => Array<number>;
}
