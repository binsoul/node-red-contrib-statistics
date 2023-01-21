import type {Method} from './Method';
import type {Coordinate} from './Coordinate';

export interface Event {
    value: number,
    timestamp: number,
    slot: number
}

export class Storage {
    private events: Array<Event> = [];
    private history: Array<Event> = [];
    private isUnsorted: boolean = false;
    private readonly calculator: Method;
    private readonly numberOfSlots: number;
    private readonly resolutionInMs: number;

    constructor(numberOfSlots: number, resolutionInMs: number, calculator: Method) {
        this.numberOfSlots = numberOfSlots;
        this.resolutionInMs = resolutionInMs;
        this.calculator = calculator;
    }

    addEvent(value: number, timestamp: number) {
        let slot = this.getSlot(timestamp);

        if (this.events.length === 0) {
            this.events.push({
                value: value,
                timestamp: timestamp,
                slot: slot,
            });
        } else {
            let lastEvent = this.events[this.events.length - 1];

            if (typeof lastEvent !== 'undefined' && slot >= lastEvent.slot) {
                this.events.push({
                    value: value,
                    timestamp: timestamp,
                    slot: slot,
                });
            } else {
                this.events.push({
                    value: value,
                    timestamp: timestamp,
                    slot: slot,
                });
                this.isUnsorted = true;
            }
        }
    }

    getCoordinates(timestamp: number): Array<Coordinate> {
        this.prepareEvents(timestamp);

        let lastSlot = this.getSlot(timestamp);
        let firstSlot = lastSlot - (this.numberOfSlots - 1) * this.resolutionInMs;

        let result = this.buildCoordinates(firstSlot, this.history);
        result = result.concat(this.buildCoordinates(firstSlot, this.events));

        return result;
    }

    getEventCount(): number {
        return this.events.length;
    }

    getHistoryCount(): number {
        return this.history.length;
    }

    clear(): void {
        this.events = [];
        this.history = [];
    }

    private getSlot(timestamp: number) {
        return Math.floor(timestamp / this.resolutionInMs) * this.resolutionInMs;
    }

    private prepareEvents(timestamp: number): void {
        // sort events if necessary
        if (this.isUnsorted) {
            this.events.sort(function(a, b) {
                return a.timestamp - b.timestamp;
            });

            this.isUnsorted = false;
        }

        // move old events to history
        let lastSlot = this.getSlot(timestamp);
        let firstSlot = lastSlot - (this.numberOfSlots - 1) * this.resolutionInMs;

        while (this.events[0] && this.events[0].timestamp < firstSlot) {
            let event = this.events.shift();
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
                let historyEvent = this.history[n];
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

    private buildCoordinates(firstSlot: number, events: Array<Event>): Array<Coordinate> {
        let result = [];
        let index = 0;
        let slot = null;
        while (index < events.length) {
            let values = [];

            let event = events[index];
            if (typeof event === 'undefined') {
                index++;
                continue;
            }

            if (event.slot !== slot) {
                slot = event.slot;
            }

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
                result.push({
                    x: (slot - firstSlot) / this.resolutionInMs,
                    y: values[0] || 0,
                });
            } else {
                result.push({
                    x: (slot - firstSlot) / this.resolutionInMs,
                    y: this.calculator(values),
                });
            }
        }

        return result;
    }
}
