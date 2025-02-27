import { ProjectContext } from "../../context/DataContext";
import { Metric } from "./Metric";
import { PathOrRelevantLocation } from "./SingleItemFilter";

export class MetricNegator implements Metric{
    public metric:Metric;
    constructor(metric:Metric){
        this.metric=metric;
    }
    async evaluate(data: PathOrRelevantLocation, context: ProjectContext): Promise<number> {
        return  -1 * await  this.metric.evaluate(data, context);
    }

    isCompatibleWithString(): boolean {
        return this.metric.isCompatibleWithString();
    }

}