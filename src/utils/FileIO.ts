import * as fs from 'fs';
import * as path from 'path';
export abstract class FileIO{
    public static instance:FileIO;
    readFileSync(path:string):string{
        path=this.resolvePath(path)
       return  fs.readFileSync (path,{encoding:"utf-8"})
    }
    writeFileSync(path:string,data:string):void{
        path=this.resolvePath(path)
        if(data)
        fs.writeFileSync(path,data)
    }

    existsSync(path:string):boolean{
        path=this.resolvePath(path)

        return fs.existsSync(path);
    }

    abstract resolvePath(path:string):string
}

export class StubPathIO extends FileIO{
    resolvePath(p: string): string {
        fs.mkdirSync("stuff/"+path.dirname(p),{recursive:true})
        return "stuff/"+p;
    }
}

export class PathBasedIO extends FileIO{
    constructor(private path:string){
        super()
    }
    resolvePath(p: string): string {
        let outPath=path.resolve(this.path,".gitgraf_data","proposals")
        fs.mkdirSync(outPath,{recursive:true})
        let p2=path.basename(p,path.extname(p))
        p2+=Date.now().toString();
        return path.resolve(outPath,p2+path.extname(p))
    }
}