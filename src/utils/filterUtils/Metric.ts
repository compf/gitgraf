import { ProjectContext } from "../../context/DataContext";
import { FilterOrMetric, PathOrRelevantLocation } from "./SingleItemFilter";
export interface Metric extends FilterOrMetric{
    /**
     * Evaluate a path or a data clump and returns a number
     * @param data data
     * @param context the current context
     */
    evaluate(data: PathOrRelevantLocation,context:ProjectContext): Promise<number>;
   
}