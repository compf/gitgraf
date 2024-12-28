import simpleGit from "simple-git";
import {  ProjectContext, FileFilteringContext, getContextSerializationBasePath, getContextSerializationPath, LargeLanguageModelContext } from "../../../context/DataContext";
import { resolve } from "path"
import fs from "fs"
import path from "path"
import readlineSync from "readline-sync"
import { resolveFromConcreteName } from "../../../config/Configuration";
import { PipeLineStep, PipeLineStepType } from "../../PipeLineStep";
import { AllFilesHandler } from "./ContextToModelHandlers";
import { writeFileSync } from "../../../utils/Utils";
import { ChatMessage } from "../../../utils/languageModel/AbstractLanguageModel";

function checkPath(p: string): boolean {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return true;
    }

    let folder = path.dirname(p)
    if (fs.existsSync(folder) && fs.statSync(folder).isDirectory()) {
        return true;
    }
    return false;
}
export function parsePath(filePath: string, context: ProjectContext): string {
    let start = 0;
    let p = filePath;
    let resolvedPath = resolve(context.getProjectPath(), p)
    let end = filePath.length - 1;
    while (p != "" && start <= end && !checkPath(resolvedPath)) {
        let m = filePath.charAt(start).match(/\w/)
        if (!filePath.charAt(start).match(/\w/)) {
            start++;
        }
        else if (!filePath.charAt(end).match(/\w/)) {
            end--;
        }
        p = filePath.substring(start, end + 1)
        resolvedPath = resolve(context.getProjectPath(), p)

    }
    if (start > end) return ""
    return p;
}




function findBestFittingLine(lines: string[], startLine: number, compareLine: string) {
    let deltas = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10]
    for (let s of deltas) {
        let line = lines[startLine + s]
        if (line != undefined) {
            if (line.trim() == compareLine.trim()) {
                return startLine + s
            }
        }

    }
}
function concatenateNewContentArrayLength(array: string[], start: number) {
    for (let i = start + 1; i < array.length; i++) {
        array[start] = array[start] + "\n" + array[i]
    }
    return array.slice(0, start + 1)

}
function getIndentation(line: string) {
    let result = "";
    if (line == undefined) return ""
    for (let c of line) {
        if (c == " " || c == "\t") {
            result += c
        }
        else {
            break;
        }
    }
    return result
}





export async function parseChat(fullChat: ChatMessage[], step: PipeLineStepType | null, context: ProjectContext, outputHandler: OutputHandler): Promise<ProjectContext> {

  
    return context
}

export interface Proposal {
    apply(context: ProjectContext): ProjectContext
    delete(context: ProjectContext):ProjectContext;
    getFullOutput(): ChatMessage[]
    evaluate(context: ProjectContext): Promise<number>
}






export abstract class OutputHandler {
    abstract handleProposal(proposal: Proposal, context: ProjectContext): void;
    abstract chooseProposal(context: ProjectContext): Promise<ProjectContext>;
}
export class StubOutputHandler extends OutputHandler {
    public proposal: Proposal | null = null
    public apply: boolean = true
    handleProposal(proposal: Proposal, context: ProjectContext): void {
        if (this.apply)
            proposal.apply(context)
        this.proposal = proposal

    }
    chooseProposal(context: ProjectContext): Promise<ProjectContext> {
        let output: ChatMessage[] = []
        if (this.proposal != null) {
            output = this.proposal.getFullOutput()
        }
        return Promise.resolve(new LargeLanguageModelContext(output));
    }
}
export class MultipleBrancheHandler extends OutputHandler {
    private originalBranch: string = "main"
    private counter = 0;

    async handleProposal(proposal: Proposal, context: ProjectContext) {
        let git = simpleGit(context.getProjectPath());
        let status = await git.status()
        let originalBranch = status.current!
        this.originalBranch = originalBranch;
        await git.checkout("-Bdata_clump_proposal_" + this.counter++)
        proposal.apply(context)

        await git.add("-A");
        await git.commit("Refactored data clumps");
        await git.checkout(originalBranch)
    }
    async chooseProposal(context: ProjectContext): Promise<ProjectContext> {
        readlineSync.question("Switch to the correct branch")
        let git = simpleGit(context.getProjectPath());
        let currBranch = (await git.status()).current!;
        await git.checkout(this.originalBranch);
        return context;
    }

}
export abstract class SimpleProposalHandler extends OutputHandler {
    protected proposals: Proposal[] = []
    handleProposal(proposal: Proposal, context: ProjectContext): void {
        this.proposals.push(proposal)
        writeFileSync("proposal" + (new Date().getTime()) + ".json", JSON.stringify(proposal.getFullOutput(), null, 2))
    }

}
export class InteractiveProposalHandler extends SimpleProposalHandler {

