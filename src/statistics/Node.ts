import type {Node, NodeInitializer} from 'node-red';
import type {UserConfiguration} from './UserConfiguration';
import {buildConfiguration} from './ConfigurationBuilder';
import {ActionFactory} from './ActionFactory';
import {MessageHandler} from './Processing/MessageHandler';

const nodeInitializer: NodeInitializer = (RED): void => {
    function NodeConstructor(this: Node, userConfiguration: UserConfiguration): void {
        const node = this;
        RED.nodes.createNode(node, userConfiguration);

        const configuration = buildConfiguration(userConfiguration);
        const actionFactory = new ActionFactory(RED, node, configuration);
        const messageHandler = new MessageHandler(RED, node, actionFactory);

        actionFactory.setup();

        node.on('input', (msg, send, done) => messageHandler.handle(msg, send, done));
        node.on('close', () => actionFactory.teardown());
    }

    RED.nodes.registerType('binsoul-statistics', NodeConstructor);
};

export = nodeInitializer;
