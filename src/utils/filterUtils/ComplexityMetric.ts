import fs from "fs";
import { ProjectContext } from "../../context/DataContext";
import { Metric } from "./Metric";
import { PathOrRelevantLocation } from "./SingleItemFilter";
import { fileURLToPath } from "url";
const complexChars={
    "<":null,
    ">":null,
    "(":null,
    ")":null,
    "{":null,
    "}":null,
    "[":null,
    "]":null,
    "+":null,
    "-":null,
    "*":null,
    "/":null,
    "%":null,
    "=":null,
    ":":null,


}
export class ComplexityMetric implements Metric{
    isCompatibleWithString(): boolean {
        return true;
    }

    async evaluate(data: PathOrRelevantLocation, context: ProjectContext): Promise<number> {
        let content="";

        if(typeof(data)=="string"){
            content=fs.readFileSync(data).toString()
        }
        else{
             content=fs.readFileSync(fileURLToPath(data.uri)).toString().split("\n").slice(data.location.start.line,data.location.end.line).join("\n")
        }
        let counter=0;
        for(let c of content){
            if(c in complexChars){
                counter++
            }
        }
        return counter;
    }
}