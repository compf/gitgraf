import { registerFromName, resolveFromConcreteName } from "../config/Configuration";
import { EvaluationContext, MandatoryContextNames, NextStepContext, ProjectContext } from "../context/DataContext";
import { loadExistingContext } from "../context/ExistingContextLoader";
import { PipeLineStep, PipeLineStepType } from "./PipeLineStep";
import { AbstractStepHandler } from "./stepHandler/AbstractStepHandler";
function difference<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    let result = new Set<T>();
    for (let item of set1) {
        if (!set2.has(item)) {
            result.add(item)
        }
    }
    return result;

}
const NumberPipeLineSteps = Object.keys(PipeLineStep).length
export class PipeLine {
    public static readonly Instance = new PipeLine()
    private stepHandlerList: AbstractStepHandler[] = Array(NumberPipeLineSteps).fill(null);
    private stepRunningTimes: { [stepName: string]: number } = {}
    registerHandler(steps: PipeLineStepType[], handler: AbstractStepHandler) {
        for (let step of steps) {
            if (handler.canDoStep(step) && this.stepHandlerList[step.position] == null) {
                this.stepHandlerList[step.position] = handler;
            }
            else {
                throw new Error("Handlercannot execute step " + step.name)
            }
        }
    }
   
    async executeAllSteps(context: ProjectContext): Promise<ProjectContext> {
        return await this.executeSteps(Object.values(PipeLineStep), context)
    }
    async executeSteps(pipeLineSteps: PipeLineStepType[], context: ProjectContext): Promise<ProjectContext> {
       
        for (let i = 0; i < NumberPipeLineSteps; i++) {
            let deserializedContext = loadExistingContext(pipeLineSteps[i], context)
            if (deserializedContext != null && this.stepHandlerList[i] != null) {
                deserializedContext = this.stepHandlerList[i].deserializeExistingContext(deserializedContext, pipeLineSteps[i])
            }
            if (deserializedContext != null) {
                console.log("Deserialized context for step " + pipeLineSteps[i].name)
                context = context.buildNewContext(deserializedContext);
                continue;
            }
            let handler=this.stepHandlerList[i]
            if(!handler){
                let defaultHandlerName=pipeLineSteps[i].defaultHandler
                if(defaultHandlerName){
                    registerFromName(defaultHandlerName,defaultHandlerName,{})
                    handler=resolveFromConcreteName(defaultHandlerName)

                }
            }
            if(handler && pipeLineSteps[i].isBranchController ){
                context=await handler.handle(pipeLineSteps[i],context,null)
                let nextStepContext=context.getByType(NextStepContext );
                if(nextStepContext){
                    this.registerHandler([pipeLineSteps[i+1]],nextStepContext.getNextStep()!)
                }
            }
            else if(handler){
                let startTime = Date.now();
                console.log("Executing step " + pipeLineSteps[i].name)
                context = await handler.handle(pipeLineSteps[i], context, null);
                this.stepRunningTimes[pipeLineSteps[i].name] = Date.now() - startTime;
                console.log("Step " + pipeLineSteps[i].name + " executed in " + this.stepRunningTimes[pipeLineSteps[i].name] + " ms")
                context.serialize()
            }
           
            else {

                console.log("No handler for step " + pipeLineSteps[i].name + " " + i)

            }
        }
        let finalContext = context.buildNewContext(new EvaluationContext(this.stepRunningTimes))
        finalContext.serialize();
        return finalContext

    }

}


