import type { Coordinate } from './Coordinate';
import type { Method } from './Method';

/**
 * Represent an event.
 */
export interface Event {
    value: number;
    timestamp: number;
    slot: number;
}

/**
 * Stores events and a history of past events.
 */
export class Storage {
    /**
     * List of current events.
     */
    private events: Array<Event> = [];
    /**
     * List of old events.
     */
    private history: Array<Event> = [];
    /**
     * Indicates if the event list needs to be sorted before generating coordinates.
     */
    private isUnsorted = false;
    private readonly calculator: Method;
    private readonly numberOfSlots: number;
    private readonly resolutionInMs: number;

    constructor(numberOfSlots: number, resolutionInMs: number, calculator: Method) {
        this.numberOfSlots = numberOfSlots;
        this.resolutionInMs = resolutionInMs;
        this.calculator = calculator;
    }

    /**
     * Adds an event with the given value and the given timestamp.
     */
    addEvent(value: number, timestamp: number) {
        const slot = this.getSlot(timestamp);

        if (this.events.length === 0) {
            this.events.push({
                value: value,
                timestamp: timestamp,
                slot: slot,
            });
        } else {
            const lastEvent = this.events[this.events.length - 1];

            if (typeof lastEvent !== 'undefined' && slot >= lastEvent.slot) {
                // event with timestamp after the last stored event timestamp
                this.events.push({
                    value: value,
                    timestamp: timestamp,
                    slot: slot,
                });
            } else {
                // event with timestamp before the last stored event timestamp
                this.events.push({
                    value: value,
                    timestamp: timestamp,
                    slot: slot,
                });

                this.isUnsorted = true;
            }
        }
    }

    /**
     * Generates coordinates from the stored events including history.
     */
    getCoordinates(timestamp: number): Array<Coordinate> {
        this.prepareEvents(timestamp);

        const lastSlot = this.getSlot(timestamp);
        const firstSlot = lastSlot - (this.numberOfSlots - 1) * this.resolutionInMs;

        let result = this.buildCoordinates(firstSlot, this.history);
        result = result.concat(this.buildCoordinates(firstSlot, this.events));

        return result;
    }

    /**
     * Returns the number of current events.
     */
    getEventCount(): number {
        return this.events.length;
    }

    /**
     * Returns the number of events in the history.
     */
    getHistoryCount(): number {
        return this.history.length;
    }

    /**
     * Clears the list of events and the history.
     */
    clear(): void {
        this.events = [];
        this.history = [];
    }

    /**
     * Calculates a slot for the given timestamp.
     */
    private getSlot(timestamp: number) {
        return Math.floor(timestamp / this.resolutionInMs) * this.resolutionInMs;
    }

    /**
     * Prepares the list of events and moves old events to the history.
     */
    private prepareEvents(timestamp: number): void {
        // sort events if necessary
        if (this.isUnsorted) {
            this.events.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });

            this.isUnsorted = false;
        }

        // move old events to history
        const lastSlot = this.getSlot(timestamp);
        const firstSlot = lastSlot - (this.numberOfSlots - 1) * this.resolutionInMs;

        while (this.events[0] && this.events[0].timestamp < firstSlot) {
            const event = this.events.shift();
            if (typeof event !== 'undefined') {
                this.history.push(event);
            }
        }

        // keep only 3 slots in history
        if (this.history.length > 5) {
            let numberOfSlots = 0;
            let lastSlot = null;
            let startIndex = 0;
            for (let n = this.history.length - 1; n >= 0; n--) {
                const historyEvent = this.history[n];
                if (typeof historyEvent === 'undefined') {
                    continue;
                }

                if (historyEvent.slot !== lastSlot) {
                    numberOfSlots++;
                    lastSlot = historyEvent.slot;
                }
                if (numberOfSlots > 2) {
                    break;
                }

                startIndex = n;
            }

            this.history = this.history.slice(startIndex);
        }
    }

    /**
     * Generates coordinates for a list of events.
     */
    private buildCoordinates(firstSlot: number, events: Array<Event>): Array<Coordinate> {
        const result = [];
        let index = 0;
        let slot = null;
        while (index < events.length) {
            const values = [];

            let event = events[index];
            if (typeof event === 'undefined') {
                index++;
                continue;
            }

            if (event.slot !== slot) {
                slot = event.slot;
            }

            // Collect values of all events in the same slot
            while (index < events.length) {
                event = events[index];
                if (typeof event !== 'undefined') {
                    if (event.slot !== slot) {
                        break;
                    }

                    values.push(event.value);
                }
                index++;
            }

            if (values.length === 1) {
                // only one event in the slot
                result.push({
                    x: (slot - firstSlot) / this.resolutionInMs,
                    y: values[0] || 0,
                });
            } else {
                // apply the configured slot method to calculate the value
                result.push({
                    x: (slot - firstSlot) / this.resolutionInMs,
                    y: this.calculator(values),
                });
            }
        }

        return result;
    }
}
