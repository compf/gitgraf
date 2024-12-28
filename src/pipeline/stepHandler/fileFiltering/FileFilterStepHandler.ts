import { assignOrResolve, getProgrammingLanguageService, resolveFromConcreteName } from "../../../config/Configuration";
import { ProjectContext, FileFilteringContext } from "../../../context/DataContext";
import { AllMultipleFilter } from "../../../utils/filterUtils/AllMultipleFilter";
import { AnyMultipleFilter } from "../../../utils/filterUtils/AnyMultipleFilter";
import { GlobFilter } from "../../../utils/filterUtils/GlobFilter";
import { Metric } from "../../../utils/filterUtils/Metric";
import { RankerArgs, Ranker } from "../../../utils/filterUtils/Ranker";
import { SingleItemFilter } from "../../../utils/filterUtils/SingleItemFilter";
import { getRelevantFilesRec } from "../../../utils/Utils";
import { PipeLineStepType, PipeLineStep } from "../../PipeLineStep";

import { AbstractStepHandler } from "../AbstractStepHandler";
import fs from "fs"
import path from "path"

export type FileFilterArgs = RankerArgs & {
    filter?: string | SingleItemFilter,
    metric?: string | Metric,
    include?: string[],
    exclude?: string[],
    useGitIgnore?: boolean
}
export class FileFilterStepHandler extends AbstractStepHandler {
    private filter?: SingleItemFilter = undefined
    private metric?: Metric = undefined
    private rankSampler?: Ranker;
    private include: string[] = []
    private exclude: string[] = []
    private includePrevails: boolean = true;

    private useGitIgnore = true
    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        let includeNotPrevailFilter: AllMultipleFilter = new AllMultipleFilter({ filters: [] })
        let includePrevailFilter=new AllMultipleFilter({filters:[]})
        let excludeFilter: AnyMultipleFilter = new AnyMultipleFilter({ filters: [] })
        excludeFilter.filters.push(new GlobFilter({ glob: ".*\\.git/.*" }))
        excludeFilter.filters.push(new GlobFilter({ glob: ".*\\.data_clump_solver_data/.*" }))
        includeNotPrevailFilter.filters.push(new GlobFilter({ glob: ".*\\" + getProgrammingLanguageService().getExtension() }))
        let includeFilter=includeNotPrevailFilter
        if(this.includePrevails){
            includeFilter=includePrevailFilter
        }
        if (this.metric != undefined && !this.metric?.isCompatibleWithString()) {
            throw new Error("ranker is not compatible with string")
        }
        if (this.useGitIgnore && fs.existsSync(context.getProjectPath() + "/.gitignore")) {

            let gitIgnore = fs.readFileSync(context.getProjectPath() + "/.gitignore").toString()
            let lines = gitIgnore.split("\n")
            for (let line of lines) {
                if (line.startsWith("#")) {
                    continue
                }
                if (line.trim() == "") {
                    continue
                }
                if (line.startsWith("!")) {
                    includeFilter.filters.push(new GlobFilter({ glob: ".*" + line.substring(1) + ".*" }))
                }
                else {
                    excludeFilter.filters.push(new GlobFilter({ glob: ".*" + line + ".*" }))
                }
            }
        }
        for(let i of this.include){
            includeFilter.filters.push(new GlobFilter({glob:i}))
        }
        for(let e of this.exclude){
            excludeFilter.filters.push(new GlobFilter({glob:e}))
        }
        if(this.filter){
            includeFilter.filters.push(this.filter)
        }
        let originalPaths: string[] = []


        getRelevantFilesRec(context.getProjectPath(), originalPaths, null)
        let includeGlobs:string[]=[]
        let excludeGlobs:string[]=[".*"]
        for(let p of originalPaths){

            let includedNoPrevail=await includeNotPrevailFilter.shallRemain(p,context)
            let includedPrevail=await includePrevailFilter.shallRemain(p,context) 
            let excluded=await excludeFilter.shallRemain(p,context)
            let included=includedNoPrevail && includedPrevail
            if(includedPrevail && includePrevailFilter.filters.length>0 && excluded){
                if(this.includePrevails ){
                    includeGlobs.push(p)
                }
               
            }
            else if(included && !excluded){
                includeGlobs.push(p)
            }
           
        }
        originalPaths=[]
        getRelevantFilesRec(context.getProjectPath(), originalPaths, new FileFilteringContext(includeGlobs,excludeGlobs))
       

        if (this.metric && this.rankSampler) {

            originalPaths=(await this.rankSampler.rank(this.metric!!, originalPaths, context) as string[])
            includeGlobs=originalPaths
           
        }
        return context.buildNewContext(new FileFilteringContext(includeGlobs,excludeGlobs))

    }

    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.FileFiltering]
    }
    constructor(args: FileFilterArgs) {
        super()
        assignOrResolve(this, args,{})
        if (this.rankSampler == undefined) {
            this.rankSampler = new Ranker(args)
        }
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(FileFilteringContext.name)
    }

}