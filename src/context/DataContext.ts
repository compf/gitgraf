import fs from "fs"
import path from "path"
import { resolve } from "path";
import { getRelevantFilesRec, makeUnique, nop, shallIgnore, waitSync } from "../utils/Utils";
import { Configuration } from "../config/Configuration";
import simpleGit from "simple-git";
import { ChatMessage } from "../utils/languageModel/AbstractLanguageModel";
import { Range } from "vscode-languageserver";
import { AbstractStepHandler } from "../pipeline/stepHandler/AbstractStepHandler";
import { fileURLToPath } from "url";

export function getContextSerializationBasePath(context:ProjectContext):string{
const folderName=".gitgraf_data"

    let outputPath=resolve(context.getProjectPath(),folderName)
    if(!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath)
        if(fs.existsSync(resolve(context.getProjectPath(),".git"))){
            let exclude=fs.readFileSync(resolve(context.getProjectPath(),".git","info","exclude"),{encoding:"utf-8"})
            exclude+="\n"+folderName
            fs.writeFileSync(resolve(context.getProjectPath(),".git","info","exclude"),exclude)
        }
    }
    return outputPath
}
export function getContextSerializationPath(targetContext:ProjectContext|null,context:ProjectContext):string{

    let result= targetContext!=null ? targetContext: context;
    return resolve(getContextSerializationBasePath(context),result.getDefaultSerializationPath())
}
export  class ProjectContext {
    protected previousContext: ProjectContext | null = null;

    getPreviousContext(): ProjectContext | null {
        return this.previousContext
    }
    buildNewContext(context: ProjectContext): ProjectContext {
        if(context==this){
            return this;
        }
        context.previousContext = this
        context.sharedData = this.sharedData
        return context
    }
    fail(message: string) {
        throw new Error(message)

    }
    getContextNames():Set<string>{
        let result=new Set<string>();
        let curr: ProjectContext = this;
        while (curr != null) {
            result.add(curr.constructor.name)
            curr = curr.previousContext!
        }
        return result;
    }

    setConfig(config: Configuration) {
        this.sharedData["config"]=config 
    }
    public sharedData: { [key: string]: any } = {}

    /**
     * traverse the context from tail to head until the context with the given type is found
     */
    getByType<T>(ctor: new (...a: any) => T): T | null {
        let curr: ProjectContext = this;
        while (!(curr instanceof ctor)) {
            curr = curr.previousContext!
            if (curr == null) {
                return null;
            }

        }
        return curr as T
    }
    /**
     * Traverses the context from head to tail until the context with the given type is found
     */
    getFirstByType<T>(ctor: new (...a: any) => T): T | null {
        let curr: ProjectContext|null = this;
        let best:ProjectContext|null=null;
        while (curr!=null) {
            if(curr instanceof ctor){
                best=curr;
            }
            curr=curr.previousContext;
            

        }
        return best as T;
    }
    getRelevantLocation():RelevantLocationsContext|null{
        let curr: ProjectContext = this;
        while (!("getRelevantLocations" in curr)) {
            curr = curr.previousContext!
            if (curr == null) {
                return null;
            }

        }
        return curr as RelevantLocationsContext
    }

    getProgrammingLanguage():string{
        return this.sharedData["config"].ProgrammingLanguage
    }
    getProjectPath(): string {
        return this.getByType(CodeObtainingContext)!!.getPath()
    }
     serialize(){}
     getSerializationPath():string{
         return getContextSerializationPath(this,this)
     }
     getDefaultSerializationPath(): string {
        return  "other.json"
    }
}

export class NextStepContext extends ProjectContext{
    private nextStep:AbstractStepHandler|null=null
    constructor(nextStep:AbstractStepHandler) {
        super()
        this.nextStep=nextStep
    }
    getNextStep():AbstractStepHandler|null{
        return this.nextStep
    }
}


/**
 * Contains only the path of the project
 */
export class CodeObtainingContext extends ProjectContext {
    path: string;
    getPath(): string {
        return this.path
    }
    getPosition(): number {
        return 0;
    }
    constructor(path: string) {
        super()
        this.sharedData["path"]= path
        this.path = path
    }
}
/**
 * Provides additional Git operations
 */
