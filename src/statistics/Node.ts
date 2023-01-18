import type {Node, NodeInitializer} from 'node-red';
import type {UserConfiguration} from './UserConfiguration';
import {buildConfiguration} from './ConfigurationBuilder';
import {ProcessorFactory} from './ProcessorFactory';
import {MessageHandler} from './Processing/MessageHandler';

const nodeInitializer: NodeInitializer = (RED): void => {
    function NodeConstructor(this: Node, userConfiguration: UserConfiguration): void {
        const node = this;
        RED.nodes.createNode(node, userConfiguration);

        const configuration = buildConfiguration(userConfiguration);
        const processorFactory = new ProcessorFactory(configuration);
        const messageHandler = new MessageHandler(RED, node, processorFactory);

        const setupResult = processorFactory.setup();
        if (setupResult !== null) {
            if (setupResult.nodeStatus !== null) {
                node.status(setupResult.nodeStatus);
            }
        }

        node.on('input', (msg, send, done) => messageHandler.handle(msg, send, done));
        node.on('close', () => processorFactory.teardown());
    }

    RED.nodes.registerType('binsoul-statistics', NodeConstructor);
};

export = nodeInitializer;
