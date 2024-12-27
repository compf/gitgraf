import { Readable, Writable } from "stream";
import { ChildProcess, spawn } from "child_process"
import { resolve } from "path"
import fs from "fs"
import { LanguageServerAPI, LSP_State } from "./LanguageServerAPI";
import { tryParseJSON } from "../utils/Utils";
import { ResponseMessage } from "vscode-languageserver";
const commandExistsSync = require('command-exists').sync;


 export type Socket ={
    reader:Readable,
    writer:Writable
 }


/**
 * API for Eclipse LSP
 */
export class EclipseLSP_API extends LanguageServerAPI {

    runEclipse(): ChildProcess {
        fs.rmSync(resolve("dist/eclipse.jdt.ls/org.eclipse.jdt.ls.product/target/repository/temp"), { recursive: true, force: true })
        let epinoxPath = this.getEpinoxPath()!;

        let cp = spawn("java", [
            "-Declipse.application=org.eclipse.jdt.ls.core.id1",
            "-Dosgi.bundles.defaultStartLevel=4",
            "-Declipse.product=org.eclipse.jdt.ls.core.product",
            "-Dlog.level=ALL",
            "-Xmx1G",
            "--add-modules=ALL-SYSTEM",
            "-jar", epinoxPath,
            "-configuration", "./config_linux",
            "-data", "./temp"],
            {
                stdio: "pipe",
                cwd: resolve("dist/eclipse.jdt.ls/org.eclipse.jdt.ls.product/target/repository")
            });
        return cp;
    }

    private getEpinoxPath(): string | null {
        let basePath = resolve("dist/eclipse.jdt.ls/org.eclipse.jdt.ls.product/target/repository/plugins")
        for (let p of fs.readdirSync(basePath)) {
            if (p.startsWith("org.eclipse.equinox.launcher_")) {
                return resolve(basePath, p)
            }
        }
        return null;
    }

    checkCompatibleWithSystem(): void {
        if(!commandExistsSync("java")){
            throw new Error("Java not found. Please install java")
        }
        if (!fs.existsSync(resolve("dist/eclipse.jdt.ls/org.eclipse.jdt.ls.product/target/repository"))) {
            throw new Error(`
                Eclipse JDT LS not found. Please build the eclipse.jdt.ls project
                Copy the project folder (eclipse.jdt.ls) into the 'dist folder' of the data_clump_solver project
                `)
        }
        let epinoxPath = this.getEpinoxPath();
        if (epinoxPath == null) {
            throw new Error("Epinox path not found. Please buiild the eclipse.jdts.ls project")
        }
    }
    async init(path: string, callback: { (data: ResponseMessage): void }): Promise<{ reader: Readable; writer: Writable; }> {
        let cp = this.runEclipse();
        this.childProcess = cp;
        cp.stderr!.on("data", (d) => {
            console.log("ERROR", d.toString())
        })

        super.callInitialize(cp.stdin!, path);
        let buffer = ""
        let data = cp.stdout!.on("data", (data: Buffer) => {
            let s = data.toString("utf-8")
            s = s.replace(/\}C/g, "\}\r\n\r\nC")
            s = buffer + s;
            //console.log(s)

            let splitted = s.split("\r\n");
            for (let line of splitted) {
                if (line.startsWith("Content-Length: ")) {
                }
                else if (line.startsWith("{")) {
                    let content = tryParseJSON(line)
                    if (content == null) {
                        buffer = line;
                        return;
                    }
                    else {
                        buffer = "";
                    }
                    if (this.currState == LSP_State.NotInitialized && content.id == 1 && this.first) {
                        this.first = false;
                        this.currState = LSP_State.Initialized;
                        console.log("sending init")
                        super.callInitialized(cp.stdin!)
                        cp.stdout!.emit("initialized")

                    }
                    else {
                        callback(content as ResponseMessage)
                    }

                }
            }
        })

        return new Promise(resolve => {
            data.on("initialized", () => {
                resolve({ reader: cp.stdout!, writer: cp.stdin! })
            })

        });
    }
}


