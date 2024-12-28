import process from "process";
import { SymbolFinder } from "./lsp/SymbolFinder";

async function main(args: string[]) {
    console.log("Hello World");
    console.log("args",args);

    let finder=new SymbolFinder(args[0]);
    await finder.findSymbols(args[1]);
    
}

if(require.main === module){
    main(process.argv.slice(2));
}