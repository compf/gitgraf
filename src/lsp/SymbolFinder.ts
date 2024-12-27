import { DocumentSymbolParams, Range, ReferenceParams, WorkspaceSymbolParams } from "vscode-languageserver";
import { EclipseLSP_API, Socket } from "./EclipseLSP_API";
import { Methods } from "./LanguageServerAPI";
import { waitSync } from "../utils/Utils";
import { url } from "inspector";
export type SymbolInformation = {
    uri: string,
    name: string,
    location: Range,
    kind: number
}
export class SymbolFinder {

    counter: number = 3;
    api: EclipseLSP_API = new EclipseLSP_API()
    balance:number=0;

    pathIds: Set<string> = new Set<string>()
    async findSymbols() {
        let visitedPaths = new Set<string>()
        let visitedSymbols = new Set<string>()
        let pathStack = ["file:///home/compf/data/uni/master/sem4/data_clump_solver/javaTest/javaTest/src/main/java/org/example/MathStuff.java"]
        let symbolStack: SymbolInformation[] = []
        return await new Promise<any>(async handleResolver => {
            const projectPath = "/home/compf/data/uni/master/sem4/data_clump_solver/javaTest/javaTest"
            let socket = await this.api.init(projectPath, (data) => {
              
                if(data.id==undefined || data.id=="1")return;
                console.log("receivingU",data)
                this.balance--;
                
                if (this.pathIds.has(data.id! + "")) {
                    console.log("is path")

                    let results = data.result as any[]
                    if(results==undefined)return;
                    for (let r of results) {
                        let symbol: SymbolInformation = {
                            uri: r.location.uri,
                            name: r.name,
                            location: r.location.range,
                            kind: r.kind
                        };
                        let str=JSON.stringify(symbol,undefined,2)

                        if(!(visitedSymbols.has(str))){
                            visitedSymbols.add(str)
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

                        if(!(visitedSymbols.has(str))){
                            visitedSymbols.add(str)
                            symbolStack.push(symbol)
                            this.balance++
                            this.findReferences(symbol,socket)
                        }
                    }

                }
                console.log("balance",this.balance)
                if(this.balance==0){

                    console.log("#####################")

                    for(let s of visitedSymbols){
                        console.log(s)
                    }
                    console.log("##########################")
                    this.api.close()
                    handleResolver("")
                }
            });

            {
                for (let p of pathStack) {
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

    findReferences(s: SymbolInformation, socket: Socket) {
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