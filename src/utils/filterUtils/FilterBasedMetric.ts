import { ProjectContext } from "../../context/DataContext";
import { Metric } from "./Metric";
import { assignOrResolve, resolveFromConcreteName } from "../../config/Configuration";
import { SingleItemFilter } from "./SingleItemFilter";

export class FilterBasedMetric implements Metric{
    evaluate(data: any, context: ProjectContext): Promise<number> {
        return this.filter!.shallRemain(data,context).then((result)=>{return result?this.trueValue!:this.falseValue!});
    }

    constructor(args:{filter:string|SingleItemFilter, trueValue:number, falseValue:number}) {
       assignOrResolve(this, args,{trueValue:1,falseValue:0})
    }
    isCompatibleWithDataClump(): boolean {
        return this.filter!.isCompatibleWithDataClump();
    }
    isCompatibleWithString(): boolean {
        return this.filter!.isCompatibleWithString();
    }
    private filter?:SingleItemFilter;
    private trueValue?:number;
    private falseValue?:number;
}