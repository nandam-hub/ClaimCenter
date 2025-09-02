import {GwTypedMap, HTMLCheckboxElement} from "../../types/gwTypes";
import { gwUtil } from "../util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwFlagGroup {
  readonly checkBoxes: HTMLCheckboxElement[];
  readonly buttons: HTMLElement[];
  headerCheckBox: HTMLCheckboxElement | null = null;

  constructor(iteratorId: string | undefined) {
    this.checkBoxes = [];
    this.buttons = [];

    if (iteratorId === undefined) {
      throw new Error("checkbox flag group missing an iterator id");
    }

    $("[data-gw-flags-scope='" + iteratorId + "']").each((index, element) => {
      if (element.dataset.gwFlagsConditions !== undefined) {
        this.buttons.push(element);
      } else if (element.dataset.gwFlagsForEntry !== undefined) {
        this.checkBoxes.push(element as HTMLCheckboxElement);
      } else {
        this.headerCheckBox = element as HTMLCheckboxElement;
      }
    });
  }

  updateButtonsAvailability(): void {
    this.buttons.forEach((button) => this.updateButtonAvailability(button));
  }

  updateButtonAvailability(button: HTMLElement): void {
    const conditions = button.dataset.gwFlagsConditions!.split(",");
    let disabled = false;
    conditions.forEach((condition) => {
      if (!this.evaluateCondition(button, condition.trim())) {
        disabled = true;
      }
    });

    // Changed disabled on button (for mouseover) plus the inner and expand divs
    gwUtil.conditionalAddRemoveAttr(disabled, button, "aria-disabled", "true");
    gwUtil.forEach($(button).find("> .gw-action--inner, > .gw-action--expand-button"), (clickable) => {
      gwUtil.conditionalAddRemoveAttr(disabled, clickable, "aria-disabled", "true");
    });
  }

  evaluateCondition(button: HTMLElement, condition: string): boolean {
    const parts = condition.split(" ").map((part) => {
      return part.trim();
    });
    if (parts.length !== 2) {
      return true;
    }

    const method = parts[0];
    if (typeof this.operations[method] !== "function") {
      throw new Error("received unknown method for Flag Group: " + method);
    }

    return this.operations[method].call(this, button, parts[1]); //TODO: not in love with having to call this. Could move the methods onto the instance to be cleaner
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  operations: GwTypedMap<Function> = {
    one(button: HTMLElement, flagName: string): boolean {
      return this.countTargetedCheckedCheckBoxesWithFlag(button, flagName) === 1 && this.targetedCheckedCheckBoxes(button).length === 1;
    },

    two(button: HTMLElement, flagName: string): boolean {
      return this.countTargetedCheckedCheckBoxesWithFlag(button, flagName) === 2 && this.targetedCheckedCheckBoxes(button).length === 2;
    },

    any(button: HTMLElement, flagName: string): boolean {
      return this.countTargetedCheckedCheckBoxesWithFlag(button, flagName) > 0;
    },

    no(button: HTMLElement, flagName: string): boolean {
      return this.countTargetedCheckedCheckBoxesWithFlag(button, flagName) === 0;
    },

    all(button: HTMLElement, flagName: string): boolean {
      const checkedWithFlag = this.countTargetedCheckedCheckBoxesWithFlag(button, flagName);
      return checkedWithFlag > 0 && checkedWithFlag === this.targetedCheckedCheckBoxes(button).length;
    },

    exists(button: HTMLElement, flagName: string): boolean {
      return (
        this.targetedCheckBoxes(button).filter((checkBox: HTMLInputElement) => {
          return this.checkBoxHasFlag(checkBox, flagName);
        }).length > 0
      );
    },
  };

  countTargetedCheckedCheckBoxesWithFlag(button: HTMLElement, flagName: string): number {
    return this.targetedCheckedCheckBoxes(button).reduce((acc, checkBox) => {
      const found = flagName === "*" || this.checkBoxHasFlag(checkBox, flagName);
      return found ? acc + 1 : acc;
    }, 0);
  }

  checkBoxHasFlag(checkBox: HTMLInputElement, flagName: string): boolean {
    return checkBox.dataset.gwFlagsForEntry!.split(",").indexOf(flagName) >= 0;
  }

  targetedCheckedCheckBoxes(button: HTMLElement): HTMLInputElement[] {
    return this.targetedCheckBoxes(button).filter((c) => {
      return c.checked;
    });
  }

  targetedCheckBoxes(button: HTMLElement): HTMLInputElement[] {
    return this.checkBoxes.filter((c) => {
      return this.targetListStartsWith(c.dataset.gwFlagsTarget!, button.dataset.gwFlagsTarget!);
    });
  }

  targetListStartsWith(targetList: string, targetSubList: string): boolean {
    return (
      targetList.indexOf(targetSubList) === 0 && (targetSubList.length === targetList.length || targetList[targetSubList.length] === ",")
    );
  }
}
