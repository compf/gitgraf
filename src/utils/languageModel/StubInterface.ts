import fs from "fs"
import net from "net"



import { ChatMessage, AbstractLanguageModel, MessageType } from "./AbstractLanguageModel";
import { OutputChecker } from "./OutputChecker"
import { prettyInvalidJson, readFileSync, tryParseJSON, tryParseJSONWithSlice, writeFileSync } from "../Utils";
import {GPT4Tokenizer} from "gpt4-tokenizer"
export class StubInterface extends AbstractLanguageModel{

    private responsePath:string="stuff/response.json"
    public writeRequest=true
    public useFullPath=true
    constructor(args:any){
        super();
        Object.assign(this,args)
        
    }
  
    clear(): void {
        this.messages=[]
    }
    protected  messages:string[]=[]
    private lastUsage={
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
    }

    async  sendMessages(clear:boolean): Promise<ChatMessage> {
        if(this.writeRequest){
        writeFileSync("request.txt",this.messages.join("\n"))
        }
        let output=""
        if(this.useFullPath){
            output=fs.readFileSync(this.responsePath,{encoding:"utf-8"})
        }
        else{      
            output=readFileSync(this.responsePath)
        }
        let parsed=tryParseJSONWithSlice(output)
        if(parsed==null){
            return {messageType:"output",messages:[output]}
        }
        if("choices" in parsed){
            return {messageType:"output",messages:[
                parsed.choices[0].message.content
            ]}
        }
        else{
            return {messageType:"output",messages:[output]}
        }

       
        
        
        }

    getTokenStats(): { prompt_tokens: number; completion_tokens: number; total_tokens: number; } {
        return this.lastUsage
    
    }
     prepareMessage(message:string,messageType?:MessageType):ChatMessage{
        let chatMsg={messages:[message],messageType:messageType??"input"}
        let role="user";
        if(messageType=="system"){
            role="assistant"
        }
        this.messages.push(message)
        return chatMsg; 
           
    }
    resetParameters(parameters: { temperature: number; model: string; }) {
        
    }
 
}

export class SingleUseStubInterface extends StubInterface{
    constructor(args:any){
        super(args)
    }
    async  sendMessages(clear:boolean): Promise<ChatMessage> {
        let message=this.messages.join("\n")
        let tokenCount=new GPT4Tokenizer({type:"gpt4"}).estimateTokenCount(message)
        writeFileSync("request.txt",this.messages.join("\n")+"\n\n TokenCount:\t\t"+tokenCount)
        let requestpretty=prettyInvalidJson(this.messages)
        writeFileSync("requestPretty.txt",requestpretty)
        throw "single use"
    }
}

export class ReturnInputInterface extends StubInterface{
    async sendMessages(clear: boolean): Promise<ChatMessage> {
        return {
            messages:this.messages,
            messageType:"output"
        }
    }
}