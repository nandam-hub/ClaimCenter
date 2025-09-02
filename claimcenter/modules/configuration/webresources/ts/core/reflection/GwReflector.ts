import {gwEvents} from "../events/gwEvents";
import {gwInputSystems} from "../inputs/gwInputSystems";
import {GwDomNode, GwMap} from "../../types/gwTypes";
import {gwUtil} from "../util/gwUtil";
import {gwRangeValue} from "../../comp/inputs/gwRangeValue";
import {gwInputs} from "../inputs/gwInputs";
import {gwReflection} from "./gwReflection";
import {gwDateValue} from "../../comp/dates/gwDateValue";
import {gwForm} from "../gwForm";
import {gwCheckboxDiv} from "../../comp/inputs/gwCheckboxDiv";
import {gwRadioDiv} from "../../comp/inputs/gwRadioDiv";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwReflector {
  readonly id: string;
  readonly widget: GwDomNode;
  private readonly _reflectDirectChangesOnly: boolean;

  /**
   * Wrap reflector node into a Reflector class
   */
  constructor (widgetEl: GwDomNode, reflectionInfo: GwMap) {
    this.id = reflectionInfo[gwReflection.REFLECTOR_ID_PROP];
    const reflectorWidget = gwUtil.getDomNode("#" + this.id);
    if (!reflectorWidget) {
      throw new Error("Unable to locate reflector widget. " + this.id);
    }
    this.widget = reflectorWidget;
    this._reflectDirectChangesOnly = reflectionInfo[gwReflection.DIRECT_CHANGES_ONLY_PROP] === "true";
  }

  /**
   * Returns true, if this reflector is allowed to reflect values. May return false, in case if it is a trigger
   * itself and already has been changed by a user (cycle loops) or if in the configuration, this reflector is marked
   * as a reflector which reflects only direct changes, and this change is not direct
   */
  shouldReflect (isDirectChange: boolean = false): boolean {
    if (this._reflectDirectChangesOnly && !isDirectChange) {
      return false;
    }

    const trigger = gwReflection.getTriggerById(this.id);
    if (trigger) {
      // don't reflect if is a trigger and already triggered.
      return !trigger.hasTriggered();
    }
    return true;
  }

  reflectValue (value: any): void {
    gwInputs.setValueById(this.id, value);

    const trigger = gwReflection.getTriggerById(this.id);
    // reflect further
    if (trigger && !trigger.hasTriggered()) {
      trigger.dispatchChangeEvent();
    }
  }

  reflectOptions (options: any[]): void {
    const getSetType = this.widget.getAttribute("data-gw-getset");
    if (getSetType === "select") {
      gwRangeValue.setOptions(this.widget, options);
    }
  }

  reflectMask (mask: string): void {
    const input = gwInputs.getInputByName(this.widget.id);
    if (input && gwInputs.isTextInput(input)) {
      const valueWidget = gwForm.findEnclosingValueWidget(input);
      input.setAttribute("placeholder", mask);

      if (valueWidget) {
        // Reflected masks always use the default placeholder character, don't have to worry about custom ones
        if (gwInputSystems.isActiveInputMask(mask)) {
          valueWidget.setAttribute("data-gw-input-mask", mask);
        } else {
          valueWidget.setAttribute("data-gw-input-mask", "");
        }
        gwEvents.addAdditionalAttributes(valueWidget);
      }
    }
  }

  reflectAvailable (available: boolean): void {
    const vwChildrenNode = gwUtil.getDomNode(".gw-vw--children", this.widget);

    gwUtil.conditionalAddRemoveAttr(!available, this.widget, "aria-disabled", "true");
    if (vwChildrenNode) {
      gwUtil.conditionalAddRemoveClass(!available, vwChildrenNode, "gw-hidden");
    }
    this.setEnabled(available);
  }

  setEnabled (enabled: boolean = false): void {
    const dataType = this.widget.getAttribute("data-gw-getset");
    if (dataType === "checkboxgroup") {
      gwCheckboxDiv.setEnabledForCheckboxGroup(this.widget, enabled);
    } else if (dataType === "radio") {
      gwRadioDiv.setEnabledForRadioDivGroup(this.widget, enabled);
    } else if (dataType === "date") {
      gwDateValue.enable(this.widget, enabled);
    } else {
      const input = this.widget.querySelector("input")
        || this.widget.querySelector("select")
        || this.widget.querySelector("textarea");
      if (!input) {
        throw new Error("Attempting to set disabled state on a value widget without a valid input or select");
      }
      input.disabled = !enabled;
    }
  }
}
