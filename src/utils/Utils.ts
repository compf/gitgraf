export function tryParseJSON(jsonText:string):any{
    try{
        return JSON.parse(jsonText)
    }catch(e){
        return null
    }
}

export function waitSync(ms:number){
    let start = Date.now(), now = start;
    while (now - start < ms) {
        now = Date.now();
    }
}