export class GitRepositoryContext extends ProjectContext {
    async getLastCommittedDate(path:string):Promise<Date>{
        return new Promise<Date>(async (resolve,reject)=>{
            let gitHelper=simpleGit(this.getProjectPath())
            let result=await gitHelper.log({file:path,format:"%ad"},(err,log)=>{
                resolve(new Date(Date.parse((log["latest"]! as any)["date"])))
            })
        })
       
    }
    async getAllCommittedDates(path:string):Promise<Date[]>{
        return new Promise<Date[]>(async (resolve,reject)=>{
            let gitHelper=simpleGit(this.getProjectPath())
            let result=await gitHelper.log({file:path,format:"%ad"},(err,log)=>{
                resolve(log.all.map((it)=>new Date(Date.parse(((it as any))["date"]))))
            })
        })
       
    }

    async getRecentlyChangedFiles(upTo:number, context:FileFilteringContext):Promise<string[]>{
        let gitHelper=simpleGit(this.getProjectPath())
        let files:Set<string>=new Set<string>()
        let log=await gitHelper.log(["--stat"]);
        for(let entry of log.all){
            let currFiles=entry.diff?.files.map((it)=>it.file.replace(".../"  ,""))||[]
            for(let file of currFiles){
                if(!shallIgnore(file,context)){
                    shallIgnore(file,context)
                    files.add(file)
                    //console.log(file)

                }
                if(files.size>=upTo){
                    break;
                }
            }
            if(files.size>=upTo){
                break;
            }
        }
        return Array.from(files)        
    }
    

}
export type FileTree={[key:string]:FileTree}
export type FilterInformation={
    globs:string[],
    fileTree:FileTree
}
/**
 * Context that contains include and exclude globs to filter files
 */
export class FileFilteringContext extends ProjectContext {
    includeData:FilterInformation
    excludeData:FilterInformation
    includePrevails: boolean=true;
    customFilters:boolean=false;
    constructor(includeData: FilterInformation, excludeData: FilterInformation, includePrevails?: boolean) {
        super()
        this.includeData = includeData
        this.excludeData = excludeData
        this.includePrevails = includePrevails ?? true
    }
    getPosition(): number {
        return 1;
    }
}

export class LargeLanguageModelContext extends ProjectContext {
    private chat:ChatMessage[]=[]   
    constructor(chat:ChatMessage[]) {
        super();
        this.chat=chat
    }
    getChat():ChatMessage[]{
        return this.chat
    }
}
export type RelevantLocation = {
    uri: string,
    name: string,
    location: Range,
    kind: number
}
export  class RelevantLocationsContext extends ProjectContext{
    relevantLocations:RelevantLocation[]=[]
    constructor(relevantLocations:RelevantLocation[]) {
        super()
        this.relevantLocations=relevantLocations
    }
    getRelevantLocations(lines:{[path:string]:Set<number>}):void{
        for(let loc of this.relevantLocations){
            let p=fileURLToPath(loc.uri)

            if(!(p in lines)){
                lines[p]=new Set<number>()
            }
            for(let i=loc.location.start.line;i<=loc.location.end.line;i++){
                lines[p].add(i)
            }
        }
    }

    serialize(): void {
        const usedPath=this.getSerializationPath()
        fs.writeFileSync(usedPath, JSON.stringify(this.relevantLocations))
    }
    getDefaultSerializationPath(): string {
        return "relevantLocations.json"
    }
}

export class ArtifactGenerationContext extends ProjectContext {
    public artifacts :(RelevantLocation & {llmOutput:string})[]
    constructor(artifacts:(RelevantLocation & {llmOutput:string})[]) {
        super()
        this.artifacts=artifacts
    }
}


export class EvaluationContext extends ProjectContext {
    runningTimes:{[stepName:string]:number}={}
    constructor(runningTimes:{[stepName:string]:number}) {
        super()
        this.runningTimes=runningTimes
    }
    serialize(path?: string | undefined): void {
        const usedPath=this.getSerializationPath()
        fs.writeFileSync(usedPath, JSON.stringify(this.runningTimes))
    
    }
}

export const MandatoryContextNames=[CodeObtainingContext.name]
