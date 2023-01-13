const isNumeric = function(str) {
    if (typeof str != 'string') {
        return true;
    }

    return ! isNaN(str) && ! isNaN(parseFloat(str));
};

/**
 * @param {Array<Record<'x'|'y', number>>}coordinates
 * @param {int} numberOfSlots
 * @returns {Array<number>}
 */
const noneInterpolator = function(/** array */ coordinates, numberOfSlots) {
    if (coordinates.length === 0) {
        return Array(1).fill(null);
    }

    let result = [];
    for (let index = 0; index < coordinates.length; index++) {
        if (coordinates[index].x >= 0) {
            result.push(coordinates[index].y);
        }
    }

    return result;
};

/**
 * @param {Array<Record<'x'|'y', number>>}coordinates
 * @param {int} numberOfSlots
 * @returns {Array<number>}
 */
const stepAfterInterpolator = function(/** array */ coordinates, numberOfSlots) {
    if (coordinates.length === 0) {
        return Array(numberOfSlots).fill(null);
    }

    let startIndex = 0;
    for (let index = 0; index < coordinates.length; index++) {
        if (coordinates[index].x >= 0) {
            startIndex = index;
            break;
        }
    }

    let firstY = coordinates[0].y;
    if (startIndex > 0) {
        firstY = coordinates[startIndex - 1].y;
    }

    // fill array with inital value
    let result = Array(numberOfSlots).fill(firstY);
    if (coordinates.length === 1) {
        return result;
    }

    // fill holes between coordinates
    for (let index = startIndex; index < coordinates.length - 1; index++) {
        let currentCoordinate = coordinates[index];
        let nextCoordinate = coordinates[index + 1];
        for (let n = currentCoordinate.x; n < nextCoordinate.x; n++) {
            result[n] = currentCoordinate.y;
        }
    }

    // fill array to the end
    let lastCoordinate = coordinates[coordinates.length - 1];
    for (let n = lastCoordinate.x; n < numberOfSlots; n++) {
        result[n] = lastCoordinate.y;
    }

    return result;
};

const medianCalculator = function(/** array */ values) {
    values.sort(function(a, b) {
        return a - b;
    });

    let median;
    if (values.length % 2 === 0) {
        median = (values[(values.length / 2) - 1] + values[values.length / 2]) / 2;
    } else {
        median = values[Math.floor(values.length / 2)];
    }

    return median;
};

const arithmeticMeanCalculator = function(/** array */ points) {
    let sum = 0;
    for (let n = 0; n < points.length; n++) {
        sum += points[n];
    }

    return sum / points.length;
};

class Storage {
    events = [];
    history = [];
    isUnsorted = false;
    /**
     * @type {function(array): number}
     */
    calculator;

    /**
     * @param {int} numberOfSlots
     * @param {int} resolutionInMs
     * @param {function(array): number} calculator
     */
    constructor(numberOfSlots, resolutionInMs, calculator) {
        this.numberOfSlots = numberOfSlots;
        this.resolutionInMs = resolutionInMs;
        this.calculator = calculator;
    }

