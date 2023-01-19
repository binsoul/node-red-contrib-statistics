export interface OutputValueDefinition {
    target: string,
    property: string,
    type: string,
    channel: number
}

export class OutputDefinition extends Map<string, OutputValueDefinition> {
}
