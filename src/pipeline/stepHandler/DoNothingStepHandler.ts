import { ProjectContext } from "../../context/DataContext";
import { PipeLineStep,PipeLineStepType } from "../PipeLineStep";
import { AbstractStepHandler } from "./AbstractStepHandler";

/**
 * A step handler that does nothing
 */
export class DoNothingStepHandler extends AbstractStepHandler {
    handle(step:PipeLineStepType,context: ProjectContext, params:any) {
        return Promise.resolve(context);
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.FileFiltering,PipeLineStep.RelevantLocationDetection,PipeLineStep.RelevantLocationFiltering]

    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
    }
    
}