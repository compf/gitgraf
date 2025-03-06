import { AbstractStepHandler } from "./stepHandler/AbstractStepHandler"
import { SimpleCodeObtainingStepHandler } from "./stepHandler/codeObtaining/SimpleCodeObtainingStepHandler";
export type PipeLineStepName = 
    "CodeObtaining" | 
    "FileFiltering" | 
    "FileFilteringBranchController" | 
    "RelevantLocationDetectionBranchController"|
    "RelevantLocationDetection" | 
    "RelevantLocationFilteringBranchController" |
    "RelevantLocationFiltering" |
    "ArtifactGenerationBranchController" |
    "ArtifactGeneration";


let counter=0;
export type PipeLineStepType = {
    position: number,
    name: PipeLineStepName,
    isBranchController: boolean,
    defaultHandler?: string
}
export namespace PipeLineStep {
    export const CodeObtaining: PipeLineStepType = {
        position: counter++,
        name: "CodeObtaining",
        isBranchController:false,
        defaultHandler: "SimpleCodeObtainingStepHandler"
    };

    export const FileFilteringBranchController: PipeLineStepType = {
        position: counter++,
        name: "FileFilteringBranchController",
        isBranchController:true,
        defaultHandler: "FileFilterBranchController"
    }
    export const FileFiltering: PipeLineStepType = {
        position: counter++,
        name: "FileFiltering",
        isBranchController:false,
        defaultHandler: undefined,
    };

    export const RelevantLocationDetectionBranchController: PipeLineStepType = {
        position: counter++,
        name: "RelevantLocationDetectionBranchController",
        isBranchController:true,
        defaultHandler: undefined
    }
    export const RelevantLocationDetection: PipeLineStepType = {
        position: counter++,
        name: "RelevantLocationDetection",
        isBranchController:false,
        defaultHandler:"LargeLinesAreRelevantDetectionStepHandler"
    };

    export const RelevantLocationFilteringBranchController: PipeLineStepType = {
        position: counter++,
        name: "RelevantLocationFilteringBranchController",
        isBranchController:true,
        defaultHandler: undefined
    }
    export const RelevantLocationFiltering: PipeLineStepType = {
        position:counter++,
        name: "RelevantLocationFiltering",
        isBranchController:false,
        defaultHandler: undefined,
    };

    export const ArtifactGenerationBranchController: PipeLineStepType = {
        position: counter++,
        name: "ArtifactGenerationBranchController",
        isBranchController:true,
        defaultHandler: undefined
    };

    export const ArtifactGeneration: PipeLineStepType = {
        position: counter++,
        name: "ArtifactGeneration",
        isBranchController:false,
        defaultHandler: "ExplainCodeArtificactGeneratorStepHandler"
    }

    
    


}
