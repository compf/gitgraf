import { ProjectContext, GitRepositoryContext } from "../../context/DataContext";
import {Metric} from "./Metric";
import { PathOrRelevantLocation } from "./SingleItemFilter";
export class FileUpdateMaxMetric implements Metric {
    async evaluate(data: PathOrRelevantLocation, context: ProjectContext): Promise<number> {
        let gitContext=context.getByType(GitRepositoryContext);
        if(gitContext==null){
            throw new Error("Git context not found")
        }
        return (await gitContext.getLastCommittedDate(data as string)).getTime()
    }

    isCompatibleWithString(): boolean {
       return true;
    }
    
}