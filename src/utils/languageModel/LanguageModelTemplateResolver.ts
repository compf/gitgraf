import fs from 'fs';
export enum LanguageModelTemplateType {

}
export const FILE_REPLACE_START="%{";
export const IS_OPTIONAL_REFERENCE="?}"
export const TEMPLATE_EXTENSION=".template"

/**
 * This class is responsible for resolving templates for the language model
 */
export class LanguageModelTemplateResolver {
    private replaceMap:{[key:string]:string}
    constructor(replaceMap: {[key:string]:string}) {
        this.replaceMap = replaceMap;
    }

    set(key:string,value:string){
        this.replaceMap[key]=value;
    }
    resolveFromTemplateType(templateType:LanguageModelTemplateType,additionalReplacements?:{[key:string]:string}|undefined):string{
        const template = fs.readFileSync(`chatGPT_templates/${templateType}.template`, 'utf-8');
        return this.resolveTemplate(template,additionalReplacements);
    }
    /**
     * Resolves the template with the given replacements
     * @param text the text to resolve
     * @param additionalReplacements the additional replacements to use
     */
    resolveTemplate(text:string,additionalReplacements?:{[key:string]:string}|undefined):string{
        let result=text
        if(additionalReplacements==undefined){
            additionalReplacements={}
        }
        Object.assign(additionalReplacements,this.replaceMap)
        let keys=Object.keys(additionalReplacements);
        let index=0;
        while(index<keys.length){
            let key=keys[index];
            let relevantText=""
            if(key.startsWith(FILE_REPLACE_START)){
                let fileContent=fs.readFileSync(additionalReplacements[key], { encoding: "utf-8" })
                relevantText=fileContent
                
            }
            else{
                relevantText=additionalReplacements[key]
            }
            if(result.includes(key)){
                result=result.replaceAll(key,relevantText)
                index=0;
            
            }
            else{
                index++;
            }
        }
        
        result=this.resolveRemainingReferences(result);
        return result;
      
    }
    resolveRemainingReferences(text:string):string{
        let matches=text.match(/(\$|%){(\w|_)+}/gm)
        if(matches){
            console.log(matches)
            throw "Not all references are resolved "
        }
       
        return text;
    }
}