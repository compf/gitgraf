import fs from "fs"
import path from "path";
import { resolve } from "path";

import { FileFilteringContext, ProjectContext } from "../../../context/DataContext";
import { resolveFromConcreteName } from "../../../config/Configuration";
import { AbstractLanguageModel, ChatMessage, MessageType } from "../../../utils/languageModel/AbstractLanguageModel";
import { LanguageModelTemplateResolver } from "../../../utils/languageModel/LanguageModelTemplateResolver";
import { getRelevantFilesRec } from "../../../utils/Utils";

export type DependentOnAnotherIteratorReturnType = { messages: string[]; clear: boolean; shallSend: boolean }
export type InstructionReturnType = DependentOnAnotherIteratorReturnType & { doWrite: boolean }
export type StateInformationType = { hasOtherFinished: boolean, context: ProjectContext }

export abstract class LargeLanguageModelHandler {

    abstract handle(context: ProjectContext, api: AbstractLanguageModel, templateResolver: LanguageModelTemplateResolver): Promise<ChatMessage[]>;
}
export class SimpleInstructionHandler extends LargeLanguageModelHandler {
    private instructionPath: string
    async handle(context: ProjectContext, api: AbstractLanguageModel, templateResolver: LanguageModelTemplateResolver): Promise<ChatMessage[]> {
        let template = fs.readFileSync(this.instructionPath, { encoding: "utf-8" })
        let content = templateResolver.resolveTemplate(template)
        let messages = [api.prepareMessage(content, this.getMessageType())]
        return messages
    }
    constructor(args: { instructionPath: string }) {
        super()
        this.instructionPath = args.instructionPath
    }
    getMessageType(): MessageType {
        return "input"
    }

}
export class SystemInstructionHandler extends SimpleInstructionHandler {
    getMessageType(): MessageType {
        return "system"
    }
}





export class AllFilesHandler extends LargeLanguageModelHandler {
    protected allFiles: string[] = []
    static processed=new Set<string>
    protected counter: number = 0;
    protected sendNewFiles=false;
    fileFilteringContext: FileFilteringContext | null = null;
    preCheck(context:ProjectContext){
        this.counter = 0
        this.sendNewFiles=true;
        let usageContext = context.getRelevantLocation();
        if (usageContext == null) {
            throw new Error("Usage context not found")
        }
        let pathLinesMap: { [key: string]: Set<number> } = {}
        usageContext.getRelevantLocations(pathLinesMap)

        let messages: string[] = []
        for (let file of Object.keys(pathLinesMap)) {
            file = resolve(context.getProjectPath(), file)
            if(AllFilesHandler.processed.has(file)){
                continue;
            }
            else{
                this.sendNewFiles=false;
            }
            let name = file
            messages.push(this.getMessage(name, context))
            this.counter++;

        }
    }
    handle(context: ProjectContext, api: AbstractLanguageModel, templateResolver: LanguageModelTemplateResolver): Promise<ChatMessage[]> {
        this.counter = 0
        this.sendNewFiles=true;
        let usageContext = context.getRelevantLocation();
        if (usageContext == null) {
            throw new Error("Usage context not found")
        }
        let pathLinesMap: { [key: string]: Set<number> } = {}
        usageContext.getRelevantLocations(pathLinesMap)

        let messages: string[] = []
        for (let file of Object.keys(pathLinesMap)) {
            file = resolve(context.getProjectPath(), file)
            if(AllFilesHandler.processed.has(file)){
                continue;
            }
            else{
                this.sendNewFiles=false;
            }
            let name = file
            messages.push(this.getMessage(name, context))
            this.counter++;

        }
        let chatMessages: ChatMessage[] = []
        for (let message of messages) {
            chatMessages.push(api.prepareMessage(message))
        }
        return Promise.resolve(chatMessages)
    }
    getMessage(filePath: string, context: ProjectContext): string {
        let name = path.relative(context.getProjectPath(), filePath)
        let content = fs.readFileSync(path.resolve(context.getProjectPath(), filePath), { encoding: "utf-8" })
        return "//" + name + "\n" + content
    }

