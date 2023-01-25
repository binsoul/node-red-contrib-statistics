import { Coordinate } from './Coordinate';

/**
 * Generates an array of numbers from the given coordinates.
 */
export type Interpolator = (coordinates: Array<Coordinate>, numberOfSlots: number) => Array<number>;
