import { fileURLToPath } from "url";
import { ProjectContext, RelevantLocationsContext } from "../../../context/DataContext";
import { ChatGPTInterface } from "../../../utils/languageModel/ChatGPTInterface";
import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";
import fs from "fs"
import { CodeSnippetHandler, LargeLanguageModelHandler, SimpleInstructionHandler } from "../languageModelSpecific/ContextToModelHandlers";
import { LanguageModelTemplateResolver } from "../../../utils/languageModel/LanguageModelTemplateResolver";
export class ExplainCodeArtificactGeneratorStepHandler extends AbstractStepHandler{
    private handler:LargeLanguageModelHandler=new CodeSnippetHandler({additionalMargin:1})
    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        let llm=new ChatGPTInterface({
            model:"gpt-4o-mini",
            temperature:0.9,
            format:"json_object"
        })

        let relContext=context.getByType(RelevantLocationsContext)!
        let instruction=new SimpleInstructionHandler({instructionPath:"templates/explain_code_snippets.template"})
        await instruction.handle(context,llm,new LanguageModelTemplateResolver({}))
        await this.handler.handle(context,llm,new LanguageModelTemplateResolver({}));
      
        let res=await llm.sendMessages(true)
        console.log(res)
        return context
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.ArtifactGeneration]
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        throw new Error("Method not implemented.");
    }

}