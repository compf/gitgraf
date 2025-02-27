import {  ProjectContext } from "../../context/DataContext";
import { FilterOrMetric, PathOrRelevantLocation } from "./SingleItemFilter";
import { Metric } from "./Metric";
import { InitializationRequiredMetric } from "./MetricCombiner"
function isInitializationRequired(object: any): object is InitializationRequiredMetric {
    // replace 'property' with a unique property of ReExecutePreviousHandlers
    return 'initialize' in object;
}
export type RankerArgs = {
    rankThreshold?: number,
    rankSign?: number,
    strictSize?: boolean

}
import fs from "fs"
import { assignOrResolve } from "../../config/Configuration";
export class Ranker {
    private rankThreshold: number | null = null
    private rankSign: number | null = null;
    private strictSize: boolean = false;
    constructor(args: RankerArgs) {
        assignOrResolve(this, args,{})
    }
    protected getKey(data: PathOrRelevantLocation, context: ProjectContext): string {
        if (typeof data === "string") {
            return data
        }
        else {
            return  JSON.stringify( data);
        }

        

    }
    protected getItem(key:string,context:ProjectContext, isPath:boolean):any{
        if(isPath){
            return key
        }
        else{
            let decoded=atob(key)
            return JSON.parse(decoded)
        }
    }
 
    async rank(metric: Metric, input: (any)[], context: ProjectContext): Promise<(any)[]> {
        if (this.rankThreshold == null) {
            this.rankThreshold = 1
        }
        if (this.rankSign == null) {
            this.rankSign = -1
        }
        if (this.rankThreshold! < 1) {
            this.rankThreshold = input.length * this.rankThreshold!
        }
        let isPath=typeof input[0]=="string"
        let keys = Array.from(new Set(input.map((it) => this.getKey(it, context))))
        let evaluateMap: { [key: string]: number } = {}
        if (isInitializationRequired(metric)) {
            for (let key of keys) {
                let item = this.getItem(key, context,isPath)
                await metric.initialize(item, context)

            }
        }
        let keyCounter = 0
        for (let key of keys) {
            let item = this.getItem(key, context,isPath)
            let value = await metric.evaluate(item, context)
            evaluateMap[key] = value
            keyCounter++

        }
        let result = keys.sort((a, b) => this.rankSign! * (evaluateMap[a] - evaluateMap[b])).map((it) => this.getItem(it,context,isPath))
        let slicedResult:any[] = []
        let counter = 0;
        let previousKey = ""
        let key_item:{[key:string]:any} = {}
        for (let r of result) {
            
            let typeNameKey = this.getKey(r, context)
            key_item[typeNameKey] = r
            
            const compareCount = Object.keys(key_item).length
            if (compareCount >= this.rankThreshold!) {
                break;
            }


        }

        slicedResult = Object.values(key_item).flat() as any[]

        if (this.strictSize) {
            slicedResult = slicedResult.slice(0, this.rankThreshold!)
            return slicedResult
        }
        return slicedResult
    }

}