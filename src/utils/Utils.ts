import { FileFilteringContext } from "../context/DataContext";
import fs from "fs"
import path from "path";
import {createHash} from "crypto"
import { FileIO } from "./FileIO";
const { jsonrepair } = require('jsonrepair')
export const MiniMatchConf = { dot: true, matchBase: true,debug:false };
  /** 
* Recursively traverse through the directory and find all relevant files
* @param baseDir the current directory to enumerate the files there
* @param resultArray will be filled during the recursion to store all relevant files
* @param fileFilteringContext a context to filter the files
*/
export function getRelevantFilesRec(baseDir: string, resultArray: string[],fileFilteringContext:FileFilteringContext|null): void {
    let entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (let entry of entries) {
        let fullname = path.join(baseDir, entry.name);
        
        if (entry.isDirectory()) {
            getRelevantFilesRec(fullname, resultArray,fileFilteringContext);
        } else {
            if (shallIgnore(fullname,fileFilteringContext)) {
                continue;
            }
            resultArray.push(fullname);
        }
    }
}

/**
 * Determines if a file should be ignored based on the file path and the file filtering context
 * @param filePath a file path
 * @param fileFilteringContext the file filtering context 
 * @returns true if file should be ignored
 */
export function  shallIgnore(filePath: string,fileFilteringContext:FileFilteringContext|null): boolean {

    if (fileFilteringContext == null) {
        return false
    }
    let splitted=filePath.split(path.sep)

    let includeGlobs = fileFilteringContext.includeData.globs
    let excludeGlobs = fileFilteringContext.excludeData.globs
    let isIncluded =false;
    let isExcluded = false
    let includePrevails=fileFilteringContext.includePrevails
    let current=fileFilteringContext.includeData.fileTree;
    let oneIteration=false;
    if(Object.keys(current).length>0){
        for(let s of splitted){
            if(s in current){
                current=current[s];
                oneIteration=true;
            }
            
            else{
                isIncluded=false;
                oneIteration=false;
                break;
            }
        }
    }
    if(oneIteration){
        isIncluded=true;
    }
    
 
    for (let includeGlob of includeGlobs) {
        
       

        if (filePath.match(includeGlob)) {
            isIncluded = true
            break
        }
    }
    current=fileFilteringContext.excludeData.fileTree;
    oneIteration=false;
    if(Object.keys(current).length>0){
        for(let s of splitted){
            if(s in current){
                current=current[s]
                oneIteration=true;
            }
            else  {
                isExcluded=false;
                oneIteration=false;
                break;
            }
    
        }
    }
    if(oneIteration){
        isExcluded=true;
    }


    for (let excludeGlob of excludeGlobs) {
        if (filePath.match(excludeGlob)) {
            isExcluded = true
            break
        }
    }
    if(isExcluded){
        if(isIncluded && includePrevails){
            return false;
        }
        return true;
    }
    return !isIncluded
}

/**
 * Waits for a certain amount of time
 * @param ms  the time to wait in milliseconds
 */
export function waitSync(ms:number){
    let start = Date.now();
    while (Date.now() < start + ms);
}

/**
 * compares two numbers
 * @param a number 1
 * @param b number 2
 * @returns 0 if they are equal, 1 if a is greater than b, -1 if a is smaller than b
 */
export function compareTo(a:number,b:number){
    if(a==b){
        return 0
    }
    if(a>b){
        return 1
    }
    return -1
}

/**
 * try to parse a JSON string or return null
 * @param jsonString a JSON string
 * @returns a JSON object or null
 */
export function tryParseJSON(jsonString:string){
    try{
        return JSON.parse(jsonString)
    }catch(e){
       // console.log("JSON Error",e)
        return null
    }
}

/**
 * try to parse JSON embedded in a string
 * @param jsonString a text that might contain JSON
 * @param remainaing used to return the text that is not part of the JSON
 * @returns 
 */
export function tryParseJSONWithSlice(jsonString:string, remaining?:{remaining:string}){
    let original=jsonString;
    let parsed=tryParseJSON(jsonString);
    if(parsed==null){
        let start=jsonString.indexOf("{")
        let end=jsonString.lastIndexOf("}")+1
        jsonString=jsonString.slice(start,end);
        if(remaining){
            remaining.remaining=original.replace(jsonString,"")
        }
        return tryParseJSON(jsonString);
    }
    return parsed;
}
/**
 * parse the JSON, if not valid returns extensive debugging information
 * @param json  a JSON string
 * @returns a JSON object and error message if the JSON is invalid
 */
