import type {Configuration} from './Configuration';
import {ValueProcessor} from './ValueProcessor';
import type {Message} from './Processing/Message';
import type {Processor} from './Processing/Processor';
import type {SetupResult} from './Processing/SetupResult';
import type {ProcessorFactory as LibProcessorFactory} from './Processing/ProcessorFactory';

export class ProcessorFactory implements LibProcessorFactory {
    private readonly configuration: Configuration;
    private processorsByTopic = new Map<string, ValueProcessor>();

    constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    build(message: Message): Processor | null {
        let topic = message.data.topic;
        if (typeof topic === 'undefined' || ('' + topic).trim() === '') {
            return null;
        }

        let processor = null;
        if (this.processorsByTopic.has(topic.toLowerCase())) {
            processor = this.processorsByTopic.get(topic.toLowerCase());
        }

        if (processor === null || typeof processor === 'undefined') {
            processor = new ValueProcessor(this.configuration);
            this.processorsByTopic.set(topic, processor);
        }

        return processor;
    }

    setup(): SetupResult | null {
        return {
            nodeStatus: {
                fill: 'yellow',
                shape: 'dot',
                text: 'binsoul-statistics.status.noEvents',
            },
        };
    }

    teardown(): void {
    }
}
