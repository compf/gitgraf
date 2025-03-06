import { FileFilteringContext, ProjectContext, RelevantLocation, RelevantLocationsContext } from "../../../context/DataContext";
import { getRelevantFilesRec } from "../../../utils/Utils";
import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";
import fs from "fs"
export class LargeLinesAreRelevantDetectionStep extends AbstractStepHandler {
    private minLineLength: number = 30;

    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(RelevantLocationsContext.name)
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.RelevantLocationDetection]
    }
    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        let paths: string[] = []
        getRelevantFilesRec(context.getProjectPath(), paths, context.getByType(FileFilteringContext));
        let locations: RelevantLocation[] = []
        for (let p of paths) {
            let content = fs.readFileSync(p).toString().split("\n")
            let lineNr=0;
            for (let l of content) {
                if (l.length > this.minLineLength) {
                    locations.push(
                        {
                            uri: "file://" + p,
                            location: {

                             start:{
                                line:lineNr,
                                character:0
                             },
                            end: {
                                line:lineNr,
                                character:l.length
                             }
                            },
                            kind: 0,
                            name: l,

                        }
                    )
                }
                lineNr++;
            }
        }
        return context.buildNewContext(new RelevantLocationsContext(locations))
    }

}