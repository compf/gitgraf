import { AbstractStepHandler } from "./stepHandler/AbstractStepHandler"
import { SimpleCodeObtainingStepHandler } from "./stepHandler/codeObtaining/SimpleCodeObtainingStepHandler";
import { SimpleRelevantLocatioDectectionStep } from "./stepHandler/relevantLocationDetection/SimpleRelevantLocationDetectionStep";
export type PipeLineStepName = "CodeObtaining" | "FileFiltering" | "RelevantLocationDetection" | "RelevantLocationFiltering" 
export type PipeLineStepType = {
    position: number,
    name: PipeLineStepName,
    isRequired: boolean,
    defaultHandler: AbstractStepHandler | undefined,
    associatedContext: string|null
}
export namespace PipeLineStep {
    export const CodeObtaining: PipeLineStepType = {
        position: 0,
        name: "CodeObtaining",
        isRequired: true,
        defaultHandler: new SimpleCodeObtainingStepHandler({useArgPath:true,path:null}),
        associatedContext: "CodeObtainingContext"
    };
    export const FileFiltering: PipeLineStepType = {
        position: 1,
        name: "FileFiltering",
        isRequired: false,
        defaultHandler: undefined,
        associatedContext:"FileFilteringContext"
    };
    export const RelevantLocationDetection: PipeLineStepType = {
        position: 1,
        name: "RelevantLocationDetection",
        isRequired: true,
        defaultHandler: new SimpleRelevantLocatioDectectionStep(),
        associatedContext:"FileFilteringContext"
    };
    export const RelevantLocationFiltering: PipeLineStepType = {
        position:5,
        name: "RelevantLocationFiltering",
        isRequired: false,
        defaultHandler: undefined,
        associatedContext:null
    };

    
    


}