export function parseJSONDetailed(json:string):{jsonResult:any,errorMessage?:string} {
    try {
        let result= JSON.parse(json);
        return {jsonResult:result,errorMessage:undefined}
    } catch (e:any) {
         let errorMessage=""
        if (e instanceof SyntaxError) {
            const match = /position (\d+)/.exec(e.message);
           
            if (match) {
                const ContextSize=40
                const position = parseInt(match[1], 10);
                errorMessage='Invalid JSON at position:'+ position+'\nError near: ' + json.slice(Math.max(0, position - ContextSize), position) + ContextSize+"\n"+json.charAt(position)

            } else {
                errorMessage=e.message;
            }
            console.error(errorMessage)
            return {jsonResult:null,errorMessage}
        } else {
            errorMessage=e.message;
        }
        console.error(errorMessage)
        return {jsonResult:null,errorMessage}
        
    }
}



/**
 * generates a random int
 * @param max the maximum value (exclusive)
 * @returns 
 */
export function randInt(max:number){
    return Math.floor(max*Math.random())
}

export function nop(){}

/**
 * Makes an array unique
 * @param array the array to make unique
 * @param keyFunction a mapper to obtain a key from the array elements
 * @returns a unique array
 */
export function makeUnique<T>(array:T[], keyFunction?:{(o:T):string}):T[]{
    if(keyFunction){
        let keys=new Set<string>();
        let result:T[]=[]
        for(let a of array){
            if(!keys.has(keyFunction(a))){
                keys.add(keyFunction(a))
            }
            else{
                continue;
            }
            result.push(a);
        }
        return Array.from(result)
    }
    return Array.from(new Set(array))
}
/**
 * Helper function to print a Jsoon so that it is readable but invalid
 * @param obj a object to print
 * @returns a string representing the object
 */
export function prettyInvalidJson(obj:any){
    let  result=prettyInvalidJsonRec(obj,0)
    return result;

}
function prettyInvalidJsonRec(obj:any, depth:number):string{
    let text=""
    let indent="\t".repeat(depth)
    if(obj==null || obj==undefined)return ""
    if(typeof(obj)=="string"){
        return "\""+obj+"\"";
    }
    for(let key of Object.keys(obj)){
        if(key=="modifiers"){
            nop();
        }
        text+=indent+key+":"
        let value=obj[key];
         if( typeof(value)!="string"  && Array.isArray(value)){
            text+="\n"+indent+"[\n"
            for(let v of value){
        
                let result=prettyInvalidJsonRec(v,depth+1);
                text+=result+",\n"


                
               

            }
            text+="\n"+indent+"],\n"
        }
        else if(typeof(value)=="object"){
            text+="\n{\n"+indent+prettyInvalidJsonRec(value,depth+1)+indent+"\n}\n";
        }
      
        else if(typeof(value)=="string"){
            let r={remaining:""}
            let parsed=tryParseJSONWithSlice(value,r);
            if(parsed){
                text+="\n{\n"+r.remaining+indent+prettyInvalidJsonRec(parsed,depth+1)+indent+"\n}\n";

            }
            else{
                value=value.replaceAll("\n","\n"+indent)
                value=value.replaceAll("\\n","\n"+indent)
                text+="\""+"\n"+indent+value +indent+"\n"+"\",\n"
            }
        }
        else{
            text+="\""+indent+value+"\",\n"
        }
    }
    return text;
}

/**
 * used to write content to a specific location depending on how the application is started
 * @param key a key or file name
 * @param content the file content
 */
export function writeFileSync(key:string,content:string){
    let fileIO=FileIO.instance;
    fileIO.writeFileSync(key,content)
}

/**
 *  used to read content from a specific location depending on how the application is started
 * @param key  a key or file name
 * @returns the file content
 */
export function readFileSync(key:string):string{
    let fileIO=FileIO.instance;
    return fileIO.readFileSync(key)
}
let currLabel="";

/**
 * used for eval scripts to get the current label
 * @returns 
 */
export function getCurrLabel():string{
    return currLabel;
}

/**
 *  used for eval scripts to set the current label
 * @param label 
 */
export function setCurrLabel(label:string){
    currLabel=label;
}


/**
 * parse a JSON string using jsonrepair
 * @param jsonString a JSON string, might be invalid
 * @returns an object or null
 */
 function parseUsingJsonRepair(jsonString:string){
    let result=tryParseJSON(jsonString)
    if(result==null){
        let repaired="{"
        try{
            repaired=jsonrepair(jsonString)
            let res=tryParseJSON(repaired)
            if(Array.isArray(res)){
                res=res[0]
                
            }
            return res;

        }
        catch{
            
        }
        return 
    }
    else{
        return result;
    }
}
/**
 * parse an  JSON strin, tries to repair it if it is invalid
 * @param jsonString a string that should be a JSON
 * @returns a JSON object or null
 */
export function parseInvalidJSON(jsonString:string){
   return parseUsingJsonRepair(jsonString)  
}

/**
 * Used to set a break point in the code
 * @param f a function that might return null
 * @returns the result of the function
 */
export function debugOnNull(f:any){
    let res=f();
    if(res==null || res==undefined){
        nop();
        f();
    }
    return res
}