import {Coordinate} from './Coordinate';

export type Interpolator = (coordinates: Array<Coordinate>, numberOfSlots: number) => Array<number>;
