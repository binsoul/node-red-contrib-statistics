# node-red-contrib-statistics

[![Software License][ico-license]](LICENSE.md)

This node performs statistical operations on a configurable duration of incoming events.

## Configuration

#### Output method

This algorithm is used to calculate the output value.

#### Slot resolution

Time is divided into slots with a fixed duration. Incoming events are assigned to the slot which corresponds to their timestamp rounded down to slot boundaries.

#### Number of slots

This number of slots are available. Together with the slot resolution it determines the total duration of the floating window.

#### Slot method

If more than one event is received for the same slot this method is used to calculate the value of the slot.

#### Interpolation

If there are slots without events this algorithm is used to fill them.

-   `No interpolation`

    Only the values of received events are used.

-   `Step before`

    The value of the next event is repeated from the next slot of the previous event.

-   `Step middle`

    The value of every event is repeated until the middle between this event and the next event .

-   `Step after`

    The value of previous event is repeated until the previous slot of the next event.

-   `Linear`

    Linear interpolation between event values.

-   `Cosine`

    Cosine interpolation between event values.

-   `Cubic`

    Cubic interpolation between event values.

-   `Catmull-Rom`

    Catmull-Rom interpolation between event values.

-   `Hermite (low tension)`

    Hermite interpolation between event values with a tension of -1.

-   `Hermite (normal tension)`

    Hermite interpolation between event values with a tension of 0.

-   `Hermite (high tension)`

    Hermite interpolation between event values with a tension of 1.

#### Fraction digits

The output value is either rounded to this number of fraction digits or output without rounding.

#### Update automatically

If no events are received in a certain time span updates can be triggered automatically.

-   `Never`

    Automatic updates are disabled.

-   `If no events are received`

    An update is triggered repeatedly until the timestamp of the last received event is older than the last slot.

#### Number of empty slots before update

Sets the number of slots without events before an automatic update is triggered.

#### Input value source

The value of an event is read from this variable.

#### Input timestamp source

The timestamp of an event is read from this variable.

#### Number output frequency

Sets how often a message is sent for the number output.

-   `Always`

    A message is sent for every event received.

-   `If value has changed`

    A message is only sent if the calculated output value differs from the previous one.

#### Number output target

The number output is written to this variable.

#### Object output frequency

Sets how often a message is sent for the object output.

-   `Always`

    A message is sent for every event received.

-   `If value has changed`

    A message is only sent if the calculated output value differs from the previous one.

-   `Never`

    The output is disabled.

#### Object output target

The object output is written to this variable.

## Dependencies

The node is tested with Node.js v18 and Node-RED v3. [Simple Statistics](https://github.com/simple-statistics/simple-statistics) is used to calculate output values.

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.

[ico-license]: https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square
