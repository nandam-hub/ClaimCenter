import { GwDomNode } from "../../types/gwTypes";
import { gwInputs } from "../inputs/gwInputs";
import { gwReflection } from "./gwReflection";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export type GwReflectionTriggerListener = (isDirectChange: boolean) => void;
export class GwReflectionTrigger {
  readonly listeners: GwReflectionTriggerListener[] = [];
  readonly id: string;
  readonly widget: GwDomNode;

  constructor(triggerNode: GwDomNode) {
    this.id = triggerNode.id;
    this.widget = triggerNode;
  }

  getValue(): any {
    return gwInputs.getValueById(this.id);
  }

  /**
   * Returns true, if this triggered has already triggered
   */
  hasTriggered(): boolean {
    return gwReflection.hasTriggered(this.id);
  }

  /**
   * Dispatch trigger change event.
   * @param isDirectChange indicates that this change is direct event from the input. false, by default
   */
  dispatchChangeEvent(isDirectChange: boolean = false): void {
    if (!this.hasTriggered()) {
      gwReflection.setHasTriggered(this.id);
      this.listeners.forEach((listener) => listener(isDirectChange));
    }
  }

  addChangeListener(listener: GwReflectionTriggerListener): void {
    this.listeners.push(listener);
  }

  /**
   * For internal use. All direct changes need to trigger events with use of this function.
   * @private
   */
  internalDispatchChangeEvent(): void {
    gwReflection.resetCycleEventsCache();
    this.dispatchChangeEvent(true);
  }
}
