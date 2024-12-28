import { ProjectContext } from "../../context/DataContext";

import { parseJSONDetailed, tryParseJSON } from "../Utils";

export interface OutputChecker{
    isValid(content:string,context:ProjectContext):Promise<boolean>; 
    getErrorMessage():string;
}

export class ValidJSONChecker implements OutputChecker{
    private lastError:string=""
    isValid(content: string,context:ProjectContext): Promise<boolean> {
        let result=parseJSONDetailed(content)
        if(result.jsonResult){
            return Promise.resolve(true);
        }
        else{
            this.lastError=result.errorMessage!
            return Promise.resolve(false);
        }
    }
    getErrorMessage(): string {
        return "Your output is not valid JSON.\n"+this.lastError
    }
}