    addEvent(value, timestamp) {
        let slot = Math.floor(timestamp / this.resolutionInMs) * this.resolutionInMs;

        if (this.events.length === 0) {
            this.events.push({
                value: value,
                timestamp: timestamp,
                slot: slot,
            });
        } else if (slot >= this.events[this.events.length - 1].slot) {
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

    /**
     * @returns {Array<Record<'x'|'y', number>>}
     */
    getCoordinates() {
        this.#prepareEvents();

        let firstSlot = this.events[this.events.length - 1].slot - (this.numberOfSlots - 1) * this.resolutionInMs;

        let result = this.#buildCoordinates(firstSlot, this.history);
        result = result.concat(this.#buildCoordinates(firstSlot, this.events));

        return result;
    }

    getStatistics() {
        let minimum = null;
        let maximum = null;

        for (let n = 0; n < this.events.length; n++) {
            if (minimum === null || this.events[n].value < minimum) {
                minimum = this.events[n].value;
            }
            if (maximum === null || this.events[n].value > maximum) {
                maximum = this.events[n].value;
            }
        }

        return {
            minimum: minimum,
            maximum: maximum,
            count: this.events.length,
        };
    }

    #prepareEvents() {
        // sort events if necessary
        if (this.isUnsorted) {
            this.events.sort(function(a, b) {
                return a.timestamp - b.timestamp;
            });

            this.isUnsorted = false;
        }

        // move old events to history
        let firstSlot = this.events[this.events.length - 1].slot - (this.numberOfSlots - 1) * this.resolutionInMs;

        while (this.events[0] && this.events[0].timestamp < firstSlot) {
            this.history.push(this.events.shift());
        }

        // keep only 3 slots in history
        if (this.history.length > 5) {
            let numberOfSlots = 0;
            let lastSlot = null;
            let startIndex = 0;
            for (let n = this.history.length - 1; n >= 0; n--) {
                if (this.history[n].slot !== lastSlot) {
                    numberOfSlots++;
                    lastSlot = this.history[n].slot;
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
     *
     * @param {int} firstSlot
     * @param {array} events
     * @returns {Array<Record<'x'|'y', number>>}
     */
    #buildCoordinates(firstSlot, events) {
        let result = [];
        let index = 0;
        let slot = null;
        while (index < events.length) {
            let values = [];

            if (events[index].slot !== slot) {
                slot = events[index].slot;
            }

            while (index < events.length && events[index].slot === slot) {
                values.push(events[index].value);
                index++;
            }

            if (values.length === 1) {
                result.push({
                    x: (slot - firstSlot) / this.resolutionInMs,
                    y: values[0],
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

module.exports = function(RED) {
    function StatisticsNode(config) {
        RED.nodes.createNode(this, config);

        const methods = {
            'mean': arithmeticMeanCalculator,
            'median': medianCalculator,
        };

        const interpolators = {
            'none': noneInterpolator,
            'stepAfter': stepAfterInterpolator,
        };

        let numberOfSlots = Number(config.slotCount);
        let resolutionInMs = Number(config.slotResolutionNumber) * 1000;
        if (config.slotResolutionUnit === 'minutes') {
            resolutionInMs *= 60;
        }

        let outputMethodName = config.outputMethod;
        let outputMethod = methods[config.outputMethod];
        let slotMethod = methods[config.slotMethod];
        let interpolator = interpolators[config.interpolation];
        let output1Frequency = config.output1Frequency;
        let output2Frequency = config.output2Frequency;

        let storageByTopic = new Map();
        let historyByTopic = new Map();

        let node = this;
        node.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'no events',
        });

        this.on('input', function(msg, send, done) {
            done = done || function() {
            };

            if (! isNumeric(msg.payload)) {
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: 'invalid payload',
                });
                done();
                return;
            }

            let now = new Date().getTime();
            let payload = Number(msg.payload);
            let topic = msg.topic;

            let storage;
            if (storageByTopic.has(topic.toLowerCase())) {
                storage = storageByTopic.get(topic.toLowerCase());
            } else {
                storage = new Storage(numberOfSlots, resolutionInMs, slotMethod);
                storageByTopic.set(topic, storage);
            }

            storage.addEvent(payload, now);

            let coordinates = storage.getCoordinates();
            let interpolatedCoordinates = interpolator(coordinates, numberOfSlots);
            let outputValue = outputMethod(interpolatedCoordinates);
            let statistics = storage.getStatistics();

            let previousOutputValue = null;
            if (historyByTopic.has(topic.toLowerCase())) {
                previousOutputValue = historyByTopic.get(topic.toLowerCase());
            }

            let isChanged = previousOutputValue !== outputValue;
            historyByTopic.set(topic.toLowerCase(), outputValue);

            let output = null;

            if (output1Frequency === 'always' || (output1Frequency === 'changes' && isChanged)) {
                output = [];
                let msg1 = Object.assign({}, msg);
                msg1.payload = outputValue;
                output.push(msg1);
            }

            if (output2Frequency === 'always' || (output2Frequency === 'changes' && isChanged)) {
                let baseMsg = {
                    timestamp: now,
                    value: payload,
                };

                baseMsg[outputMethodName] = outputValue;

                let msg2 = Object.assign({}, msg);
                msg2.payload = Object.assign(baseMsg, statistics);

                output = output || [null];
                output.push(msg2);
            }

            send = send || function() {
                node.send.apply(node, arguments);
            };

            send(output);

            if (isChanged) {
                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: `[${statistics.count}] ${outputValue}`,
                });
            } else {
                node.status({
                    fill: 'green',
                    shape: 'ring',
                    text: `[${statistics.count}] ${outputValue}`,
                });
            }
        });
    }

    RED.nodes.registerType('binsoul-statistics', StatisticsNode);
};
