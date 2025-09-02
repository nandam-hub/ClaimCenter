import { gwDateValue } from "../../comp/dates/gwDateValue";
import { gwPrivacy } from "../../comp/inputs/gwPrivacy";
import { gwRangeValue } from "../../comp/inputs/gwRangeValue";
import {
  GwClassIdTagOrNode,
  GwDomNode,
  GwInputElement,
  GwMap,
  GwTypedMap,
  GwValueWidgetElement,
  HTMLCheckboxElement,
  HTMLCheckboxOrRadioElement,
  HTMLFileInputElement,
  HTMLRadioElement,
  HTMLTextInputElement,
} from "../../types/gwTypes";
import { gwAria } from "../aria/GwAria";
import { gwEvents } from "../events/gwEvents";
import { gwReflection } from "../reflection/gwReflection";
import { GwRegisteredSystem } from "../util/GwRegisteredSystem";
import { GwSet } from "../util/GwSet";
import { gwUtil } from "../util/gwUtil";
import { gwInputSystems, GwInputSystemType } from "./gwInputSystems";
import {gwCheckboxDiv} from "../../comp/inputs/gwCheckboxDiv";
import {gwRadioDiv} from "../../comp/inputs/gwRadioDiv";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export type GwInputValue = string[] | string | number | undefined | boolean | null;

export class GwInputs extends GwRegisteredSystem {
  getSystemName(): string {
    return "gwInputs";
  }

  // =====================================
  // == TYPE CHECKING
  // =====================================

  isReadOnlyValueWidget(valueWidget: GwDomNode): boolean {
    return gwUtil.hasClass(valueWidget, "gw-readonly");
  }

  isSelect(el: GwInputElement): el is HTMLSelectElement {
    return !!(el.tagName && el.tagName.toLowerCase() === "select");
  }

  isCheckbox(el: GwInputElement): el is HTMLCheckboxElement {
    return el.getAttribute("type") === "checkbox";
  }

  isRadio(el: GwInputElement): el is HTMLRadioElement {
    return el.getAttribute("type") === "radio";
  }

  isCheckboxOrRadio(el: GwInputElement | HTMLOptionElement): el is HTMLCheckboxOrRadioElement {
    return this.isCheckbox(el as GwInputElement) || this.isRadio(el as GwInputElement);
  }

  isTextInput(el: HTMLElement): el is HTMLTextInputElement {
    const inputType = el.getAttribute("type");
    if (!inputType) {
      return false;
    }

    return (
      inputType === "text" ||
      inputType === "url" ||
      inputType === "tel" ||
      inputType === "search" ||
      inputType === "password" ||
      inputType === "email" ||
      inputType === "number" ||
      inputType === "date" ||
      inputType === "datetime-local"
    );
  }

  isTextInputOrTextArea(el: GwDomNode): el is HTMLTextAreaElement | HTMLTextInputElement {
    if (!el || !el.tagName) {
      return false;
    }

    return el.tagName.toLowerCase() === "textarea" || this.isTextInput(el);
  }

  getDefaultValueForInputElement(el: GwInputElement): GwInputValue {
    if (this.isSelect(el)) {
      if (el.hasAttribute("multiple")) {
        return this.getSelectMultipleDefaultValue(el);
      } else {
        return this.getSelectSingleDefaultValue(el);
      }
    } else if (this.isCheckboxOrRadio(el)) {
      return el.defaultChecked;
    }

    return el.defaultValue;
  }

  private getSelectSingleDefaultValue(el: HTMLSelectElement): string {
    for (let i = 0; i < el.options.length; i++) {
      const opt = el.options[i];
      if (opt.defaultSelected) {
        return opt.value;
      }
    }

    return "";
  }

  private getSelectMultipleDefaultValue(el: HTMLSelectElement): string[] {
    const vals = [];
    for (let i = 0; i < el.options.length; i++) {
      const opt = el.options[i];
      if (opt.defaultSelected) {
        vals.push(opt.value);
      }
    }

    return vals;
  }

  // =====================================
  // ==
  // =====================================
  /**
   * Search the page for the input with the given name. If found, return its DOM node. Otherwise return null
   */
  getInputByName(name: string): GwInputElement | null {
    return gwUtil.getDomNodeByName(name) as GwInputElement;
  }

  clearInputById(el: GwDomNode, args: GwMap): void {
    gwInputs.setValueById(args.targetName, "");
  }

