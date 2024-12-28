/*import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage, AbstractLanguageModel, MessageType } from "./AbstractLanguageModel";
import fs from "fs"
export class GeminiInterface implements AbstractLanguageModel{
    private model:string="gemini-pro"
    private temperature:number=0.9
    completions: { history: { role: string; parts: {text:string}[]; }[]; }={history:[]};
    api: any;
    prepareMessage(message: string, messageType?: MessageType | undefined): ChatMessage {
        
        let role="user"
        if(messageType=="output" ){
            role="model"
        }
        this.completions.history.push({role:role,parts:[{text:message}]})
        return {messageType:messageType!,messages:[message]}
    }
    constructor(args?:{model:string,temperature:number}|undefined){
        if(args){
            this.temperature=args.temperature
            this.model=args.model
        }
       
        
        this.clear()
       
    }
    async sendMessages(clear: boolean): Promise<ChatMessage> {
        let lastMessage=this.completions.history.pop()?.parts[0].text
        let chat=this.api.startChat(this.completions)
        console.log("SENDING",JSON.stringify(this.completions.history,undefined,4),lastMessage)
         if(clear){
              this.clear()
         }
         let response=await chat.sendMessage(lastMessage)
         let text=response.response.candidates[0].content.parts[0].text
         console.log(text)
         return Promise.resolve({messages:[text],messageType:"output"})
    }
    clear(): void {
        const genAI = new GoogleGenerativeAI(fs.readFileSync("tokens/GOOGLE_API_KEY",{encoding:"utf-8"}));
        this.completions={
            history: [
               
              ],
            
        }
        this.api=genAI.getGenerativeModel({ model: this.model,generationConfig:{
            temperature:this.temperature
        }});
    }
    getTokenStats(): { prompt_tokens: number; completion_tokens: number; total_tokens: number; } {
        return {} as any
    }
    resetParameters(parameters: { temperature: number; model: string; }) {
        const genAI = new GoogleGenerativeAI(fs.readFileSync("tokens/GOOGLE_API_KEY",{encoding:"utf-8"}));

        this.model=parameters.model
        this.temperature=parameters.temperature
        this.api=genAI.getGenerativeModel({ model: this.model,generationConfig:{
            temperature:this.temperature
        }});
    }

}*/