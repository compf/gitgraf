import { ProjectContext } from "../../../context/DataContext";
import { PipeLineStepType } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";
import fs from "fs"
import { resolve } from "path"
import {  assignOrResolve, resolveFromConcreteName, resolveFromInterfaceName } from "../../../config/Configuration";
import { LargeLanguageModelHandler } from "./ContextToModelHandlers";
import { OutputHandler, parseChat } from "./ModelToContextHandlers";
import { randInt } from "../../../utils/Utils";
import { AbstractLanguageModel, ChatMessage } from "../../../utils/languageModel/AbstractLanguageModel";
import { LanguageModelTemplateResolver } from "../../../utils/languageModel/LanguageModelTemplateResolver";


export interface NumberAttemptsProvider{
    getNumberAttempts(context:ProjectContext):number

}
export class ConstantNumberAttemptsProvider implements NumberAttemptsProvider{
    private numberAttempts:number
    constructor(numberAttempts:number){
        this.numberAttempts=numberAttempts
    }
    getNumberAttempts(context: ProjectContext): number {
        return this.numberAttempts
    }
}

export class ProposalsNumberAttemptsProvider implements NumberAttemptsProvider{
    path: string | undefined;
    constructor(args:{path?:string}){
        this.path=args.path
    }
    getNumberAttempts(context: ProjectContext): number {
       let path=this.path??resolve(context.getProjectPath(),".gitgraf_data","proposals")
       return fs.readdirSync(path).length
    }

}
export  abstract class LanguageModelStepHandler extends AbstractStepHandler {
    protected handlers: LargeLanguageModelHandler[] = []
    private providedApi: AbstractLanguageModel | null = null
    private temperatures: number[] = [0.9]
    private lastTemp = 0;
    private models: string[] = [""]
    private numberAttempts: NumberAttemptsProvider;;
    private outputHandler: OutputHandler|null=null; 

   
    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        let api: AbstractLanguageModel;
        if (this.providedApi != null) {
            api = this.providedApi
        }
        else {
            api = resolveFromInterfaceName(AbstractLanguageModel.name) as AbstractLanguageModel
        }
        let templateResolver = resolveFromConcreteName(LanguageModelTemplateResolver.name) as LanguageModelTemplateResolver
        this.providedApi = api
        let handlerIndex = 0
        let numberAttempts=this.numberAttempts.getNumberAttempts(context);

        for (let i = 0; i < numberAttempts; i++) {
            api.clear();
            let temperature = this.temperatures[randInt(this.temperatures.length)]
            this.lastTemp = temperature
            let model = "gpt-4-1106-preview"
            api.resetParameters({ model, temperature })
            let chat: ChatMessage[] = []

            for (handlerIndex = 0; handlerIndex < this.handlers.length; handlerIndex++) {
                let handler = this.handlers[handlerIndex]
                console.log("Running attempt "+i+" with handler "+handler.constructor.name )
                let messages = await handler.handle(context, api, templateResolver)
                chat.push(...messages)
            }
            let reply = chat[chat.length - 1];
            await parseChat(chat, step, context,this.outputHandler!)
        }
        let proposal=await this.outputHandler!.chooseProposal(context)
        return proposal



    }
   


    constructor(args: { handlers: string[], numberAttempts:string | number }) {
        super();
        assignOrResolve(this, args,{})
        if(typeof(args.numberAttempts)=="number"){
            this.numberAttempts=new ConstantNumberAttemptsProvider(args.numberAttempts)
        }
        else if(args.numberAttempts==undefined){
            this.numberAttempts=new ConstantNumberAttemptsProvider(1)
        }
        else{
            this.numberAttempts=resolveFromConcreteName(args.numberAttempts) as NumberAttemptsProvider
        }
        this.handlers = []

        for (let handler of args.handlers) {
            this.handlers.push(resolveFromConcreteName(handler) as LargeLanguageModelHandler)
        }

    }



    

}