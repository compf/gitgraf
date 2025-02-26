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
import { SingleItemFilter } from "../utils/filterUtils/SingleItemFilter"
import { GlobFilter } from "../utils/filterUtils/GlobFilter"
import { AnyMultipleFilter } from "../utils/filterUtils/AnyMultipleFilter"
export type PipeLineStepConf={
    handler:string,
    contextSerializationPath?:string,
    args:any
}
export interface ProgrammingLanguageService {
    getFileExtensionGlobFilter():SingleItemFilter
}

export class ExtensionBasedService implements ProgrammingLanguageService {
    private extensions:string[]
    constructor(extensions:string[]){
        this.extensions=extensions
    }
   getFileExtensionGlobFilter(): SingleItemFilter {
    return new AnyMultipleFilter( {filters:this.extensions.map((ext)=>new GlobFilter({glob:".*\\"+ext}))})
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
    let context=new FileFilteringContext(
        {
            globs:[".*\.js$"],
            fileTree:{}
        },
        {
            globs:createExcludePattern(),
            fileTree:{}
        },
        false
    );
     
    
    getRelevantFilesRec(resolve("./dist","src",),paths,context)
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
export function setProgrammingLanguageService(extensions:string[]){
    programmingLanguageService=new ExtensionBasedService(extensions)
}

export function getProgrammingLanguageService():ProgrammingLanguageService{
    return programmingLanguageService
}   
export function processConfiguration(config:Configuration){
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
   
    
 
}
export function loadConfiguration(path:string):ProjectContext{
    if(fs.existsSync(path)){
        let config=JSON.parse(fs.readFileSync(path).toString()) as Configuration
        let initialContext=new ProjectContext()
        processConfiguration(config)
        initialContext.setConfig(config)
        return initialContext
    }
    else{
        return new ProjectContext();
    }
   
    
}

export function resolveNameOrReturn(it:  any): any {
    if (typeof it === 'string') {
        return resolveFromConcreteName(it);
    }
    return it;
}

export function activateLoader(){
    loadAllClasses()
}

