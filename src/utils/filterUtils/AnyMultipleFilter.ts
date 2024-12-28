import { ProjectContext } from "../../context/DataContext";
import { AbstractMultipleFilters } from "./AbstractMultipleFilters";

/**
 * Only return true for shall remain if any filter returns true
 */
export class AnyMultipleFilter extends AbstractMultipleFilters {
    async shallRemain(data:any, context:ProjectContext) {
        for(let f of this.filters){
            if(await f.shallRemain(data, context)){
                return true;
            }
        }
        return false;
    }
}