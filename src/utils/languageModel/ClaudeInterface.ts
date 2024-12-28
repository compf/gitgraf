/*import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage, AbstractLanguageModel, MessageType, TokenStats } from "./AbstractLanguageModel";
import fs from "fs"
export class ClaudeInterface implements AbstractLanguageModel{
    private model:string="gemini-pro"
    private temperature:number=0.9
   private messages: { role: "user"|"assistant"; content:string }[]=[];
    private api?:Anthropic;
    tokenStats: { prompt_tokens?: number ; completion_tokens?: number ; total_tokens?:number ; }={
        prompt_tokens:0,
        completion_tokens:0,
        total_tokens:0
    }
    prepareMessage(message: string, messageType?: MessageType | undefined): ChatMessage {
        
        let role:"user"|"assistant"="user"
        if(messageType=="output" ){
            role="assistant"
        }
        this.messages.push({role:role,content:message})
        return {messageType:messageType!,messages:[message]}
    }
    fixMessages(){
        let finalMessage=this.messages[0].content+"\n###JAVA SNIPPETS###\n"+this.messages.slice(1).map((x)=>x.content).join("\n")+"\n###END JAVA SNIPPETS ###\n"
        this.clear()
        this.messages.push({role:"user",content:finalMessage})
    }
    constructor(args?:{model:string,temperature:number}|undefined){
        if(args){
            this.temperature=args.temperature
            this.model=args.model
        }
        this.api=new Anthropic(
            {
                apiKey:fs.readFileSync("tokens/CLAUDE_TOKEN",{encoding:"utf-8"})
            }
        )
       
        
        this.clear()
       
    }
    async sendMessages(clear: boolean): Promise<ChatMessage> {
        console.log("SENDING",JSON.stringify(this.messages))
        this.fixMessages()
       let response=await this.api?.messages.create(
            {
                messages:this.messages,
                model:this.model,
                temperature:this.temperature,
                max_tokens:1<<32
            }
        )!

      
         if(clear){
              this.clear()
         }
       
         let text=response.content[0].text
         this.tokenStats={
                prompt_tokens:response?.usage.input_tokens,
                completion_tokens:response?.usage.output_tokens,
                total_tokens:response?.usage.input_tokens??0 + response.usage.output_tokens ?? 0 
         }
         
         console.log(text)
         return Promise.resolve({messages:[text],messageType:"output"})
    }
    clear(): void {
        this.messages=[]
    }
    getTokenStats():TokenStats {
        return this.tokenStats
    }
    resetParameters(parameters: { temperature: number; model: string; }) {
        this.model=parameters.model
        this.temperature=parameters.temperature
    }

}*/