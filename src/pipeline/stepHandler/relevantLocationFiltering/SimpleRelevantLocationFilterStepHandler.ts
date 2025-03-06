import { ProjectContext, RelevantLocation, RelevantLocationsContext } from "../../../context/DataContext";
import { Metric } from "../../../utils/filterUtils/Metric";
import { Ranker } from "../../../utils/filterUtils/Ranker";
import { SingleItemFilter } from "../../../utils/filterUtils/SingleItemFilter";
import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";

export class SimpleRelevantLocationFilterStepHandler extends AbstractStepHandler{
    private filter?: SingleItemFilter = undefined
    private metric?: Metric = undefined
    private rankSampler?: Ranker;
    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        let locations=context.getByType(RelevantLocationsContext)?.relevantLocations;
        if(locations==undefined)return context;

        let result:RelevantLocation[]=[]
        if(this.filter){
            for(let l of locations){
                if(await this.filter.shallRemain(l,context)){
                    result.push(l)
                }
            }
        }
        if(this.metric){
            result=await this.rankSampler!.rank(this.metric,result,context) as RelevantLocation[]
        }
        return context.buildNewContext(new RelevantLocationsContext(result))

       

    }
    constructor(args:any){
        super();
        Object.assign(this,args)
        this.rankSampler=new Ranker(args)
    }

    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.RelevantLocationFiltering]
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(RelevantLocationsContext.name)
    }
}