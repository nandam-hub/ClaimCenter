import {
  GwDomNode,
  GwDomNodeList,
  GwInputElement,
  GwMap,
  GwTypedMap,
  GwValueWidgetElement,
  HTMLCheckboxElement
} from "../types/gwTypes";
import { gwEvents } from "./events/gwEvents";
import { gwStorage } from "./gwStorage";
import { gwInputs, GwInputValue } from "./inputs/gwInputs";
import { GwInitializableSystem } from "./util/GwInitializableSystem";
import { GwSet } from "./util/GwSet";
import { gwUtil } from "./util/gwUtil";
import {gwCheckboxDiv} from "../comp/inputs/gwCheckboxDiv";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwForm extends GwInitializableSystem {
  getSystemName(): string {
    return "gwForm";
  }

  private readonly CURRENT_EDIT_CONTROLLERS_KEY: string = "currentEditControllers";
  readonly FORM_EDIT_VALUES_BY_ID_KEY: string = "formEditValuesById";
  private readonly CHANGED_CSS_CLASS: string = "gw-changed";
  private readonly EDIT_CONTROLLER_DATA_ATTR: string = "data-gw-edit-id";
  private readonly EDIT_CONTROLLER_NO_TRACK_ATTR: string = "data-gw-no-track";
  private readonly NO_TRACK_CSS_CLASS: string = "gw-noTrack";
  private readonly ADDED_ENTRY_VALUE: string[] = [];

  init(isFullPage: boolean): void {
    const editableControllerIds = this.handleNewEditableControllers();
    this.updateDirtyStatusOfInputs(editableControllerIds);
  }

  // ============ public helper methods =================
  isDirty(): boolean {
    return !!document.querySelector("." + this.CHANGED_CSS_CLASS);
  }

  isInputDirty(el: GwInputElement | GwValueWidgetElement): boolean {
    const name = (el as any).name;
    if (el.hasAttribute(name) && (!gwUtil.hasValue(name) || name.length === 0)) {
      return false;
    }

    const valueWidget = this.findEnclosingValueWidget(el);
    if (!valueWidget) {
      return false;
    }

    const parentScreen = gwUtil.getSelfOrFirstParentWithAttr(el, this.EDIT_CONTROLLER_DATA_ATTR);
    if (!parentScreen || parentScreen.hasAttribute(this.EDIT_CONTROLLER_NO_TRACK_ATTR)) {
      return false;
    }

    const controllerId = parentScreen.getAttribute(this.EDIT_CONTROLLER_DATA_ATTR);
    if (!controllerId) {
      return false;
    }

    const currentServerValue = this.getValueWidgetOriginalServerValue(valueWidget, controllerId);
    return this.updateChangedBasedOnOriginalServerValue(valueWidget, currentServerValue);
  }

  findEnclosingValueWidget(el: GwDomNode): GwValueWidgetElement | null {
    return gwUtil.getSelfOrFirstParentWithClass(el, ".gw-ValueWidget", gwEvents.LIMITED_PARENT_SEARCH_STEPS_FOR_RAPID_FIRE_EVENTS);
  }

  // =========== methods internal to the form systems ============
  getValueWidgetOriginalServerValue(el: GwValueWidgetElement, controllerId?: string): GwInputValue {
    if (!el.id) {
      // This is an untrackable element that wasn't set up to receive focus either, so bail
      return undefined;
    }

    if (controllerId === undefined) {
      const screenWidget = gwUtil.getSelfOrFirstParentWithAttr(el, this.EDIT_CONTROLLER_DATA_ATTR);
      if (!screenWidget) {
        throw new Error("Unable to locate screen widget for value widget: " + el.id);
      }

      controllerId = screenWidget.getAttribute(this.EDIT_CONTROLLER_DATA_ATTR) || "";
    }

    if (!controllerId) {
      // We are not in edit mode, so bail;
      return undefined;
    }

    const map = gwStorage.get(this.FORM_EDIT_VALUES_BY_ID_KEY + "." + controllerId);

    if (!map) {
      // We are not in edit mode, or the local storage has overflowed and we've had to clear it
      return undefined;
    }

    return map[this.getValueId(el)];
  }

  private updateChangedBasedOnOriginalServerValue(valueWidget: GwValueWidgetElement, serverValue: GwInputValue): boolean {
    if (gwUtil.hasClass(valueWidget, this.NO_TRACK_CSS_CLASS)) {
      return false;
    }

    if (!valueWidget.id) {
      return false;
    }
    const currentVal = gwInputs.getValueById(valueWidget.id);
    const isDirty = this.isFromAddedEntry(serverValue) || !gwUtil.shallowCompare(currentVal, serverValue);

    const getSetAttr = valueWidget.getAttribute("data-gw-getset");
    if (getSetAttr === "multiselect") {
      this.markMultiselectOptionsAsDirty(valueWidget, currentVal as string[], serverValue as string[]);
    } else if (getSetAttr === "checkboxgroup") {
      this.markCheckboxgroupOptionsAsDirty(valueWidget, currentVal as string[], serverValue as string[]);
    }

    gwUtil.conditionalAddRemoveClass(isDirty, valueWidget, this.CHANGED_CSS_CLASS);

    return isDirty;
  }

  private markMultiselectOptionsAsDirty(valueWidget: GwValueWidgetElement, currentVal: string[], serverVal: string[]): void {
    const selectEls = valueWidget.querySelectorAll("select[multiple]");
    if (selectEls.length === 0) {
      return;
    }

    const currentSet = GwSet.createFromArray(currentVal);
    const serverSet = GwSet.createFromArray(serverVal);

    // We grab the last select. This works for single multiselects, and for shuttlelists
    const selectEl = selectEls[selectEls.length - 1] as HTMLSelectElement;
    gwUtil.forEachReverse(selectEl.options, (opt) => {
      const optionVal = opt.value;
      const valueDiffers = this.isFromAddedEntry(serverVal) || currentSet.has(optionVal) !== serverSet.has(optionVal);
      gwUtil.conditionalAddRemoveClass(valueDiffers, opt, "gw-changed");
    });
  }

  private markCheckboxgroupOptionsAsDirty(valueWidget: GwValueWidgetElement, currentVal: string[], serverVal: string[]): void {
    const checkboxEls = valueWidget.querySelectorAll("input[type='checkbox']") as NodeListOf<HTMLCheckboxElement>;
    if (checkboxEls.length === 0) {
      return;
    }

    const currentSet = GwSet.createFromArray(currentVal);
    const serverSet = GwSet.createFromArray(serverVal);

    gwUtil.forEachReverse(checkboxEls, (checkbox) => {
      const checkboxValue = checkbox.value;
      const valueDiffers = this.isFromAddedEntry(serverVal) || currentSet.has(checkboxValue) !== serverSet.has(checkboxValue);
      gwCheckboxDiv.possiblyUpdateGwChanged(checkbox, valueDiffers);
    });
  }

  private getEditableValueWidgetsForController(controller: string): GwDomNodeList {
    const possibleScreen = this.getScreenElWithEditControllerId(controller);
    if (possibleScreen && !possibleScreen.hasAttribute(this.EDIT_CONTROLLER_NO_TRACK_ATTR)) {
      return gwUtil.getDomNodes(".gw-editable", possibleScreen);
    }

    return [];
  }

  /**
   * This is called whenever the server sends us an updated list of edit controllers
   * But we could have an edit controller present without the screen widget in the DOM
   * So we check if the screen widget is present, and then remove it from the map if it is
   */
  private handleNewEditableControllers(): GwSet {
    const previousControllerIds = this.getCurrentEditableControllers();
    const newControllerIds = new GwSet(gwUtil.getUtilityInfo("gw-editableControllers").split(","));

    newControllerIds.forEach((controllerId) => {
      if (!previousControllerIds.has(controllerId)) {
        this.addNewController(controllerId);
      }
    });

    this.setCurrentEditableControllers(newControllerIds);
    return newControllerIds;
  }

  private addNewController(controllerId: string): void {
    const editableValueWidgets = this.getEditableValueWidgetsForController(controllerId);
    const nameToServerValueMap: GwMap = {};
    gwUtil.forEachReverse(editableValueWidgets, (el: GwValueWidgetElement) => {
      nameToServerValueMap[this.getValueId(el)] = this.getOriginalServerValue(el);
    });
    gwStorage.set(this.FORM_EDIT_VALUES_BY_ID_KEY + "." + controllerId, nameToServerValueMap);
  }

  private getScreenElWithEditControllerId(editId: string): HTMLDivElement | null {
    return gwUtil.getDomNodeByAttr(this.EDIT_CONTROLLER_DATA_ATTR, editId) as HTMLDivElement;
  }

  private updateDirtyStatusOfInputs(editableControllerIds: GwSet): void {
    const mapOfEditControllersToFieldIdAndValue = gwStorage.get(this.FORM_EDIT_VALUES_BY_ID_KEY);

    let editControllerWasRemoved = false;
    let newWidgetWasAdded = false;
    const updatedMapOfEditControllersToFieldIdAndValue: GwTypedMap<GwMap> = {};

    gwUtil.forEach(mapOfEditControllersToFieldIdAndValue, (mapOfEditableValueWidgets, editControllerId) => {
      if (editableControllerIds.has(editControllerId)) {
        const currentEditableValueWidgets = this.getEditableValueWidgetsForController(editControllerId);
        const updatedMapOfEditableValueWidgets: GwMap = gwUtil.mapMerge({}, mapOfEditableValueWidgets);
        updatedMapOfEditControllersToFieldIdAndValue[editControllerId] = updatedMapOfEditableValueWidgets;

        gwUtil.forEach(currentEditableValueWidgets, (editableValueWidget) => {
          if (editableValueWidget.id) {
            const valueWidgetValueId = this.getValueId(editableValueWidget);
            if (Object.prototype.hasOwnProperty.call(mapOfEditableValueWidgets, valueWidgetValueId)) {
              const originalServerValue = mapOfEditableValueWidgets[valueWidgetValueId];
              this.updateChangedBasedOnOriginalServerValue(editableValueWidget, originalServerValue);
            } else {
              const originalServerValue = this.getOriginalServerValue(editableValueWidget);
              newWidgetWasAdded = true;
              updatedMapOfEditableValueWidgets[valueWidgetValueId] = originalServerValue;
              if (this.isFromAddedEntry(originalServerValue)) {
                this.updateChangedBasedOnOriginalServerValue(editableValueWidget, originalServerValue);
              }
            }
          }
        });
      } else {
        // If the current storage map has controllers that the current list doesn't have
        // Then we just bail without adding the controller to the final storage map, effectively deleting them
        editControllerWasRemoved = true;
      }
    });

    if (editControllerWasRemoved || newWidgetWasAdded) {
      gwStorage.set(this.FORM_EDIT_VALUES_BY_ID_KEY, updatedMapOfEditControllersToFieldIdAndValue);
    }
  }

  /**
   * @public
   * Called by the onChange and onInput event listener in events.js;
   * @param el
   */
  inputElementChanged(el: GwInputElement | GwValueWidgetElement): void {
    this.isInputDirty(el);
  }

  private getCurrentEditableControllers(): GwSet {
    const idArray = gwStorage.get(this.CURRENT_EDIT_CONTROLLERS_KEY) || [];
    return new GwSet(idArray as string[]);
  }

  private setCurrentEditableControllers(ids: GwSet): void {
    gwStorage.set(this.CURRENT_EDIT_CONTROLLERS_KEY, ids.toArray());
  }

  private getOriginalServerValue(el: GwValueWidgetElement): GwInputValue {
    const isAddedEntry = gwUtil.getSelfOrFirstParentWithAttr(el, "data-gw-added-entry");
    return isAddedEntry ? this.ADDED_ENTRY_VALUE : gwInputs.getValueById(el);
  }

  private isFromAddedEntry(serverVal: GwInputValue): boolean {
    return serverVal === this.ADDED_ENTRY_VALUE;
  }

  /**
   * Normally we just use the fully qualified id of an element as a key. But in the case of an
   * editable iterator the ids of items inside entries depend on the entry index. So, for example,
   * if we noticed that a value in row 2 of an LV had changed we might store a value under the id
   * SomeLV-1-SomeCell (row 2 has index 1). But if we then deleted row 1 then what was row
   * 2 would become row 0, and our SomeLV-1-SomeCell id would now refer to some other value.
   * We can't change the way we generate entry ids because a lot of other code (and tests) rely
   * on the existing approach.
   *
   * To solve this problem the server side adds a "data-gw-entry-value-ids" attribute to top level
   * elements in editable entries. This attribute contains a comma separated list of integer ids
   * that correspond to the values in the entry (for nested iterators a single element may
   * correspond to more than one value). These ids remain stable as the entry indexes change. This
   * getValueId method builds a unique id based on these values by concatenating all the enclosing
   * value ids, separated by commas, and then appending the usual render id but with all "index ids"
   * replaced by zero. So, for example, our example SomeLV-1-SomeCell might become 3,SomeLV-0-SomeCell,
   * where 3 is the value id of the value in that row of the LV. This id will still be unique but
   * because it uses value ids rather than index ids it will remain stable if iterator entries move
   * around.
   *
   * The same mechanism is used to handle a couple of other cases where ids might not be sufficiently
   * unique/stable - the "value ids" of the current card and the current list view selection are
   * added in to card view panels, so all values within the panel will be scoped by those value ids.
   *
   * @param {GwValueWidgetElement} el a value widget
   * @returns {string} a stable id for referring to the value widget
   */
  private getValueId(el: GwValueWidgetElement): string {
    const valueIdsAttr = "data-gw-entry-value-ids";
    let enclosingEntry = gwUtil.getSelfOrFirstParentWithAttr(el, valueIdsAttr);
    if (!enclosingEntry) {
      return el.id;
    }
    let valuePrefix = enclosingEntry.getAttribute(valueIdsAttr);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      enclosingEntry = gwUtil.getSelfOrFirstParentWithAttr(enclosingEntry.parentElement as GwDomNode, valueIdsAttr);
      if (enclosingEntry === null) {
        break;
      }
      valuePrefix = enclosingEntry.getAttribute(valueIdsAttr) + "," + valuePrefix;
    }
    return valuePrefix + "," + el.id.replace(/-\d+/g, "-0");
  }
}

export const gwForm = new GwForm();
