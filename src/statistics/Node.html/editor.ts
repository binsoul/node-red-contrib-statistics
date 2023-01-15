import type {EditorNodeProperties, EditorRED} from 'node-red';
import type {ConfigurationOptions} from '../Configuration';

declare const RED: EditorRED;

interface NodeEditorProperties extends EditorNodeProperties, ConfigurationOptions {
    outputs: number;
}

RED.nodes.registerType<NodeEditorProperties>('binsoul-statistics', {
    category: 'function',
    color: '#A6BBCF',
    defaults: {
        outputMethod: {
            value: 'mean',
            required: true,
        },
        slotCount: {
            value: 15,
            required: true,
            validate: RED.validators.number(),
        },
        slotResolutionNumber: {
            value: 1,
            required: true,
            validate: RED.validators.number(),
        },
        slotResolutionUnit: {
            value: 'minutes',
            required: true,
        },
        slotMethod: {
            value: 'mean',
            required: true,
        },
        interpolation: {
            value: 'stepAfter',
            required: true,
        },
        output1Frequency: {
            value: 'changes',
            required: true,
        },
        output2Frequency: {
            value: 'never',
            required: true,
        },
        name: {value: ''},
        outputs: {value: 1},
    },
    inputs: 1,
    icon: 'font-awesome/fa-list-ol',
    label: function() {
        const duration = this.slotCount * this.slotResolutionNumber;
        const unitName = this._('binsoul-statistics.option.resolution.' + this.slotResolutionUnit);
        const methodName = this._('binsoul-statistics.option.method.' + this.outputMethod);
        return this.name || `${methodName} (${duration} ${unitName})`;
    },
    labelStyle: function() {
        return this.name ? 'node_label_italic' : '';
    },
    paletteLabel: 'statistics',
    inputLabels: 'Incoming message',
    outputLabels: ['Number output', 'Object output'],
    oneditprepare: function() {
        let node = this;
        node.outputs = $('#node-input-output2Frequency').val() !== 'never' ? 2 : 1;
        $('#node-input-output2Frequency').on('change', function() {
            node.outputs = (<HTMLInputElement>this).value !== 'never' ? 2 : 1;
        });
    },
    oneditsave: function() {
        let node = this;
        node.outputs = $('#node-input-output2Frequency').val() !== 'never' ? 2 : 1;
    },
});