  // =====================================
  // == GW API GETTERS
  // =====================================
  /** Exposed as gw.api.Util.getValue, see gw.api */
  getValueById(widgetIdOrElement: string | GwValueWidgetElement): GwInputValue {
    // Get matching value widget
    const valueWidget = typeof widgetIdOrElement === "string" ? document.getElementById(widgetIdOrElement) : widgetIdOrElement;

    if (!valueWidget) {
      return undefined;
    }

    // Get the data-gw-getset type
    const valueType = valueWidget.getAttribute("data-gw-getset");
    if (!valueType) {
      throw new Error("Attempting to getValueById for a widget without a getset attribute.");
    }

    if (this.isReadOnlyValueWidget(valueWidget)) {
      return this.getValueFromReadOnlyValueWidget(valueWidget, valueType);
    }

    switch (valueType) {
      case "text":
      case "privacy": // note: privacy valueType is asymmetrical; the setValueById does not follow the same route as that of text valueType
        return this.getValueFromEditableTextInputWidget(valueWidget);
      case "select":
        return this.getValueFromEditableSelectWidget(valueWidget);
      case "multiselect":
      case "shuttle": // note: shuttle valueType is asymmetrical; the setValueById uses a shuttle specific method
        return this.getValuesFromEditableMultiSelectWidget(valueWidget);
      case "checkbox":
        return this.getCheckedFromEditableCheckboxWidget(valueWidget);
      case "checkboxgroup":
        return this.getValuesFromEditableCheckboxGroupWidget(valueWidget);
      case "radio":
        return this.getCheckedFromEditableRadioWidget(valueWidget);
      case "date":
        return this.getValueFromEditableDateWidget(valueWidget);
      case "file":
        return this.getValueFromEditableFileWidget(valueWidget);
      case "radioascheckbox":
        return this.getCheckedFromEditableRadioAsCheckboxWidget(valueWidget);
    }

    throw new Error('attempted to get value from an editable value widget without a known data-gw-getset attribute: " + valueType');
  }

  /** Exposed as gw.api.Util.getValues, see gw.api */
  getValuesByIds(ids: string[]): GwInputValue[] {
    return ids.map((id) => this.getValueById(id));
  }

  /** Exposed as gw.api.Util.setValue, see gw.api */
  setValueById(widgetIdOrElement: string | GwDomNode, value: GwInputValue, forceChangeEvent: boolean = false): boolean {
    const valueWidget = typeof widgetIdOrElement === "string" ? document.getElementById(widgetIdOrElement) : widgetIdOrElement;
    if (!valueWidget) {
      return false;
    }

    const valueType = valueWidget.getAttribute("data-gw-getset");

    if (!valueType) {
      throw new Error("cannot setValueById on a widget without a data-gw-getset attribute");
    }

    if (this.isReadOnlyValueWidget(valueWidget)) {
      return this.setValueForReadonlyWidget(valueWidget, value, valueType);
    }

    const currentValue = this.getValueById(valueWidget);

    if (gwUtil.shallowCompare(currentValue, value)) {
      return true;
    }

    switch (valueType) {
      case "text":
        return this.setValueForEditableTextInputWidget(valueWidget, value as string, forceChangeEvent);
      case "privacy":
        return this.setValueForPrivacyWidget(valueWidget, value as string, forceChangeEvent);
      case "select":
        return this.setValueForEditableSelectWidget(valueWidget, value as string, forceChangeEvent);
      case "shuttle":
        return this.setValuesForEditableShuttleWidget(valueWidget, value as string[], forceChangeEvent);
      case "multiselect":
        return this.setValuesForEditableMultiSelectWidget(valueWidget, value as string[], forceChangeEvent);
      case "checkbox":
        return this.setCheckedForEditableCheckboxWidget(valueWidget, value as boolean, forceChangeEvent);
      case "checkboxgroup":
        return this.setValuesForEditableCheckboxGroupWidget(valueWidget, value as string[], forceChangeEvent);
      case "radio":
        return this.setValueForEditableRadioWidget(valueWidget, value as string, forceChangeEvent);
      case "date":
        return this.setValueForEditableDateWidget(valueWidget, value as string, forceChangeEvent);
      case "file":
        return this.setValueForEditableFileWidget(valueWidget, value as string, forceChangeEvent);
      case "radioascheckbox":
        return this.setCheckedForEditableRadioAsCheckboxWidget(valueWidget, value as boolean, forceChangeEvent);
    }

    throw new Error("attempted to set value by id on a widget with an unknown data-gw-getset attribute: " + valueType);
  }

