import { VCS_Service, getRepoDataFromUrl } from "./VCS_Service";
import { spawnSync } from "child_process";
import fs from "fs"
 
export class GitHubService extends VCS_Service {
    API_KEY = fs.readFileSync("tokens/GITHUB_TOKEN", "utf-8");
    clone(url: string) {

        console.log("pulling")
        spawnSync("git", ["clone", url, "cloned_projects/" + getRepoDataFromUrl(url).repo])
    }
    getWorkingDirectory(): string {
        return ""
    }
    async getMostRecentPullRequestTime(url: string): Promise<Date> {
        let data = getRepoDataFromUrl(url);
        let octokit = this.createOctokitObject();
        let result = await octokit.rest.pulls.list({
            repo: data.repo,
            owner: data.owner,
            "state": "closed",
            sort: "created",
            direction: "desc"

        }
        )

        return new Date(result.data[0].updated_at);
    }
    commit(message: string) {
        throw new Error("Method not implemented.");
    }
    push() {
        throw new Error("Method not implemented.");
    }
    createOctokitObject(): any {
        return {}
    }
    async fork(url: string, newName: string | undefined): Promise<string> {
        let octokit = this.createOctokitObject();
        let repoData = getRepoDataFromUrl(url);


        let result = await  octokit.request(`POST /repos/${repoData.owner}/${repoData.repo}/forks`, {
            owner: repoData.owner,
            repo: repoData.repo,
            default_branch_only: true,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })


        console.log(result.data.ssh_url)
        return result.data.ssh_url.replace(".git","")
    }
   async pullRequest(repo:string,head:string,owner:string,base:string,title:string,body:string): Promise<number> {
        let octokit=this.createOctokitObject();
        let response=await octokit.rest.pulls.create({
            owner,
            repo,
            head,
            base,
            title,
            body,
        
          });
          console.log(response)
          return response.data.number
         

    }
    async comment(message:string,repo:string,owner:string,issue_number:number){
        let octokit=this.createOctokitObject();
      let response=await  octokit.rest.issues.createComment({
        body: message,
        issue_number,
        owner,
        repo

       })
       console.log(response)
    }

}