    getNextFiles(): { files: string[], done: boolean } {
        return { files: this.allFiles!, done: true };
    }


}




export interface ReExecutePreviousHandlers {
    shallReExecute(): boolean
}


export class DirectoryBasedFilesHandler extends LargeLanguageModelHandler implements ReExecutePreviousHandlers {
    private allFiles: string[] | null = null
    private baseDirFileMap: { [key: string]: string[] } = {}
    private baseDirs: string[] = []
    private index = 0
    shallReExecute(): boolean {
        return this.index < this.baseDirs.length;
    }
    handle(context: ProjectContext, api: AbstractLanguageModel, templateResolver: LanguageModelTemplateResolver): Promise<ChatMessage[]> {
        if (this.allFiles == null) {
            this.allFiles = []
            getRelevantFilesRec(context.getProjectPath(), this.allFiles, context.getByType(FileFilteringContext))
            for (let file of this.allFiles) {
                let dir = path.dirname(file)
                if (this.baseDirFileMap[dir] == null) {
                    this.baseDirFileMap[dir] = []

                }
                this.baseDirFileMap[dir].push(file)

            }
            this.baseDirs = Object.keys(this.baseDirFileMap)
        }
        let currBaseDir = this.baseDirs[this.index]
        let paths = this.baseDirFileMap[currBaseDir]
        let message = ""
        for (let p of paths) {
            let name = path.relative(context.getProjectPath(), p)
            let content = fs.readFileSync(p, { encoding: "utf-8" })
            message += "//" + name + "\n" + content + "\n"
        }
        this.index++;
        return Promise.resolve([api.prepareMessage(message)])
    }
}
enum ExtractionDirection { Up, Down, UpAndDown }

export class CodeSnippetHandler extends LargeLanguageModelHandler {
    protected additionalMargin = 0
    private includeHeader = false;
    generateLines(centerLine: number, margin: number, extractionDirection: ExtractionDirection, lines: Set<number>) {
        let start = extractionDirection == ExtractionDirection.Up || extractionDirection == ExtractionDirection.UpAndDown ? centerLine - margin : centerLine;
        let end = extractionDirection == ExtractionDirection.Down || extractionDirection == ExtractionDirection.UpAndDown ? centerLine + margin : centerLine;
        start = Math.max(0, start);

        for (let i = start; i <= end; i++) {
            lines.add(i)

        }
    }
    splitIntoBlocks(content: string, lines: Set<number>, additionalData:any): { fromLine: number, toLine: number, content: string }[] {
        let blocks: { fromLine: number, toLine: number, content: string, key?: string }[] = []
        let lastLine = -1
        let fromLine = -1;
        let firstIteration = true;
        let linesArray = Array.from(lines).sort((a: number, b: number) => a - b)
        for (let line of linesArray) {
            if (firstIteration) {
                firstIteration = false;
                fromLine = line
                lastLine = line;
                continue;
            }
            else if (line - lastLine > 1) {
                let block = { fromLine, toLine: lastLine, content: content.split("\n").slice(fromLine , lastLine).join("\n") }
                Object.assign(block, additionalData)
                blocks.push(block)
                fromLine = line
                lastLine = line
            }
            else {
                lastLine = line

            }
        }
        let block = { fromLine, toLine: lastLine, content: content.split("\n").slice(fromLine , lastLine).join("\n") }
        Object.assign(block, additionalData)
        blocks.push(block)
        return blocks;
    }
    getImportBlock(path: string, context: ProjectContext): { start:number, margin: number } {
        let content = fs.readFileSync(resolve(context.getProjectPath(), path), { encoding: "utf-8" }).split("\n");

        let start: number | null = null;
        let margin = 0;
        for (let i = 0; i < content.length; i++) {
            if (content[i].trim().startsWith("package") || content[i].trim().startsWith("import")) {
                if (start == null) {
                    start = i;
                }
            }
            else if (content[i].trim() != "") {
                if (start != null) {
                    margin = i - start;
                    return { start, margin }
                }
            }
        }
        return { start: 0, margin: 0 }

    }
    handle(context: ProjectContext, api: AbstractLanguageModel, templateResolver: LanguageModelTemplateResolver): Promise<ChatMessage[]> {
        let usageContext = context.getRelevantLocation();
        if (usageContext == null) {
            throw new Error("Usage context not found")
        }
        let pathLinesMap: { [key: string]: Set<number> } = {}
        usageContext.getRelevantLocations(pathLinesMap)
        let pathLinesMapCopy: { [key: string]: Set<number> } = {}
        for (let path of Object.keys(pathLinesMap)) {
            pathLinesMapCopy[path] = new Set<number>();
            if (this.includeHeader) {
                let headerData = this.getImportBlock(path, context)
                this.generateLines(headerData.start, headerData.margin, ExtractionDirection.Down, pathLinesMapCopy[path])
            }


            for (let line of pathLinesMap[path]) {

                this.generateLines(line, this.additionalMargin, ExtractionDirection.UpAndDown, pathLinesMapCopy[path])

            }
        }
        let resultingMessages: {
            [key: string]: {
                content: string,
                fromLine: number,
                toLine: number,
            }[]
        } = {};
        for (let path of Object.keys(pathLinesMapCopy)) {
            let content = fs.readFileSync(resolve(context.getProjectPath(), path), { encoding: "utf-8" })
            let blocks = this.splitIntoBlocks(content, pathLinesMapCopy[path], undefined)!;
            if (!(path in resultingMessages)) {
                resultingMessages[path] = []
            }
            for (let b of blocks) {
                resultingMessages[path].push(b);
            }


        }
        return Promise.resolve([api.prepareMessage(JSON.stringify(resultingMessages), "input")])
    }
    constructor(args: { additionalMargin?: number, includeHeader?: boolean }) {
        super()
        Object.assign(this, args)

    }
}

