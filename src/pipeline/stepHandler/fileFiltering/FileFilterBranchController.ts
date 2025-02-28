import path from "path"
import { NextStepContext, ProjectContext, ProjectInformationContext } from "../../../context/DataContext"
import { getRelevantFilesRec } from "../../../utils/Utils"
import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep"
import { AbstractStepHandler } from "../AbstractStepHandler"
import { FileFilterStepHandler } from "./FileFilterStepHandler"
import { ExtensionBasedService, setProgrammingLanguageService } from "../../../config/Configuration"
import { RandomMetric } from "../../../utils/filterUtils/RandomRanker"
import { ComplexityMetric } from "../../../utils/filterUtils/ComplexityMetric"

const commonProgrammingLanguageExtensions=[
    ".java",
    ".kt",
    ".ts",
    ".js",
    ".py",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".rb",
    ".cs",
    ".php",
    ".html",
    ".css",
    ".scss",
    ".less",
    ".xml",
    ".json",
    ".yaml",
    ".yml",
    ".sql",
    ".sh",
    ".bat",
    ".cmd",
    ".ps1",
]
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
            if(extensionCounter[ext]>max && commonProgrammingLanguageExtensions.includes(ext)){
                max=extensionCounter[ext]
                mostCommonExt=ext
            }
        }
        setProgrammingLanguageService(([mostCommonExt.slice(1)]));
        let numberFiles=Math.pow(paths.length,0.6);
        let filterer=new FileFilterStepHandler({
            rankThreshold:numberFiles,
            metric: new ComplexityMetric()
        })
        console.log(filterer["include"])
        context=context.buildNewContext(new ProjectInformationContext(mostCommonExt.slice(1)))
        context=  context.buildNewContext(new NextStepContext(filterer))
        return context;
       
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.FileFilteringBranchController]
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(NextStepContext.name)
    }
}