export interface InputItem {
    source: string,
    property: string,
    type: string,
    required: boolean
    default?: any
}

export class InputDefinition extends Map<string, InputItem> {
}
