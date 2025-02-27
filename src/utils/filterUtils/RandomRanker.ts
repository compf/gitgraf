import { ProjectContext } from "../../context/DataContext";
import { Metric } from "./Metric";
import { PathOrRelevantLocation } from "./SingleItemFilter";

export class RandomMetric implements Metric{
    evaluate(data: PathOrRelevantLocation, context: ProjectContext): Promise<number> {
        return  Promise.resolve(Math.random())
    }
    isCompatibleWithString(): boolean {
        return true;
    }
    
}