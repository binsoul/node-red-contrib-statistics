import type { Coordinate } from '../Coordinate';
import { AbstractInterpolator } from './AbstractInterpolator';

/**
 * Applies the Hermite interpolation algorithm to the given coordinates to generate an array with the requested length.
 */
export class HermiteInterpolator extends AbstractInterpolator {
    protected bias = 0.0;
    protected tension = 0.0;

    constructor(tension: number, bias: number) {
        super();

        this.tension = tension;
        this.bias = bias;
    }

    protected calculateValue(coordinate0: Coordinate, coordinate1: Coordinate, coordinate2: Coordinate, coordinate3: Coordinate, mu: number): number {
        const y0 = coordinate0.y;
        const y1 = coordinate1.y;
        const y2 = coordinate2.y;
        const y3 = coordinate3.y;

        const mu2 = mu * mu;
        const mu3 = mu2 * mu;
        let m0 = ((y1 - y0) * (1 + this.bias) * (1 - this.tension)) / 2;
        m0 += ((y2 - y1) * (1 - this.bias) * (1 - this.tension)) / 2;
        let m1 = ((y2 - y1) * (1 + this.bias) * (1 - this.tension)) / 2;
        m1 += ((y3 - y2) * (1 - this.bias) * (1 - this.tension)) / 2;
        const a0 = 2 * mu3 - 3 * mu2 + 1;
        const a1 = mu3 - 2 * mu2 + mu;
        const a2 = mu3 - mu2;
        const a3 = -2 * mu3 + 3 * mu2;

        return a0 * y1 + a1 * m0 + a2 * m1 + a3 * y2;
    }
}
