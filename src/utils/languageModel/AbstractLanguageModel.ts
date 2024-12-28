export type MessageType="input" | "output"|"system"
export type ChatMessage = { messages: string[], messageType: MessageType }
export const AbstractLanguageModelCategory = "AbstractLanguageModel"
export type TokenStats={
     prompt_tokens?: number,
     completion_tokens?: number,
     total_tokens?: number,
     elapsedTime?:number

}
export abstract class AbstractLanguageModel {
     abstract prepareMessage(message: string,messageType?:MessageType): ChatMessage;
     abstract sendMessages(clear: boolean): Promise<ChatMessage>
     abstract clear(): void
     abstract getTokenStats():TokenStats
     abstract resetParameters(parameters:{temperature:number,model:string}):void
}