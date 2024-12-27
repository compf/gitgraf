import { SymbolFinder } from "./lsp/SymbolFinder";

async function main(){
    console.log("Hello World");

    let finder=new SymbolFinder();
    await finder.findSymbols()
    
}

if(require.main === module){
    main();
}