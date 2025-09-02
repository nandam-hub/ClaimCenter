import {GwDomNode, GwMap, HTMLCheckboxElement} from "../../types/gwTypes";
import {GwFlagGroup} from "./GwFlagGroup";
import {GwInitializableSystem} from "../util/GwInitializableSystem";
import {gwInputs} from "./gwInputs";
import {gwCheckboxDiv} from "../../comp/inputs/gwCheckboxDiv";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwFlags extends GwInitializableSystem {
  getSystemName (): string {
    return "gwFlags";
  }

  private checkAvailabilityOfAllButtons (): void {
    const alreadySeen: GwMap = {};

    $("[data-gw-flags-scope]").each((index, element) => {
      const scope = element.dataset.gwFlagsScope!;
      if (alreadySeen[scope] === undefined) {
        new GwFlagGroup(element.dataset.gwFlagsScope).updateButtonsAvailability();
        alreadySeen[scope] = true;
      }
    });
  }

  headerCheckBoxChanged (node: GwDomNode): void {
    const checkbox = this.getCheckBox(node);
    const group = new GwFlagGroup(checkbox.dataset.gwFlagsScope);
    const checked = checkbox.checked;
    group.checkBoxes.forEach((c) => {
      c.checked = checked;
      gwCheckboxDiv.syncCheckboxDivToCheckboxInput(c);
    });
    group.updateButtonsAvailability();
  }

  checkBoxChanged (node: GwDomNode): void {
    const checkbox = this.getCheckBox(node);
    const group = new GwFlagGroup(checkbox.dataset.gwFlagsScope);
    group.updateButtonsAvailability();
  }

  init (): void {
    this.checkAvailabilityOfAllButtons();
  }

  getCheckBox (node: GwDomNode): HTMLCheckboxElement {
    if (node instanceof HTMLInputElement && gwInputs.isCheckbox(node)) {
      return node;
    } else {
      return node.querySelector("input") as HTMLCheckboxElement;
    }
  }

}

export const gwFlags = new GwFlags();
