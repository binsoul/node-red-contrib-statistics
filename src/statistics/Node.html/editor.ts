import type {EditorNodeProperties, EditorRED} from 'node-red';
import type {UserConfigurationOptions} from '../UserConfiguration';

declare const RED: EditorRED;

interface NodeEditorProperties extends EditorNodeProperties, UserConfigurationOptions {
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
        precision: {
            value: 'infinite',
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
        inputValueProperty: {
            value: 'payload',
            required: true,
        },
        inputValueSource: {
            value: 'msg',
            required: true,
        },
        inputTimestampProperty: {
            value: '',
            required: false,
        },
        inputTimestampSource: {
            value: 'date',
            required: true,
        },
        output1ValueProperty: {
            value: 'payload',
            required: true,
        },
        output1ValueTarget: {
            value: 'msg',
            required: true,
        },
        output2ValueProperty: {
            value: 'payload',
            required: true,
        },
        output2ValueTarget: {
            value: 'msg',
            required: true,
        },
        updateMode: {
            value: 'never',
            required: true,
        },
        updateFrequency: {
            value: 5,
            required: true,
            validate: RED.validators.number(),
        },
        name: {value: ''},
        outputs: {value: 1},
    },
    inputs: 1,
    icon: 'font-awesome/fa-list-ol',
    label: function() {
        const duration = (this.slotCount || 15) * (this.slotResolutionNumber || 1);
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
        let output2FrequencyInput = $('#node-input-output2Frequency');
        node.outputs = output2FrequencyInput.val() !== 'never' ? 2 : 1;
        output2FrequencyInput.on('change', function() {
            node.outputs = (<HTMLInputElement>this).value !== 'never' ? 2 : 1;
        });

        $('#node-input-inputValueProperty').typedInput({
            typeField: '#node-input-inputValueSource',
            types: ['msg', 'flow', 'global'],
            default: 'msg',
        });

        $('#node-input-inputTimestampProperty').typedInput({
            typeField: '#node-input-inputTimestampSource',
            types: ['date', 'msg', 'flow', 'global'],
            default: 'date',
        });

        $('#node-input-output1ValueProperty').typedInput({
            typeField: '#node-input-output1ValueTarget',
            types: ['msg', 'flow', 'global'],
            default: 'msg',
        });

        $('#node-input-output2ValueProperty').typedInput({
            typeField: '#node-input-output2ValueTarget',
            types: ['msg', 'flow', 'global'],
            default: 'msg',
        });
    },
    oneditsave: function() {
        let node = this;
        node.outputs = $('#node-input-output2Frequency').val() !== 'never' ? 2 : 1;
    },
});
