
import { PipeLine } from "./pipeline/PipeLine"
import  fs from "fs"
import {resolve} from "path"


import { loadConfiguration, activateLoader } from "./config/Configuration";
import { FileIO, PathBasedIO } from "./utils/FileIO"

async function main(){
    activateLoader()
    let args=handleArguments(process.argv.slice(2))
    FileIO.instance=new PathBasedIO(args.project_path!)
    let context=loadConfiguration(args.config_path)
    context.sharedData.path=args.project_path


    let finalContext=await PipeLine.Instance.executeAllSteps( context)
    console.log("program finished")
    process.exit(0)
}
type Arguments={
    project_path?:string
    config_path:string
}
function handleArguments(args:string[]):Arguments{
    for(let i=0;i<args.length;i++){
       args[i]=resolve(args[i])
    }
    if(args.length<=0){
        throw new Error ("Please provide a path to a project")
    }
    else if(args.length==1 && fs.lstatSync(args[0]).isFile()){
        return {
            config_path:args[0],
        }
    }
    else if(args.length==1 && fs.lstatSync(args[0]).isDirectory()){
        return {
            project_path:args[0],
            config_path:resolve(args[0],"config.json")
        }
    }
    else if(args.length>=2){
        let configPartIndex=fs.lstatSync(args[0]).isFile()?0:1;
        let projectPath=args[1-configPartIndex]

        // a third argument deletes the data folder
        if(args.length>2){
            fs.rmSync(resolve(projectPath,".gitgraf_data"),{recursive:true,force:true})
        }
        return {
            project_path:args[1-configPartIndex],
            config_path:args[configPartIndex]
        }
    }
    else{
        throw new Error("Invalid arguments")
    }
    
}
if(require.main === module){
    main();

}

