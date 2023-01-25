import {
    geometricMean,
    harmonicMean,
    interquartileRange,
    max,
    mean,
    median,
    medianAbsoluteDeviation,
    min,
    mode,
    product,
    rootMeanSquare,
    sampleKurtosis,
    sampleSkewness,
    sampleStandardDeviation,
    standardDeviation,
    sum,
    uniqueCountSorted,
    variance,
} from 'simple-statistics';
import type { Method } from './Method';

/**
 * Builds a method for the given code.
 */
export function buildMethod(methodCode: string): Method {
    switch (methodCode) {
        case 'mean':
            return mean;
        case 'median':
            return median;
        case 'min':
            return min;
        case 'max':
            return max;
        case 'sum':
            return sum;
        case 'product':
            return product;
        case 'uniqueCount':
            return function (values: Array<number>): number {
                const copy = values.slice();
                copy.sort((a, b) => a - b);

                return uniqueCountSorted(copy);
            };
        case 'geometricMean':
            return geometricMean;
        case 'harmonicMean':
            return harmonicMean;
        case 'interquartileRange':
            return interquartileRange;
        case 'medianAbsoluteDeviation':
            return medianAbsoluteDeviation;
        case 'mode':
            return mode;
        case 'rootMeanSquare':
            return rootMeanSquare;
        case 'sampleKurtosis':
            return sampleKurtosis;
        case 'sampleSkewness':
            return sampleSkewness;
        case 'sampleStandardDeviation':
            return sampleStandardDeviation;
        case 'standardDeviation':
            return standardDeviation;
        case 'variance':
            return variance;
        default:
            return mean;
    }
}
