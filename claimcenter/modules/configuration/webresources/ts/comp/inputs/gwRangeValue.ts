import {GwRegisteredSystem} from "../../core/util/GwRegisteredSystem";
import {GwClassIdTagOrNode, GwDomNode, GwMap} from "../../types/gwTypes";
import {gwUtil} from "../../core/util/gwUtil";
import {GwShuttleBoxInfo} from "./GwShuttleBoxInfo";
import {gwInputs} from "../../core/inputs/gwInputs";
import {gwNavigation} from "../../core/gwNavigation";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */

export class GwRangeValue extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwRangeValue";
  }

  private getShuttleBoxInputs (classIdTagOrNode: GwClassIdTagOrNode): GwShuttleBoxInfo {
    const parent = gwUtil.getSelfOrFirstParentWithClass(gwUtil.getDomNode(classIdTagOrNode), "gw-RangeShuttleValueWidget");
    if (!parent) {
      throw new Error("cannot find parent for range shuttle widget");
    }

    return new GwShuttleBoxInfo(parent);
  }

  setOptions (widget: GwDomNode, options: GwMap[]): void {
    const select = widget.querySelector("select");
    if (!select) {
      throw new Error("Attempting to set options on a select widget without a select element");
    }

    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }

    let currentGroup: HTMLOptGroupElement | null = null;
    for (const option of options) {
      const htmlOption = document.createElement("option");
      htmlOption.value = option.key;
      htmlOption.innerText = option.label;

      if (option.groupLabel) {
        if (currentGroup == null || currentGroup.label !== option.groupLabel) {
          currentGroup = document.createElement("optgroup");
          currentGroup.label = option.groupLabel;
          select.appendChild(currentGroup);
        }
        currentGroup.appendChild(htmlOption);
      } else {
        currentGroup = null;
        select.appendChild(htmlOption);
      }
    }
  }

  isMultiple (classIdTagOrNode: GwClassIdTagOrNode): boolean {
    const select = gwUtil.getDomNode(classIdTagOrNode);
    if (select) {
      return select.hasAttribute("multiple");
    }
    return false;
  }

  // TODO: currently a similar check is done in the renderer, but that check is not based on if anything is actually highlighted
  // the real UX for this would be to only highlight the button if something was highlighted in the relevant list
  private updateButtons (shuttleBoxInfo: GwShuttleBoxInfo): void {
    const parent = shuttleBoxInfo.parent;
    const leftButton = gwUtil.getDomNodeOrThrow(".gw-shuttle-left-button", parent);
    const rightButton = gwUtil.getDomNodeOrThrow(".gw-shuttle-right-button", parent);

    const leftSelectHasOptions = shuttleBoxInfo.left.getElementsByTagName("option").length > 0;
    const rightSelectHasOptions = shuttleBoxInfo.right.getElementsByTagName("option").length > 0;

    gwUtil.conditionalAddRemoveAttr(!leftSelectHasOptions, rightButton, "aria-disabled", "true");
    gwUtil.conditionalAddRemoveAttr(!rightSelectHasOptions, leftButton, "aria-disabled", "true");

    if (leftSelectHasOptions) {
      shuttleBoxInfo.left.removeAttribute("disabled");
    }

    if (rightSelectHasOptions) {
      shuttleBoxInfo.right.removeAttribute("disabled");
    }
  }

  private clearInternalShuttleSelect (shuttleSelect: HTMLSelectElement): void {
    for (let i = shuttleSelect.children.length - 1; i >= 0; i--) {
      const option = shuttleSelect.children[i] as HTMLOptionElement;
      shuttleSelect.removeChild(option);
    }
  }

  /**
   * Returns an object that contains the values that were added or removed along with the overall set of selected values
   * after the adds/removes are made.
   * @param {GwShuttleBoxInfo} shuttleBoxInfo
   * @param {"add" | "remove"} shuttleDirection
   * @returns {selectedValues: string[], newValues: string[]} values that were moved and the resultant array of
   *     selected values for the shuttle widget
   */
  private buildUpdatedValuesForShuttleWidget (shuttleBoxInfo: GwShuttleBoxInfo, shuttleDirection: "add" | "remove"):
    { selectedValues: string[], newValues: string[] } {
    // Left shuttle list contains unselected range value options
    // Right shuttle list contains currently selected range value options
    const activeShuttleList =
        shuttleDirection === "add" ? shuttleBoxInfo.left : shuttleBoxInfo.right;
    const selectedValues: string[] = [];

    // Squirrel away the selected values of the active shuttle list
    for (let i = 0; i < activeShuttleList.children.length; i++) {
      const option = activeShuttleList.children[i] as HTMLOptionElement;
      if (option.selected) {
        selectedValues.push(option.value);
      }
    }

    // Start with the current value of the internal select list used to store the
    // current value of the range value shuttle widget
    let newValues = gwInputs.getValueById(shuttleBoxInfo.hidden.name) as string[];

    if (shuttleDirection === "add") {
      // Add on selected values
      newValues = newValues.concat(selectedValues);
    } else { // remove
      // Include only the non selected values
      newValues = newValues.filter((val: string) => { return selectedValues.indexOf(val) === -1; });
    }

    return { selectedValues: selectedValues , newValues: newValues };
  }

  private moveOptionsAcrossShuttle (buttonEl: GwDomNode, shuttleDirection: "add" | "remove"): void {
    const shuttleSelect = this.getShuttleBoxInputs(buttonEl);

    const updatedValuesInfo = this.buildUpdatedValuesForShuttleWidget(shuttleSelect, shuttleDirection);
    gwInputs.setValuesOnMultiSelect(shuttleSelect.hidden, updatedValuesInfo.newValues, true,
        () => {gwRangeValue.updateAvailableAndSelectedShuttleLists(shuttleSelect.hidden); });

    // Marked the just-moved options as selected
    const targetShuttleSelect =
        shuttleDirection === "add" ? shuttleSelect.right : shuttleSelect.left;
    for (let i = 0; i < targetShuttleSelect.children.length; i++) {
      const option = targetShuttleSelect.children[i] as HTMLOptionElement;
      if (option && updatedValuesInfo.selectedValues.indexOf(option.value) > -1) {
        option.selected = true;
      }
    }

    gwNavigation.setFocusToClosestFocusableSelfOrParent(targetShuttleSelect);
  }

  updateAvailableAndSelectedShuttleLists (el: HTMLSelectElement): void {
    const shuttleSelect = this.getShuttleBoxInputs("#" + el.name);

    this.clearInternalShuttleSelect(shuttleSelect.right);
    this.clearInternalShuttleSelect(shuttleSelect.left);

    for (let i = 0; i < shuttleSelect.hidden.children.length; i++) {
      const option = shuttleSelect.hidden.children[i] as HTMLOptionElement;
      const newOption = option.cloneNode(true) as HTMLOptionElement;
      newOption.selected = false;
      if (option.selected) {
        shuttleSelect.right.appendChild(newOption);
      } else {
        shuttleSelect.left.appendChild(newOption);
      }
    }
    this.updateButtons(shuttleSelect);
  }

  moveRight (buttonEl: GwDomNode): void {
    this.moveOptionsAcrossShuttle(buttonEl, "add");
  }

  moveLeft (buttonEl: GwDomNode): void {
    this.moveOptionsAcrossShuttle(buttonEl, "remove");
  }

}

export const gwRangeValue = new GwRangeValue();
