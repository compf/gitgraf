/**
 * The configuration fo the tool, especially the handling of objects and the pipeline
 * is done here
 */
import { ContainerBuilder } from "node-dependency-injection"
import { AbstractStepHandler } from "../pipeline/stepHandler/AbstractStepHandler"
import fs from "fs"
import { resolve,relative,sep } from "path"
import { PipeLineStep } from "../pipeline/PipeLineStep"
import { PipeLine } from "../pipeline/PipeLine"
import { FileFilteringContext, ProjectContext } from "../context/DataContext"
import { getRelevantFilesRec } from "../utils/Utils"
export type PipeLineStepConf={
    handler:string,
    contextSerializationPath?:string,
    args:any
}
export interface ProgrammingLanguageService {
    getExtension(): string
}

export class JavaService implements ProgrammingLanguageService {
    getExtension(): string {
        return ".java"
    }
}
export type Configuration={
    ProgrammingLanguageIdentifier:string,
    PipeLine:{
        [key:string]:PipeLineStepConf
    },
    Objects:{[key:string]:{type?:string,args?:any}}
    
}
const pathPrefix="../pipeline/stepHandler/"

const nameScriptFileMap:{[key:string]:any}={
  
    
}

export function getDataClumpThreshold(dataClumpTyo:string):number{
    return 3;
}
function createExcludePattern():string[]{
    if(sep=="\\"){
        return [resolve("dist","eclipse.jdt.ls").replaceAll("\\","\\\\")+sep+".*",".*js\.ma"]
    }
    else{
        return ["dist/eclipse.jdt.ls/.*",".*js\.ma"]
    }
}
/**
 * Loads all classes of the project and create a map of the class name to the actual class
 * This creates a register that can be used to retrieve objects easily
 */
function loadAllClasses(){
    let paths:string[]=[]
    let startTime=Date.now()
    getRelevantFilesRec(resolve("./dist","src",),paths,new FileFilteringContext([".*\.js$"],createExcludePattern(),false))
    for(let path of paths){
        console.log("Loading "+path)
        if (path.endsWith("Configuration.js") || path.endsWith(".map")){
            continue;
        }
        let relativized=relative(__dirname,path)
        let content=require(relativized)
        for(let cls of Object.keys(content)){
            nameScriptFileMap[cls]=relativized
        }
    }
    console.log("Loaded all classes in "+(Date.now()-startTime)+"ms")

}
const container=new ContainerBuilder();
   export function registerFromName(typeName:string,categoryName:string,args:any){
    let requirePath=typeName
    if(Object.keys(nameScriptFileMap).includes(typeName)){
        requirePath=nameScriptFileMap[typeName]
    }
    const loadedScript= require(requirePath);
    container.register(categoryName,loadedScript[typeName]).addArgument(args);
}

/**
 * resolves a class from the interface name, e.g. "AbstractLanguageModel"
 */
export function resolveFromInterfaceName(interfaceName:string): any {
   return container.get(interfaceName)
}
/**
 * 
 * @param concreteName a class name
 * @returns the existing instance of the class, fails if the class is not registered
 */
export function resolveFromConcreteName(concreteName:string):any{
    return container.get(concreteName) 
}

export function  isRegistered(concreteName:string):boolean{
    return container.has(concreteName)
}

export  function resolveOrRegister(name:string, args:any){
    if(isRegistered(name)){
        return resolveFromConcreteName(name)
    }
    else{
        registerFromName(name,name,args)
        return resolveFromConcreteName(name)
    }
}

export function assignOrResolve(target:any, args:any, defaultValues:any){
    if(args==undefined || args==null)return;
    for(let key of Object.keys(args)){
        if(typeof(args[key])=="string" && isRegistered(args[key])){
            target[key]=resolveFromConcreteName(args[key])
        }
        else{
            target[key]=args[key]
        }
    }

    for(let key of Object.keys(defaultValues)){
        if(target[key]==undefined){
            target[key]=defaultValues[key]
        }
    }
}
let programmingLanguageService:ProgrammingLanguageService
export function setProgrammingLanguageService(name:string){
    name=name.toLowerCase()
    switch(name){
        case "java":
            programmingLanguageService=new JavaService()
            break;
    }
}

export function getProgrammingLanguageService():ProgrammingLanguageService{
    return programmingLanguageService
}   
export function processConfiguration(config:Configuration){
    setProgrammingLanguageService(config.ProgrammingLanguageIdentifier)
    for(let step of Object.keys(PipeLineStep)){
        if(config.PipeLine[step] && config.PipeLine[step].handler){
            registerFromName(config.PipeLine[step].handler,step,config.PipeLine[step].args)
           
        }
    }
    if("Objects" in config){
        for(let key of Object.keys(config.Objects)){
            let args=config.Objects[key].args
            let type=config.Objects[key].type
            if(type==undefined || type==null){
                type=key
            }
            registerFromName(type,key,args)
        }
    }
       // register in the pipeline
       for(let steps of Object.keys(config.PipeLine)){
        let splitted=steps.split(",").map((x)=>x.trim())
        PipeLine.Instance.registerHandler(splitted.map((x)=>(PipeLineStep as any)[x] ),resolveFromConcreteName(splitted[0]) as AbstractStepHandler)
    }
    if(!PipeLine.Instance.checkPipeLine()){
        throw new Error("Pipeline is not correct")
    }
    
 
}
export function loadConfiguration(path:string):ProjectContext{
    let config=JSON.parse(fs.readFileSync(path).toString()) as Configuration
    let initialContext=new ProjectContext()
    processConfiguration(config)
    initialContext.setConfig(config)
    return initialContext
    
}
export function activateLoader(){
    loadAllClasses()
}