export class SendAndClearHandler extends LargeLanguageModelHandler {
    handle(context: ProjectContext, api: AbstractLanguageModel, templateResolver: LanguageModelTemplateResolver): Promise<ChatMessage[]> {
        return api.sendMessages(true).then((x:ChatMessage) => {
            return [x]
        })
    }
}
export class SendHandler extends LargeLanguageModelHandler {
    handle(context: ProjectContext, api: AbstractLanguageModel, templateResolver: LanguageModelTemplateResolver): Promise<ChatMessage[]> {
        return api.sendMessages(false).then((x:ChatMessage) => {
            return [x]
        })
    }
}
export interface RandomDecider {
    decide(context: ProjectContext): boolean
}
export class RandomIterationsDecider implements RandomDecider {
    private iterations: number
    private counter: number = 0
    decide(context: ProjectContext): boolean {
        return this.counter++ < this.iterations
    }
    constructor(args: { minIterations: number, maxIterations: number }) {
        this.iterations = Math.floor(Math.random() * (args.maxIterations - args.minIterations)) + args.minIterations
    }
}
export class RepeatInstructionRandomlyHandler extends SimpleInstructionHandler {
    private decider: RandomDecider = new RandomIterationsDecider({ minIterations: 1, maxIterations: 5 })
    async handle(context: ProjectContext, api: AbstractLanguageModel, templateResolver: LanguageModelTemplateResolver): Promise<ChatMessage[]> {
        let results: ChatMessage[] = []
        while (this.decider.decide(context)) {
            let res = await super.handle(context, api, templateResolver)
            for (let r of res) {
                results.push(r)
            }
            results.push(await api.sendMessages(false))

        }
        return results
    }
}

export function resolveHandlers(handlers: (LargeLanguageModelHandler | string)[]): LargeLanguageModelHandler[] {
    let result: LargeLanguageModelHandler[] = []
    for (let handler of handlers) {
        if (typeof handler == "string") {
            result.push(resolveFromConcreteName(handler) as LargeLanguageModelHandler)
        }
        else {
            result.push(handler)
        }
    }
    return result;
}