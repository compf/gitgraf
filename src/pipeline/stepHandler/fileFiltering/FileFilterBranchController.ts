import path from "path"
import { NextStepContext, ProjectContext } from "../../../context/DataContext"
import { getRelevantFilesRec } from "../../../utils/Utils"
import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep"
import { AbstractStepHandler } from "../AbstractStepHandler"
import { FileFilterStepHandler } from "./FileFilterStepHandler"
import { ExtensionBasedService, setProgrammingLanguageService } from "../../../config/Configuration"

export class FileFilterBranchController extends AbstractStepHandler {
    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        let paths:string[] =[]
        let extensionCounter:{[ext:string]:number}={}

        getRelevantFilesRec(context.getProjectPath(),paths,null)
        for(let p of paths){
            let ext=path.extname(p)
            if(ext in extensionCounter){
                extensionCounter[ext]++
            }
            else{
                extensionCounter[ext]=1
            }
        }

        let max=-1;
        let mostCommonExt=""
        for(let ext in extensionCounter){
            if(extensionCounter[ext]>max){
                max=extensionCounter[ext]
                mostCommonExt=ext
            }
        }
        setProgrammingLanguageService((["java"]))
        let filterer=new FileFilterStepHandler({
         
        })
        console.log(filterer["include"])
        return  context.buildNewContext(new NextStepContext(filterer))
       
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.FileFilteringBranchController]
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(NextStepContext.name)
    }
}