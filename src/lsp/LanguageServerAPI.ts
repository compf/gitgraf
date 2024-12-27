import { Readable, Writable } from "stream";
import {resolve} from "path"
import url from "url"
import { MyCapabilities } from "./Capabilities";
import { spawn ,ChildProcess} from "child_process"
import { InitializeParams, ResponseMessage } from "vscode-languageserver";
export enum Methods {
    Initialize = "initialize",
    Initialized = "initialized",
    DidOpen = "textDocument/didOpen",
    References = "textDocument/references",
    Definition = "textDocument/definition",
    Implementation="textDocument/implementation",
    WorkspaceSymbols="workspace/symbol",
    DocumentSymbols="textDocument/documentSymbol",
}
export enum LSP_State{NotInitialized,Initialized}

export abstract class LanguageServerAPI {
    protected childProcess: ChildProcess|null=null;
    protected first:boolean=true;
    protected currState:LSP_State=LSP_State.NotInitialized;

    abstract init(path:string,callback:{(data:ResponseMessage):void}): Promise<{ reader: Readable; writer: Writable; }>
    callInitialized(socket: Writable) {
        let msg = this.create_request_message(2, Methods.Initialized, {})
        socket.write(msg)
    }
    abstract checkCompatibleWithSystem():void
    create_request_message(id: string | number, method: Methods, params: any): string {
        let content = JSON.stringify({ jsonrpc: "2.0", id, method, params })
        let header = "Content-Length: " + content.length + "\r\n\r\n";
        console.log("sending",  content)
        return header + content;
    }
    close(){
        console.log("closing")
        if(this.childProcess!=null){
            this.childProcess.kill()
            this.first=true;
            this.currState=LSP_State.NotInitialized
            console.log("killed")
        }
    }
    callInitialize(socket: Writable, path:string) {
        const initParam: InitializeParams = {
            processId: process.pid,
            //workspaceFolders: [{ name: "Pokemon_Sirius", uri: "PokemonSirius" }],
            "rootUri":url.pathToFileURL(resolve(path)).toString(),
            capabilities: MyCapabilities,
            trace: "verbose",
            initializationOptions:{
                settings: {
                    java:{
                        references:{
                            includeAccessors:false
                        }
                    }
                }
            }
            
        }
        let msg = this.create_request_message(1, Methods.Initialize, initParam)
        //console.log(msg)
        socket.write(msg)

    }
}
