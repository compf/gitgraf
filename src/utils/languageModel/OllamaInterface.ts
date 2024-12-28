import fs from "fs"
import net from "net"
import ollama, { ChatResponse, Message } from "ollama"
const PORT = 1997
const HOST = "127.0.0.1"
import { Agent } from "undici";

(globalThis as any)[Symbol.for("undici.globalDispatcher.1")]  = new Agent({
    headersTimeout: 1000 * 60 * 60 * 24,
});
import http from "https"
import { ChatMessage, AbstractLanguageModel, MessageType } from "./AbstractLanguageModel";
import ChildProcessWithoutNullStreams = require("child_process");
import { OutputChecker } from "./OutputChecker"
import { resolveFromConcreteName } from "../../config/Configuration"
import { coerceBoolean } from "openai/core.mjs"
import { writeFileSync } from "../Utils"
export class OllamaInterface extends AbstractLanguageModel {
    private static staticClient: net.Socket | null = null;
    private shallClear = false;
    private newMessages: string[] = []
    private temperature = 0.1
    private model = "phind-codellama"
    constructor(args: { model: string, temperature: number, outputCheckers: string[] } | undefined) {
        super();



        let temperature: number
        if (args) {
            this.temperature = args.temperature
            this.model = args.model;


        }
        else {
            temperature = 0.9
        }


    }

    clear(): void {
        this.messages = []
    }
    private messages: Message[] = []
    private format = undefined
    private lastUsage = {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
    }
    extractJSON(response: string): string {
        let from = response.indexOf("{")
        let to = response.lastIndexOf("}") + 1
        let onlyJson = response.slice(from, to)
        console.log("ONLY Json", onlyJson);
        return onlyJson;
    }
    getContextSize(): number {
        let result = 0
        switch (this.model) {
            default:
                result = 1 << 14;
        }
        return result
    }
    async sendMessages(clear: boolean): Promise<ChatMessage> {

        if (this.messages.length == 0) return { messages: [], messageType: "output" }


        let valid = true;
        let response: ChatResponse = {} as any

        console.log("SENDING", this.messages)
        writeFileSync("request.json", JSON.stringify(this.messages,null,2))
        response = await ollama.chat({
            model: this.model,
            options: {
                temperature: this.temperature,
                num_ctx: this.getContextSize()
            },
            messages: this.messages,
            format: this.format, stream: false
        })
        this.lastUsage = {
            prompt_tokens: response.prompt_eval_count,
            completion_tokens: response.eval_count,
            total_tokens: response.prompt_eval_count + response.eval_count
        }
        console.log(response)
        this.messages.push({ content: response.message.content, role: "assistant" })
        writeFileSync("phindra_output.txt", response.message.content)

        if (clear) {
            this.clear();
        }

        return Promise.resolve({
            messageType: "output",
            messages: [response.message.content]
        })


    }





    resetParameters(parameters: { temperature: number; model: string; }) {
      

        this.model=parameters.model
        this.temperature=parameters.temperature

    }






    getTokenStats(): { prompt_tokens: number; completion_tokens: number; total_tokens: number; } {
        return this.lastUsage

    }
    prepareMessage(message: string, messageType?: MessageType): ChatMessage {
        let chatMsg = { messages: [message], messageType: messageType ?? "input" }
        let role = "user";
        if (messageType == "system") {
            role = "system"
        }

        this.messages.push({ content: message, role })
        return chatMsg;

    }

}