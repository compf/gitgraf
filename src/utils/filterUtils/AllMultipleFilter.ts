import { AbstractMultipleFilters } from "./AbstractMultipleFilters";
import { ProjectContext } from "../../context/DataContext";

/**
 * Only return true for shall remain if all filters return true
 */
export class AllMultipleFilter extends AbstractMultipleFilters {
   
    async shallRemain(data:any, context:ProjectContext) {
        for(let f of this.filters){
            if(!await f.shallRemain(data, context)){
                return false;
            }
        }
       return true
    }
  
}