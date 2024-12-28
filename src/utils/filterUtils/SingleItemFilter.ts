import {  ProjectContext } from "../../context/DataContext";
export interface FilterOrMetric{
    isCompatibleWithDataClump():boolean;
    isCompatibleWithString():boolean;

}
export interface SingleItemFilter extends FilterOrMetric {
    shallRemain(data: any,context:ProjectContext): Promise<boolean>;
  
}