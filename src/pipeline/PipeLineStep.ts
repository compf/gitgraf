import { AbstractStepHandler } from "./stepHandler/AbstractStepHandler"
import { SimpleCodeObtainingStepHandler } from "./stepHandler/codeObtaining/SimpleCodeObtainingStepHandler";
export type PipeLineStepName = "CodeObtaining" | "FileFiltering" | "ASTGeneration" | "SimilarityDetection" | "DataClumpDetection" | "DataClumpFiltering" | "NameFinding" | "ClassExtraction" | "ReferenceFinding" | "Refactoring" | "Validation"
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
        name: "FileFiltering",
        isRequired: false,
        defaultHandler: undefined,
        associatedContext:"FileFilteringContext"
    };
    export const RelevantLocationFiltering: PipeLineStepType = {
        position:5,
        name: "DataClumpFiltering",
        isRequired: false,
        defaultHandler: undefined,
        associatedContext:null
    };
    export const ReferenceFinding: PipeLineStepType = {
        position:6,
        name: "ReferenceFinding",
        isRequired: false,
        defaultHandler: undefined,
        associatedContext:"UsageFindingContext"
    };
    
    


}
