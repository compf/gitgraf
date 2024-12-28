import { ProjectContext } from "../../context/DataContext";
import { Metric } from "./Metric";

export class MetricNegator implements Metric{
    public metric:Metric;
    constructor(metric:Metric){
        this.metric=metric;
    }
    async evaluate(data: any, context: ProjectContext): Promise<number> {
        return  -1 * await  this.metric.evaluate(data, context);
    }
    isCompatibleWithDataClump(): boolean {
        return this.metric.isCompatibleWithDataClump();
    }
    isCompatibleWithString(): boolean {
        return this.metric.isCompatibleWithString();
    }

}