  /** Exposed as gw.api.Util.setValues, see gw.api */
  setValuesByIds(valuesById: GwMap, forceChangeEvent: boolean = false): boolean {
    this.validateSetValuesConfig(valuesById);
    let foundAllInputs = true;
    gwUtil.forEach(valuesById, (val, id) => {
      if (!this.setValueById(id, val, forceChangeEvent)) {
        foundAllInputs = false;
      }
    });

    return foundAllInputs;
  }

  getValuesByIdsAsMap(ids: string[]): GwTypedMap<GwInputValue> {
    const returnObj: GwTypedMap<GwInputValue> = {};
    gwUtil.forEach(ids, (id: string) => {
      returnObj[id] = this.getValueById(id);
    });
    return returnObj;
  }

  private validateSetValuesConfig(valuesById: GwMap): void {
    let previousPOCExist = false;

    gwUtil.forEach(valuesById, (val, id) => {
      const input = this.getInputByName(id);
      if (!input) {
        return;
      }

      const widgetNode = gwEvents.findEnclosingValueWidgetOrThrow(input);
      if (!widgetNode) {
        return;
      }

      if (gwInputSystems.hasPostOnChange(widgetNode)) {
        if (previousPOCExist) {
          console.warn("calling setValues on more than one field with postOnChange is not supported");
        } else {
          previousPOCExist = true;
        }
      }
      // reflection will not work properly after postOnChange
      if (gwReflection.isReflectionTrigger(widgetNode) && previousPOCExist) {
        console.warn("calling setValues on more than one field with postOnChange/reflection is not supported");
      }
    });
  }

  // =====================================
  // == INPUT TYPE GETTERS AND SETTERS
  // =====================================

  /**
   * This is weak implementation to support existing functionality pre version 10;
   * as it's unclear how much the relatively broken feature of getting values from read only value widgets was used,
   * and for what purpose.
   *
   * It simply calls jQuery.text on the gw-vw--value section of the value widget if it has one.
   * Otherwise, it calls jQuery.text on the entire widget.
   * @param {GwDomNode} valueWidget
   * @param {string} valueType
   * @returns string
   */
  private getValueFromReadOnlyValueWidget(valueWidget: GwDomNode, valueType: string): string {
    const valueWrapper = $(valueWidget).find(".gw-vw--value");
    if (valueWrapper[0]) {
      return valueWrapper.text();
    }

    return $(valueWidget).text();
  }

  private getValueFromEditableTextInputWidget(valueWidget: GwDomNode): string {
    return (gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLTextInputElement).value;
  }

  private getValueFromEditableSelectWidget(valueWidget: GwDomNode): string {
    return (gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLSelectElement).value;
  }

  private getValuesFromEditableMultiSelectWidget(valueWidget: GwDomNode): string[] {
    const select = gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLSelectElement;
    return gwUtil.mapFilterUndefined(select.options, (opt) => (opt.selected ? opt.value : undefined));
  }

  private getCheckedFromEditableCheckboxWidget(valueWidget: GwDomNode): boolean {
    return (gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLCheckboxElement).checked;
  }

  private getValuesFromEditableCheckboxGroupWidget(valueWidget: GwDomNode): string[] {
    const checkboxes = gwUtil.getDomNodesByName(valueWidget.id, valueWidget) as NodeListOf<HTMLCheckboxElement>;
    return gwUtil.mapFilterUndefined(checkboxes, (checkbox) => (checkbox.checked ? checkbox.value : undefined));
  }

  private getCheckedFromEditableRadioWidget(valueWidget: GwDomNode): string | undefined {
    const radios = gwUtil.getDomNodesByName(valueWidget.id, valueWidget) as NodeListOf<HTMLRadioElement>;

    for (let i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        return radios[i].value;
      }
    }

