import { SingleItemFilter } from "./SingleItemFilter";
import { resolveFromConcreteName } from "../../config/Configuration";
import { ProjectContext } from "../../context/DataContext";

export abstract class AbstractMultipleFilters implements SingleItemFilter {
    abstract shallRemain(data: any, context: ProjectContext): Promise<boolean>;
    public filters: SingleItemFilter[] = []
    constructor(args:{filters:string[]}) {
        this.filters = args.filters.map((it)=>resolveFromConcreteName(it))

    }
    isCompatibleWithString(): boolean {
        return this.filters.every(f => f.isCompatibleWithString())
    }
    isCompatibleWithDataClump(): boolean {
        return this.filters.every(f => f.isCompatibleWithDataClump())
    }
}