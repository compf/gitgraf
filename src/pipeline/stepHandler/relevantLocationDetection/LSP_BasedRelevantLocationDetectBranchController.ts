import { NextStepContext, ProjectContext } from "../../../context/DataContext";
import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";

export class LSP_BasedRelevantLocationDetectBranchController extends AbstractStepHandler {
  
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.RelevantLocationDetectionBranchController];
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(NextStepContext.name)
    }
    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        return context
    }
}