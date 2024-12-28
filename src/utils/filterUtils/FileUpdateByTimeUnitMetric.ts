import { FileUpdateMetric } from "./FileUpdateMetric"

export type TimeUnit = "day"|"week"|"month"| "year"
export class FileUpdateByTimeUnitMetric extends FileUpdateMetric {
    evaluateTimestamps(timestamps: Date[]): number {
      let lastTimeUnit=this.getTimeUnitFromDate(timestamps[0])
      let counter=0
      for(let i=1;i<timestamps.length;i++){
          let timeUnit=this.getTimeUnitFromDate(timestamps[i])
          if(timeUnit!=lastTimeUnit){
              lastTimeUnit=timeUnit
              counter++
          }
      }
      const numberTimeUnits=this.getTimeUnitFromMS(timestamps[timestamps.length-1].getTime()-timestamps[0].getTime())
        return counter/numberTimeUnits
    }
    private timeUnit:TimeUnit
    constructor(args:{ timeUnit:TimeUnit}) {
        super()
        this.timeUnit=args.timeUnit;
    }
    getTimeUnitFromMS(ms:number):number{
        ms=Math.abs(ms)
        if(this.timeUnit=="day"){
            return ms/(1000*60*60*24)
        }
        else if(this.timeUnit=="week"){
            return ms/(1000*60*60*24*7)
        }
        else if(this.timeUnit=="month"){
            return ms/(1000*60*60*24*30)
        }
        else if(this.timeUnit=="year"){
            return ms/(1000*60*60*24*365)
        }
        else{
            throw new Error("Invalid time unit "+this.timeUnit)
        }
    }
    getTimeUnitFromDate(date:Date):number{
        if(this.timeUnit=="day"){
            return date.getDate()
        }
        else if(this.timeUnit=="week"){
            return date.getDay()
        }
        else if(this.timeUnit=="month"){
            return date.getMonth()
        }
        else if(this.timeUnit=="year"){
            return date.getFullYear()
        }
        else{
            throw new Error("Invalid time unit "+this.timeUnit)
        
        }
    }
    incrementDate(date:Date){  
        if(this.timeUnit=="day"){
            date.setDate(date.getDate()+1)
        }
        else if(this.timeUnit=="week"){
            date.setDate(date.getDate()+7)
        }
        else if(this.timeUnit=="month"){
            date.setMonth(date.getMonth()+1)
        }
        else if(this.timeUnit=="year"){
            date.setFullYear(date.getFullYear()+1)
        }
    }
  

}