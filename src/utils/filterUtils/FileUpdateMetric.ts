import {  ProjectContext, GitRepositoryContext } from "../../context/DataContext";
import { SingleItemFilter } from "./SingleItemFilter";
import { Metric } from "./Metric";

export abstract class FileUpdateMetric implements Metric {
    async evaluate(data: any,context:ProjectContext): Promise<number> {
        let relevantPaths: string[] = []
        if (typeof data === "string") {
            relevantPaths.push(data)
        }
        else {
            relevantPaths.push(data.from_file_path)
            relevantPaths.push(data.to_file_path)
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

    isCompatibleWithDataClump(): boolean {
        return true
    }
    isCompatibleWithString(): boolean {
        return true
    }
}