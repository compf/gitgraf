/*import { resolveFromInterfaceName } from "../../config/Configuration";
import { DataClumpDetectorContext, ProjectContext } from "../../context/DataContext";
import { AbstractLanguageModel } from "./AbstractLanguageModel";


export class TolerantOutputParser{
    private parsers:{(text:string,context:ProjectContext):any}[]
    private api:AbstractLanguageModel;
    constructor(api:AbstractLanguageModel,parsers:{(text:string,context:ProjectContext):any}[] ){
        this.parsers=parsers;
        this.api=api;
    }

    async send(clear:boolean, context:ProjectContext):Promise<any>{
        
        let result= await this.api.sendMessages(clear);
        let content=result.messages[result.messages.length-1]
        for(let p of this.parsers){
            let parsed=p(content,context)
            if(parsed){
                return Promise.resolve(parsed)
            }
        }
        throw "Could not parse "+content
    }

}*/