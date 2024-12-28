import { CodeObtainingContext, ProjectContext } from "../../../context/DataContext";

import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep";
import { AbstractStepHandler } from "../AbstractStepHandler";
import fs from "fs";
import { resolve } from "path";
import {spawnSync} from "child_process"
import { resolveFromConcreteName } from "../../../config/Configuration";
import { GitHubService } from "../../../utils/vcs/GitHubService";
import { getRepoDataFromUrl } from "../../../utils/vcs/VCS_Service";
export class CloneObtainingStepHandler extends AbstractStepHandler {
    constructor(args:{
        url:string,
        alwaysClone?:boolean
    }) {
        super();
        this.url=args.url;
        this.alwaysClone=args.alwaysClone || false;
    }
    private url:string;
    private alwaysClone:boolean=false;

    async handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext> {
        let vcsService=new GitHubService();
        let outPath="cloned_projects/"+getRepoDataFromUrl(this.url).repo.replace(".git","");
        outPath=resolve(outPath)
        if(this.alwaysClone && fs.existsSync(outPath)){
            fs.rmdirSync(outPath,{recursive:true});
        }
        else if(!this.alwaysClone && fs.existsSync(outPath)){
            return context.buildNewContext(new CodeObtainingContext(outPath))
        }
        vcsService.clone(this.url);
        

        context=context.buildNewContext(new CodeObtainingContext(outPath))
        //context=context.buildNewContext(await this.validate(context));
        return context
    }
    getExecutableSteps(): PipeLineStepType[] {
        return [PipeLineStep.CodeObtaining];
    }
    addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void {
        createdContexts.add(CodeObtainingContext.name)
    }
   
}