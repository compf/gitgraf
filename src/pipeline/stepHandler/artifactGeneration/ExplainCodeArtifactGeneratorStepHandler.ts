import { fileURLToPath } from "url";
import { ProjectContext, RelevantLocationsContext } from "../../../context/DataContext";
import { ChatGPTInterface } from "../../../utils/languageModel/ChatGPTInterface";
import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";
import fs from "fs"
import { CodeSnippetHandler, LargeLanguageModelHandler, SimpleInstructionHandler } from "../languageModelSpecific/ContextToModelHandlers";
import { LanguageModelTemplateResolver } from "../../../utils/languageModel/LanguageModelTemplateResolver";
import { ChildProcess, execSync } from "child_process";
import { bisectParseInvalidJSON, parseInvalidJSON, tryParseJSON } from "../../../utils/Utils";
import { StubInterface } from "../../../utils/languageModel/StubInterface";
import { AbstractLanguageModel } from "../../../utils/languageModel/AbstractLanguageModel";
type ExplanationData={[p:string]:{
    fromLine:number,
    toLine:number,
    explanation:string,
    content:string
}[]}
export class ExplainCodeArtificactGeneratorStepHandler extends AbstractStepHandler{
    private handler:LargeLanguageModelHandler=new CodeSnippetHandler({additionalMargin:1})
    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        let llm:AbstractLanguageModel=new ChatGPTInterface({
            model:"gpt-4o-mini",
            temperature:0.9,
            format:"json_object"
        })
        llm=new StubInterface(
            {
                responsePath:"/home/compf/data/PokemonSirius/core/.gitgraf_data/proposals/response1740738398774.json"
            }
        )

        let relContext=context.getByType(RelevantLocationsContext)!
        let instruction=new SimpleInstructionHandler({instructionPath:"templates/explain_code_snippets.template"})
        await instruction.handle(context,llm,new LanguageModelTemplateResolver({}))
        await this.handler.handle(context,llm,new LanguageModelTemplateResolver({}));
      
        let res=await llm.sendMessages(true)
        let explanationData=bisectParseInvalidJSON(res.messages[0]) as ExplanationData
        let output=this.createHtmlCodeFromExplanations(explanationData)
        fs.writeFileSync(context.getProjectPath()+"/explanations.html",output)
        execSync("firefox "+context.getProjectPath()+"/explanations.html")
        console.log(res)
        return context
    }
    private createHtmlCodeFromExplanations(explanations: ExplanationData): string {
        let content=`<html><head><style>
        pre{
        background-color:#f4f4f4;
        padding:10px;
        border-radius:5px;
        }
        </style>
        </head>
        <body>`;

        for(let p of Object.keys(explanations)){
            content+="<h1>"+p+"</h1>"
            for(let e of explanations[p]){
                let c=e.content.replace(/</g,"&lt;").replace(/>/g,"&gt;")
                content+="<pre>"+c+"</pre>"
                content+="<br/>"
                content+="<p><i>"+e.explanation+"</i></p>"
                content+="<hr/>"
            }
            
        }

       
        content+="</body></html>"
        return content;
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.ArtifactGeneration]
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        throw new Error("Method not implemented.");
    }

}