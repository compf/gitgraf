import { assignOrResolve } from "../../config/Configuration";
import { ProjectContext } from "../../context/DataContext";
import { compareTo } from "../Utils";
import { Metric } from "./Metric";
import { SingleItemFilter } from "./SingleItemFilter";

export type ComparisionSign=">"|"<"|"<="|">="|"="
/**
 * This class is a filter that filters  objects based on a numerical threshold given a metric
 */
export  class NumericalThresholdBasedFilter    implements SingleItemFilter{
    private threshold: number;
    private  requiredCompareSigns:number[];

    private metric?:Metric=undefined;
    constructor(args:{rankThreshold?:number,comparisonSign?:ComparisionSign,filterThreshold:number,metric?:Metric|string}) {
        this.threshold = args.filterThreshold;
        let sign=args.comparisonSign
        assignOrResolve(this, args,{rankThreshold:0,comparsionSign:">"})
        if(sign==">"){
            this.requiredCompareSigns=[1];
        }else if(sign=="<"){
            this.requiredCompareSigns=[-1];
        }
        else if(sign=="<="){
            this.requiredCompareSigns=[-1,0];
        }
        else if(sign==">="){
            this.requiredCompareSigns=[1,0];
        }
        else if(sign=="="){
            this.requiredCompareSigns=[0];
        }
        else{
            throw new Error("invalid sign "+sign)
        }
        

    }
    isCompatibleWithDataClump(): boolean {
        return this.metric?.isCompatibleWithDataClump() ?? false;
    }
    isCompatibleWithString(): boolean {
        return this.metric?.isCompatibleWithString() ?? false;
    }
    public async shallRemain(data: any,context:ProjectContext): Promise<boolean> {
        let occurences=await this.metric!.evaluate(data,context)
        return  this.requiredCompareSigns.includes(compareTo(occurences, this.threshold)) 
   
    }
   


}
