import { ProjectContext } from "../../context/DataContext";
import { Metric } from "./Metric";
import { PathOrRelevantLocation } from "./SingleItemFilter";

export class RandomRanker implements Metric{
    evaluate(data: PathOrRelevantLocation, context: ProjectContext): Promise<number> {
        return  Promise.resolve(Math.random())
    }
    isCompatibleWithString(): boolean {
        return true;
    }
    
}