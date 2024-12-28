import fs from "fs"
import OpenAI from 'openai';
import { ChatMessage, AbstractLanguageModel, MessageType, TokenStats } from "./AbstractLanguageModel";
type Formats = "json_object" | "text"
import { HttpsProxyAgent } from 'https-proxy-agent';
import { prettyInvalidJson, writeFileSync } from "../Utils";
export class ChatGPTInterface extends AbstractLanguageModel {

    resetParameters(parameters: { temperature: number; model: string; }) {
        this.completions.model = parameters.model
        this.completions.temperature = parameters.temperature
    }
    private api: OpenAI;
    // whether the response is in json or text format, if JSON the request must contain the word 'JSON'
    private format?: string = "json_object"
    // if this file exists, a proxy is used
    private proxy = fs.existsSync("tokens/use_proxy")
    constructor(args: { model: string, temperature: number, format?: Formats } | undefined) {
        super();
        let model: string
        let temperature: number
        if (args) {
            model = args.model
            temperature = args.temperature
            if (args.format) {
                this.format = args.format
            }
        }
        else {
            model = "gpt-4-1106-preview"
            temperature = 0.9
        }
        this.completions = {
            messages: [],
            model: model,
            response_format: { type: this.format as any },
            temperature: temperature,
        }
        this.api = new OpenAI({
            apiKey: this.loadToken(),


        });
        if (this.proxy) {
            this.api.httpAgent = new HttpsProxyAgent("http://www-proxy.rz.uni-osnabrueck.de:80")
        }

    }
    clear(): void {
        this.completions.messages = []
        this.lastUsage = {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
        }
    }
    private completions: OpenAI.ChatCompletionCreateParamsNonStreaming
    private lastUsage: TokenStats = {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
    }

    loadToken(): string {
        return fs.readFileSync("tokens/CHATGPT_TOKEN", { encoding: "utf-8" })
    }
    async sendMessages(clear: boolean): Promise<ChatMessage> {
        if (this.completions.messages.length == 0) return { messages: [], messageType: "output" }
        console.log("SENDING", this.completions.messages)
        writeFileSync("request.json", JSON.stringify(this.completions, undefined, 4))
        // create a pretty version of the request, which can be read easily, e.g. for debugging
        let requestpretty = prettyInvalidJson(this.completions)
        writeFileSync("requestPretty.txt", requestpretty)
        let messages: string[] = []
        let shallContinue = false;
        let responseTimes: number[] = []
        do {
            let startTime = Date.now()
            let response = await this.api.chat.completions.create(this.completions);
            let elapsed = Date.now() - startTime;
            this.completions.messages.push({ content: response.choices[0].message.content, role: "assistant" })
            this.lastUsage = {
                completion_tokens: this.lastUsage.completion_tokens! + response.usage?.completion_tokens!,
                prompt_tokens: this.lastUsage.prompt_tokens! + response.usage?.prompt_tokens!,
                total_tokens: this.lastUsage.total_tokens! + response.usage?.total_tokens!,

            }
            responseTimes.push(elapsed)
            messages.push(response.choices[0].message.content!)
            if (response.choices[0].finish_reason == "length") {
                // instruct the model to continue if output was cut off
                this.completions.messages.push({ content: "continue", role: "user" })

                shallContinue = true;
            }
            else {
                shallContinue = false;;
            }

        } while (shallContinue);
        // calcukate average response time
        this.lastUsage.elapsedTime = responseTimes.reduce((partialSum, a) => partialSum + a, 0) / responseTimes.length;

        writeFileSync("stats.json", JSON.stringify(this.lastUsage, undefined, 4))
        if (clear) {
            this.clear()
        }
        writeFileSync("response.json", (messages.join("\n")))
        let responsePretty = prettyInvalidJson(messages.join("\n"))
        writeFileSync("responsePretty.txt", responsePretty)

        return { messages: messages, messageType: "output" }
    }
    getTokenStats(): TokenStats {
        return this.lastUsage

    }
    prepareMessage(message: string, messageType?: MessageType): ChatMessage {
        let role = "user"
        if (messageType == "system") {
            role = "system"
        }
        if (messageType == "output") {
            role = "assistant"
        }
        this.completions.messages.push(
            {
                content: message,
                role: role as any,


            })
        return { messages: [message], messageType: "input" }

    }

}