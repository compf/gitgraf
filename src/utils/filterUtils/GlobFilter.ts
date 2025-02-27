import {  ProjectContext } from "../../context/DataContext";
import { SingleItemFilter } from "./SingleItemFilter";
import { shallIgnore } from "../Utils";

export class GlobFilter implements SingleItemFilter{
    private glob: string
   async shallRemain(data:any, context: ProjectContext): Promise<boolean> {
        let path=data as string
        let m=path.match(this.glob);
        return m!=null

    }

    isCompatibleWithString(): boolean {
        return true
    }
    constructor(args: {glob:string}) {
        this.glob=args.glob
    }

}