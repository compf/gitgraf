import fs from "fs"
import net from "net"

import {resolve } from "path"

import { ChatMessage, AbstractLanguageModel, MessageType } from "./AbstractLanguageModel";
import { OutputChecker } from "./OutputChecker"
import { writeFileSync } from "../Utils";

/**
 * Iteratively returns the content of files in a directory
 */
export class DirectoryBasedStubInterface extends AbstractLanguageModel{

    private responsePath:string="response.txt"
    private  allPaths:string[]=[];
    private index=0;
    constructor(args:any){
        super();
       this.responsePath=args.responsePath
       this.allPaths=fs.readdirSync(args.responsePath)
        
    }
  
    clear(): void {
        this.messages=[]
    }
    private  messages:string[]=[]
    private lastUsage={
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
    }

    async  sendMessages(clear:boolean): Promise<ChatMessage> {
        if(this.index>=this.allPaths.length){
            Promise.resolve({messageType:"output",messages:["No more responses"]})
        }
        writeFileSync("request.txt",this.messages.join("\n"))
        let output=fs.readFileSync(resolve(this.responsePath,this.allPaths[this.index++]),{encoding:"utf-8"})
        return {messageType:"output",messages:[
            output
        ]}
        
        
        
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