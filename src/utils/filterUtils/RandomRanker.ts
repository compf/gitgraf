import { ProjectContext } from "../../context/DataContext";
import { Metric } from "./Metric";

export class RandomRanker implements Metric{
    evaluate(data: any, context: ProjectContext): Promise<number> {
        return  Promise.resolve(Math.random())
    }
    isCompatibleWithDataClump(): boolean {
        return true;
    }
    isCompatibleWithString(): boolean {
        return true;
    }
    
}