    handleProposal(proposal: Proposal, context: ProjectContext): void {
        this.proposals.push(proposal)
        let outPath = getContextSerializationBasePath(context)

        {
            fs.writeFileSync(resolve(outPath, "proposal" + (new Date().getTime()) + ".json"), JSON.stringify(proposal.getFullOutput(), null, 2))

        }
    }

    chooseProposal(context: ProjectContext): Promise<ProjectContext> {
        const question = `
        Choose an option?
        0) Next proposal
        1) previous proposal
        2) Mark current proposal as best
        3) Return to best proposal
        4) Exit
        
        `;
        let currProposal = this.proposals[0];
        let tempContext = currProposal.apply(context);
        let bestProposalIndex = 0;
        let currProposalIndex = 0;
        let shallContinue = true;
        while (shallContinue) {
            let option = readlineSync.question(question)
            let index = parseInt(option);

            switch (index) {
                case 0:
                    tempContext = currProposal.delete(context)
                    currProposalIndex++;
                    if (currProposalIndex >= this.proposals.length) {
                        currProposalIndex = 0;
                    }
                    currProposal = this.proposals[currProposalIndex];
                    console.log(currProposalIndex, currProposal.getFullOutput())
                    tempContext = currProposal.apply(context)
                    break;
                case 1:
                    tempContext = currProposal.delete(context)
                    currProposalIndex--;
                    if (currProposalIndex < 0) {
                        currProposalIndex = this.proposals.length - 1;
                    }
                    currProposal = this.proposals[currProposalIndex];
                    tempContext = currProposal.apply(context)
                    break;
                case 2:
                    bestProposalIndex = currProposalIndex;
                    break;
                case 3:
                    tempContext = currProposal.delete(context)
                    currProposalIndex = bestProposalIndex

                    currProposal = this.proposals[currProposalIndex];
                    tempContext = currProposal.apply(context)
                case 4:
                    shallContinue = false;
                    break;
                default:
                    console.log("Invalid option")




            }
        }
        tempContext = tempContext.buildNewContext(new LargeLanguageModelContext(currProposal.getFullOutput()))
        return Promise.resolve(tempContext);
        /*if(context!=tempContext){
            return Promise.resolve(context.buildNewContext(tempContext))

        }
        else{
            return Promise.resolve(context);
        }*/
    }
}
export interface ProposalMetric {
    evaluate(modifiedFiles: { [key: string]: string; }, context: ProjectContext, fullOutput?: any): Promise<number> 
}

export class MetricBasedProposalHandler extends SimpleProposalHandler {

    async chooseProposal(context: ProjectContext): Promise<ProjectContext> {
        let mostScoredProposalIndex = 0;
        let bestScore = 0;
        for (let i = 0; i < this.proposals.length; i++) {
            let score = await this.proposals[i].evaluate(context)
            if (score > bestScore) {
                bestScore = score;
                mostScoredProposalIndex = i
            }
        }
        console.log("Best proposal is ", mostScoredProposalIndex, bestScore, Object.keys(this.proposals[mostScoredProposalIndex]))
        let tempContext = this.proposals[mostScoredProposalIndex].apply(context)
        tempContext = tempContext.buildNewContext(new LargeLanguageModelContext(this.proposals[mostScoredProposalIndex].getFullOutput()))
        return Promise.resolve(tempContext)

    }
    private metric: ProposalMetric
    constructor(args: { proposalMetricName:string }) {
        super()
        this.metric = resolveFromConcreteName(args.proposalMetricName) as ProposalMetric

    }
}

export class AffectedFilesProposalMetric implements ProposalMetric {
    async evaluate(modifiedFiles: { [key: string]: string; }, context: ProjectContext, fullOutput?: any): Promise<number>  {
        return Object.keys(modifiedFiles).length
    }

}
export class NumberOfLinesProposalMetric implements ProposalMetric {
    async evaluate(modifiedFiles: { [key: string]: string; }, context: ProjectContext, fullOutput?: any): Promise<number>  {
        let result = 0
        if (fullOutput) {
            for (let key in fullOutput.refactorings) {
                for (let change of fullOutput.refactorings[key]) {
                    result += change.newContent.split("\n").length;
                }
            }
        }
        return result;
    }

}
export class SizeChangeProposalMetric implements ProposalMetric {
    async evaluate(modifiedFiles: { [key: string]: string; }, context: ProjectContext, fullOutput?: any): Promise<number> {
        let oldSize = 0;
        let newSize = 0
        if (fullOutput) {
            for (let key in fullOutput.refactorings) {
                for (let change of fullOutput.refactorings[key]) {
                    newSize += change.newContent.length
                    oldSize += change.oldContent.length
                }
            }
        }
        if (newSize == 0) {
            return 0
        }
        return oldSize / newSize

    }

}
