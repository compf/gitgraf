import { PipeLineStep, PipeLineStepType } from "../pipeline/PipeLineStep";
import fs from "fs";
import { resolve } from "path";
import { ProjectContext, RelevantLocationsContext } from "./DataContext";
const  DEBUG=false;
export function loadExistingContext(step: PipeLineStepType, context: ProjectContext): ProjectContext | null {
   
   if(step==PipeLineStep.RelevantLocationDetection){
        let path=resolve(context.getProjectPath(),".gitgraf_data","relevantLocations.json")
        if(fs.existsSync(path)){
            if(DEBUG){
                console.log("Loading existing relevant locations")
            }
            let data=fs.readFileSync(path).toString()
            let locations=JSON.parse(data)
            return context.buildNewContext(new RelevantLocationsContext(locations))
        }
        
   }
    return null;
}
