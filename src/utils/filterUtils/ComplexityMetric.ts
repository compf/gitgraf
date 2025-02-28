import fs from "fs";
import { ProjectContext } from "../../context/DataContext";
import { Metric } from "./Metric";
import { PathOrRelevantLocation } from "./SingleItemFilter";
import { fileURLToPath } from "url";

export class ComplexityMetric implements Metric{
    isCompatibleWithString(): boolean {
        return true;
    }

    async evaluate(data: PathOrRelevantLocation, context: ProjectContext): Promise<number> {
        let result=0;

        if(typeof(data)=="string"){
            result=fs.statSync(data).size
        }
        else{
            let content=fs.readFileSync(fileURLToPath(data.uri)).toString().split("\n")
            result=content.splice(data.location.start.line,data.location.end.line).reduce((acc,curr)=>acc+curr.length,0)
        }
        return result
    }
}