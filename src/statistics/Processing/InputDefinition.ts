export interface InputValueDefinition {
    source: string,
    property: string,
    type: string,
    required: boolean
    default?: any
}

export class InputDefinition extends Map<string, InputValueDefinition> {
}
