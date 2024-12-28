export namespace ContextWindowsChecker{
    /**
     * Checks if the context size of the query is within the tolerance of the context size of the model
     * @param query  a query to check
     * @param modelName the name of the model
     * @param contextSize the context size of the model
     * @param tolerance a tolerance factor
     * @returns true if the query is too large
     */
    export function isQueryTooLarge(query:string, modelName:string, contextSize:number,tolerance:number=1.2):boolean{
        let tokens=calcTokens(query,modelName)
        let ratio=tokens/contextSize;
       return ratio >= tolerance;
    }
    function calcTokens(query:string, modelName:string):number{
        let suffix="";
        if(modelName.startsWith("codellama")){
            suffix="llama2";
        }
        else if(modelName.startsWith("codegemma")){
            suffix="gemma";
        }
        const fromPreTrained=require("@lenml/tokenizer-"+suffix)
        const tokenizer = fromPreTrained.fromPreTrained();
        return tokenizer.encode(query,null,{add_special_tokens: true,}).length
    }
}