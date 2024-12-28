import { CodeObtainingContext, ProjectContext } from "../../../context/DataContext";
import { PipeLineStep,PipeLineStepType } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";
import { resolve } from "path";
type SimpleCodeObtainingStepHandlerParams={
    path:string|null|undefined
    useArgPath:boolean
}
export class SimpleCodeObtainingStepHandler extends AbstractStepHandler{
    private path?: string;
    handle(step:PipeLineStepType,context: ProjectContext, params:any): Promise<ProjectContext> {
        if(context.getByType(CodeObtainingContext)){
            return Promise.resolve(context)
        }
        if(this.path==undefined){
            this.path=context.sharedData.path
        }
        this.path=resolve(this.path!);
        return Promise.resolve(context.buildNewContext(new CodeObtainingContext(this.path)))
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.CodeObtaining]
    }
    constructor(args:SimpleCodeObtainingStepHandlerParams){
        super();
        if(args.useArgPath){
            this.path=undefined
        }
        else{
            this.path=args.path!!;
        }
        
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(CodeObtainingContext.name)
    }
    
}