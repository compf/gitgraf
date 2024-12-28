import { ProjectContext } from "../../context/DataContext";
import { PipeLineStep, PipeLineStepType } from "../PipeLineStep";

/**
 * Abstract class that represents a step handler
 */
export abstract class AbstractStepHandler {

   /**
    * handle a step and return a new context based on the step and the previous context
    * @param step The step the handler needs to execute
    * @param context The previous context
    * @param params additional data, usually unused
    */
   abstract handle(step: PipeLineStepType, context: ProjectContext, params: any): Promise<ProjectContext>;

   /**
    * Get the steps that this handler can execute
    */
   abstract getExecutableSteps(): PipeLineStepType[];

   canDoStep(step: PipeLineStepType): boolean {
      return this.getExecutableSteps().includes(step);
   }

   /**
    * 
    * @returns checks if the handler is compatible with the current system
    */
    checkCompatibleWithSystem():void {
   }

      /**
       * adds to the provided set all the context names that are required for the step 
       * @param pipeLineStep the step to handle
       * @param requirements a set of context names that will be modified to include the required context names
       */
   addAditionalContextRequirementNames(pipeLineStep: PipeLineStepType, requirements: Set<string>): void {

   }
   /**
    * add all context names that are created by the step to the provided set
    * @param pipeLineStep  the step to handle
    * @param createdContexts a set of context names that will be modified to include the created context names
    */
   abstract addCreatedContextNames(pipeLineStep: PipeLineStepType, createdContexts: Set<string>): void
   /**
    * deserialize the context from the file system if it possible, else return null
    * @param context the previous context
    * @param step the current step
    * @returns the new context or null if it is not possible to deserialize the context
    */
   deserializeExistingContext(context: ProjectContext, step:  PipeLineStepType): ProjectContext | null {
      return context
   }
}