    return undefined;
  }

  private getValueFromEditableDateWidget(valueWidget: GwDomNode): string {
    return gwDateValue.getValue(valueWidget);
  }

  private getValueFromEditableFileWidget(valueWidget: GwDomNode): string {
    return (valueWidget.querySelector("input[type='file']") as HTMLFileInputElement).value;
  }

  private getCheckedFromEditableRadioAsCheckboxWidget(valueWidget: GwValueWidgetElement): boolean {
    return (valueWidget.querySelector("input[type='checkbox']") as HTMLCheckboxElement).checked;
  }

  // Setters

  /**
   * This is a weak implementation to support functionality pre version 10, where it's unclear how, and how often
   * the relatively broken feature of setting a value on a readonly value widget was used.
   *
   * It only supports setting the value for widgets with the getset type of 'text'.
   * Even then it logs a warning about the API being a deprecated feature, and suggesting to use post on change.
   *
   * If the widget has a child gw-value-readonly-wrapper then we set the value there. Otherwise, we throw an error
   *
   * For any other getset types, it throws an error.
   * @param {GwDomNode} valueWidget
   * @param {GwInputValue} val
   * @param {string} valueType
   * @returns {boolean}
   */
  private setValueForReadonlyWidget(valueWidget: GwDomNode, val: GwInputValue, valueType: string): boolean {
    if (valueType === "text") {
      const readonlyWrapper = valueWidget.querySelector(".gw-value-readonly-wrapper");
      if (readonlyWrapper) {
        console.warn(
          "Setting values on readonly widgets is a deprecated feature. The value will not be persisted to the server. Consider using Post on Change and updating the widget's value"
        );
        $(readonlyWrapper).text("" + val);
        return true;
      }

      throw new Error("Attempted to set a value by id on a readonly value widget without a child element with .gw-value-readonly-wrapper.");
    }

    throw new Error("Setting values on readonly widgets with value types other than 'text' is not supported.");
  }

  private setValueForEditableTextInputWidget(valueWidget: GwDomNode, value: string | null, fireChangeEvent: boolean = false): boolean {
    const input = gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLTextInputElement;
    if (!input) {
      return false;
    }
    return this.setValueOnTextInputElement(input, value, undefined, fireChangeEvent);
  }

  private setValueForEditableSelectWidget(valueWidget: GwDomNode, value: string, fireChangeEvent: boolean = false): boolean {
    const select = gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLSelectElement;
    if (!select) {
      return false;
    }
    return this.setValueOnSelect(select, value, fireChangeEvent);
  }

  private setValuesForEditableMultiSelectWidget(valueWidget: GwDomNode, value: string[], fireChangeEvent: boolean = false): boolean {
    const select = gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLSelectElement;
    if (!select) {
      return false;
    }
    return this.setValuesOnMultiSelect(select, value, fireChangeEvent, null);
  }

  private setValuesForEditableShuttleWidget(valueWidget: GwDomNode, value: string[], fireChangeEvent: boolean = false): boolean {
    const select = gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLSelectElement;
    if (!select) {
      return false;
    }
    return this.setValuesOnMultiSelect(select, value, fireChangeEvent, () => gwRangeValue.updateAvailableAndSelectedShuttleLists(select));
  }

  private setCheckedForEditableCheckboxWidget(valueWidget: GwDomNode, checked: boolean, fireChangeEvent: boolean = false): boolean {
    const checkbox = gwUtil.getDomNodeByName(valueWidget.id, valueWidget) as HTMLCheckboxElement;

    if (!checkbox) {
      return false;
    }

    if (checkbox.checked === checked) {
      return true;
    }

    checkbox.checked = checked;

    gwCheckboxDiv.syncCheckboxDivToCheckboxInput(checkbox);

    if (fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(checkbox);
    }

    return true;
  }

  private setValuesForEditableCheckboxGroupWidget(
    valueWidget: GwDomNode,
    values: string[] | string,
    fireChangeEvent: boolean = false
  ): boolean {
    if (!Array.isArray(values)) {
      values = [values];
    }

    const valueMap = GwSet.createFromArray(values);
    const checkboxes = gwUtil.getDomNodesByName(valueWidget.id);
    if (checkboxes.length === 0) {
      return false;
    }
    let changedInput;

    gwUtil.forEachReverse(checkboxes, (checkbox) => {
      const newChecked = valueMap.has(checkbox.value);
      if (checkbox.checked !== newChecked) {
        checkbox.checked = newChecked;
        gwCheckboxDiv.syncCheckboxDivToCheckboxInput(checkbox);
        changedInput = checkbox;
      }
    });

    if (changedInput && fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(changedInput);
    }

    return true;
  }

  private setValueForEditableRadioWidget(valueWidget: GwDomNode, value: string, fireChangeEvent: boolean = false): boolean {
    const radios = gwUtil.getDomNodesByName(valueWidget.id) as NodeListOf<HTMLRadioElement>;
    if (radios.length === 0) {
      return false;
    }
    let changedInput;
    // only one radio will be selected. Loop through all the radios, set the check to true if
    // the value is the same as the target value. Otherwise set the check to false.
    gwUtil.forEachReverse(radios, (radio) => {
      if (radio.value === value) {
        if (radio.checked === false) {
          changedInput = radio;
          radio.checked = true;
        }
      } else if (radio.checked === true) {
        changedInput = radio;
        radio.checked = false;
      }
    });

    gwRadioDiv.possiblySyncAllRadioDivs(radios[0]);

    if (changedInput && fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(changedInput);
    }
    return true;
  }

  private setValueForEditableDateWidget(valueWidget: GwDomNode, value: string, fireChangeEvent: boolean = false): boolean {
    const success = gwDateValue.setValue(valueWidget, value);

    if (success && fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(valueWidget);
    }

    return success;
  }

  private setValueForEditableFileWidget(valueWidget: GwDomNode, value: string, fireChangeEvent: boolean = false): never {
    throw new Error("Setting values on file inputs is not supported");
  }

  private setCheckedForEditableRadioAsCheckboxWidget(valueWidget: GwDomNode, checked: boolean, fireChangeEvent: boolean = false): boolean {
    const checkbox = valueWidget.querySelector("input[type='checkbox']") as HTMLCheckboxElement;

    if (!checkbox) {
      return false;
    }

    if (checkbox.checked === checked) {
      return true;
    }

    checkbox.checked = checked;
    if (fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(checkbox);
    }

    return true;
  }

  private setValueForPrivacyWidget(valueWidget: GwDomNode, value: string, fireChangeEvent: boolean = false): boolean {
    const success = gwPrivacy.setValueProgrammatically(valueWidget, value);

    if (success && fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(valueWidget);
    }

    return success;
  }

  // =====================================
  // == ELEMENT LEVEL SET AND GET
  // =====================================
  setValueOnTextInputElement(
    el: HTMLTextInputElement | HTMLTextAreaElement,
    val: string | null,
    cursorPos?: number,
    fireChangeEvent: boolean = false,
    notificationSystemToIgnore?: GwInputSystemType
  ): boolean {
    if (val === null) {
      val = "";
    }

    val = "" + val;
    el.setAttribute("data-gw-prev", val);

    if (el.value === val) {
      if (cursorPos !== undefined && document.activeElement === el) {
        gwInputSystems.setCursorPos(el, cursorPos);
      }
      return true;
    }

    el.value = val;

    if (cursorPos !== undefined && document.activeElement === el) {
      gwInputSystems.setCursorPos(el, cursorPos);
    }

    if (el instanceof HTMLInputElement) {
      gwInputSystems.notifySystemsOfInputValueChange(el, notificationSystemToIgnore);
    }

    if (fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(el);
    }

    gwAria.addAriaLabelToInputIfPrefixedOrSuffixed(el);

    return true;
  }

  setValueOnSelect(classIdTagOrNode: GwClassIdTagOrNode, valStr: string | string[], fireChangeEvent: boolean = false): boolean {
    const el = gwUtil.getDomNode(classIdTagOrNode) as HTMLSelectElement;

    if (!el) {
      throw new Error("Attempted to set an option on a null select element");
    }

    if (el.tagName.toLowerCase() !== "select") {
      throw new Error("Tried to setValueOnSelect on a non select element.");
    }

    valStr = Array.isArray(valStr) ? valStr[0] : valStr;

    if (el.value === valStr) {
      return true;
    }

    el.value = valStr;

    if (fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(el);
    }

    return true;
  }

  setValuesOnMultiSelect(
    el: HTMLSelectElement,
    values: string[] | string,
    fireChangeEvent: boolean = false,
    afterOptionsUpdated: (() => void) | null = null
  ): boolean {
    if (!Array.isArray(values)) {
      values = [values];
    }

    const newValueSet = GwSet.createFromArray(values);

    let valueChanged = false;

    gwUtil.forEachReverse($("option", el), (opt) => {
      const newSelected = newValueSet.has(opt.value);
      if (opt.selected !== newSelected) {
        opt.selected = newSelected;
        valueChanged = true;
      }
    });

    if (afterOptionsUpdated) {
      afterOptionsUpdated();
    }

    if (valueChanged && fireChangeEvent) {
      gwEvents.forceGlobalChangeEvent(el);
    }

    return true;
  }

}

export const gwInputs = new GwInputs();
