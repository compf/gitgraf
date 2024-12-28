import { resolve } from "path";
import url  from "url"
import { SymbolInformation, DocumentSymbolParams, ReferenceParams } from "vscode-languageserver";
import { FileFilteringContext, ProjectContext, RelevantLocation, RelevantLocationsContext } from "../../../context/DataContext";
import { EclipseLSP_API, Socket } from "../../../lsp/EclipseLSP_API";
import { Methods } from "../../../lsp/LanguageServerAPI";
import { PipeLineStepType, PipeLineStep } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";
import {getRelevantFilesRec} from "../../../utils/Utils"
export class SimpleRelevantLocatioDectectionStep extends AbstractStepHandler {
    handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        return this.findSymbols(context)
       
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.RelevantLocationDetection];
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(RelevantLocationsContext.name)
    }

    counter: number = 3;
    api: EclipseLSP_API = new EclipseLSP_API()
    balance:number=0;
    visitedSymbols = new Set<string>()
    projectPathUrl?:string;
    projectPath?:string;




    pathIds: Set<string> = new Set<string>()
    async findSymbols(context:ProjectContext):Promise<ProjectContext> {
        let visitedPaths = new Set<string>()
        let pathStack:string[] = []
        this.projectPathUrl=url.pathToFileURL(context.getProjectPath()).toString()
        this.projectPath=context.getProjectPath()
        getRelevantFilesRec(context.getProjectPath(),pathStack,context.getByType(FileFilteringContext))
        let symbolStack: RelevantLocation[] = []
        return new Promise<ProjectContext>(async handleResolver => {
            let socket = await this.api.init(this.projectPathUrl!, (data) => {
              
                if(data.id==undefined || data.id=="1")return;
                console.log("receivingU",data)
                this.balance--;
                
                if (this.pathIds.has(data.id! + "")) {
                    console.log("is path")

                    let results = data.result as any[]
                    if(results==undefined)return;
                    for (let r of results) {
                        let symbol: RelevantLocation = {
                            uri: r.location.uri,
                            name: r.name,
                            location: r.location.range,
                            kind: r.kind
                        };
                        let str=JSON.stringify(symbol,undefined,2)

                        if(!(this.visitedSymbols.has(str))){
                            this.visitedSymbols.add(str)
                            symbolStack.push(symbol)
                            this.balance++;
                            this.findReferences(symbol,socket)
                        }
                        if(!visitedPaths.has(symbol.uri)){
                            visitedPaths.add(symbol.uri)
                            pathStack.push(symbol.uri)
                            this.balance++
                            this.findSymbolsInFile(symbol.uri, socket)
                        }
                    }

                }
                else{
                    let results=data.result as any[]
                    if(results==undefined)return;

                    for(let r of results){
                            let symbol={
                                uri:r.uri,
                                name:r.name,
                                location:r.range,
                                kind:r.kind
                            }
                            let str=JSON.stringify(symbol,undefined,2)

                        if(!(this.visitedSymbols.has(str))){
                            this.visitedSymbols.add(str)
                            symbolStack.push(symbol)
                            this.balance++
                            this.findReferences(symbol,socket)
                        }
                    }

                }
                console.log("balance",this.balance)
                if(this.balance==0){

                    console.log("#####################")

                    for(let s of this.visitedSymbols){
                        console.log(s)
                    }
                    console.log("##########################")
                    this.api.close()
                    let symbols:RelevantLocation[]=[]
                    for(let s of this.visitedSymbols){
                        symbols.push(JSON.parse(s))
                    }
                    handleResolver(  context.buildNewContext(new RelevantLocationsContext(symbols)))
                }
            });

            {
                for (let p of pathStack) {
                    p=url.pathToFileURL(resolve(context.getProjectPath(),p)).toString()
                    console.log("path stack",p)
                    this.findSymbolsInFile(p,socket)
                    this.balance++;
                }
                for (let s of symbolStack) {
                    console.log("symbol stack",s)
                    this.findReferences(s, socket)
                    this.balance++
                }
            }
           
        })


    }

    findSymbolsInFile(path: string, socket: Socket) {
        let params: DocumentSymbolParams = {
            textDocument: {
                uri: path
            }
        }
        let id = (this.counter++) + ""
        let msg = this.api.create_request_message(id, Methods.DocumentSymbols, params)
        this.pathIds.add(id)
        socket.writer.write(msg)

    }

    findReferences(s: RelevantLocation, socket: Socket) {
        let params: ReferenceParams = {
            textDocument: {
                uri: s.uri
            },
            position: {
                line: s.location.start.line,
                character: s.location.start.character
            },
            context: {
                includeDeclaration: false
            }
        }
        let id = (this.counter++) + ""
        let msg = this.api.create_request_message(id, Methods.References, params)
        socket.writer.write(msg)
    }
}