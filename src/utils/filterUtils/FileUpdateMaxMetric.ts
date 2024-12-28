import { ProjectContext, GitRepositoryContext } from "../../context/DataContext";
import {Metric} from "./Metric";
export class FileUpdateMaxMetric implements Metric {
    async evaluate(data: any, context: ProjectContext): Promise<number> {
        let gitContext=context.getByType(GitRepositoryContext);
        if(gitContext==null){
            throw new Error("Git context not found")
        }
        return (await gitContext.getLastCommittedDate(data as string)).getTime()
    }
    isCompatibleWithDataClump(): boolean {
        return false;
    }
    isCompatibleWithString(): boolean {
       return true;
    }
    
}