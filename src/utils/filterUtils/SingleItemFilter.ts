import {  ProjectContext, RelevantLocation } from "../../context/DataContext";
export type PathOrRelevantLocation =string | RelevantLocation
export interface FilterOrMetric{
    isCompatibleWithString():boolean;

}
export interface SingleItemFilter extends FilterOrMetric {
    shallRemain(data: PathOrRelevantLocation,context:ProjectContext): Promise<boolean>;
  
}