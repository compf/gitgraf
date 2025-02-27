import { PathOrRelevantLocation, SingleItemFilter } from "./SingleItemFilter";
import { resolveFromConcreteName, resolveNameOrReturn, resolveOrRegister } from "../../config/Configuration";
import { ProjectContext } from "../../context/DataContext";

export abstract class AbstractMultipleFilters implements SingleItemFilter {
    abstract shallRemain(data: PathOrRelevantLocation, context: ProjectContext): Promise<boolean>;
    public filters: SingleItemFilter[] = []
    constructor(args:{filters:(string|SingleItemFilter)[]}) {
        this.filters = args.filters.map((it)=>resolveNameOrReturn(it))

    }
    isCompatibleWithString(): boolean {
        return this.filters.every(f => f.isCompatibleWithString())
    }

}