import {  ProjectContext, GitRepositoryContext } from "../../context/DataContext";
import { PathOrRelevantLocation, SingleItemFilter } from "./SingleItemFilter";
import { Metric } from "./Metric";

export abstract class FileUpdateMetric implements Metric {
    async evaluate(data: PathOrRelevantLocation,context:ProjectContext): Promise<number> {
        let relevantPaths: string[] = []
        if (typeof data === "string") {
            relevantPaths.push(data)
        }
        else {
            relevantPaths.push(data.uri)
        }
        let gitContext = context.getByType(GitRepositoryContext)
        if(gitContext==null){
            throw new Error("Git context not found")
        }
        let sum=0;
        for(let path of relevantPaths){
            let timestamps=await gitContext!.getAllCommittedDates(path)
            let score=this.evaluateTimestamps(timestamps)
            sum+=score

        }
        return sum/relevantPaths.length
    }

    abstract evaluateTimestamps(timestamps: Date[]): number

 
    isCompatibleWithString(): boolean {
        return true
    }
}