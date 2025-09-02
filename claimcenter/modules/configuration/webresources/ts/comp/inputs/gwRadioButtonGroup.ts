import {GwDomNode,
  GwEventType,
  GwKeyboardNavigation,
  GwMap,
  GwPartialReloadDetails,
  GwTypedMap
} from "../../types/gwTypes";
import {gwUtil} from "../../core/util/gwUtil";
import {gwEvents} from "../../core/events/gwEvents";
import {gwConfirm} from "../../core/gwConfirm";
import {gwForm} from "../../core/gwForm";
import {gwAria} from "../../core/aria/GwAria";
import {GwInitializableSystem} from "../../core/util/GwInitializableSystem";
import {gwNavigation} from "../../core/gwNavigation";
import {gwFocus} from "../../core/gwFocus";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * Radio button groups are usually created by RadioButtonCells. RadioButtonCell is a special control that is used
 * to put a group of radio buttons in different cells of a list view - they can be placed on different rows or even
 * in different columns. The cells are grouped by the radioButtonGroup attribute - a unique name used for all the
 * radio buttons in the group, so that selecting one of the buttons automatically deselects all the others.
 *
 * Unfortunately the straightforward implementation - using an actual input of type="radio" for the radio buttons -
 * breaks keyboard navigation, because when you navigate to a set of radio buttons the browser will force focus to
 * the currently selected button. This feels really weird when the buttons are scattered across an entire LV. So we
 * actually represent a "radio button group" as a group of check box inputs, all with the same name. This gives us
 * predictable keyboard navigation but means we have to do extra event processing to get radio like behavior - for
 * example we have to clear all the other "radio buttons" when a particular member of the group is selected. We also
 * use styling magic to make the actual check boxes invisible, then add divs that are styled to look like radio
 * buttons so the UI looks right.
 *
 * Radio button groups are used in one other place other than RadioButtonCell - the radio buttons on Choice widgets.
 * These are used to select a particular set of inputs - each choice has a radio button and a set of inputs, clicking
 * on the radio button makes the set of inputs active. These choice radio buttons use the same grouping mechanism, and
 * are always post on change so they make a server round trip every time one of the radio buttons is selected.
 */
export class GwRadioButtonGroup extends GwInitializableSystem implements GwKeyboardNavigation {

  private radioButtonGroups: GwTypedMap<GwDomNode[]> | null = null;

  /**
   * With a partial reload, we may be able to optimize by adding or removing only the changed radio buttons.
   * Maybe TODO: Optimize
   * @param isFullPageReload
   * @param partialReloadDetails
   */
  init (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    if (isFullPageReload) {
      gwNavigation.registerNavClasses(["gw-radio-button"], gwRadioButtonGroup);
    }

    this.radioButtonGroups = this.collectRadioButtonGroups();
    this.setAriaProperties(this.radioButtonGroups);
  }

  getSystemName (): string {
    return "gwRadioButtonGroup";
  }

  /**
   * Called when a button in the group is clicked (or if it has focus and the user hits space or return). The visible
   * button is actually a styled div, without any special behavior, so this method updates the hidden check box input
   * and artificially fires a change event to trigger the usual change handling (e.g. confirmation).
   *
   * @param radioButtonDiv the div immediately preceding the "radio button" (hidden check box); this is the div that
   *   is styled to look like a radio button
   */
  radioButtonSelect (radioButtonDiv: GwDomNode): void {
    if (gwUtil.isDisabled(radioButtonDiv)) {
      return;
    }

    // Check if it's already checked.  If so, just kick out - i.e. no-op
    if (gwUtil.hasClass(radioButtonDiv, "gw-checked")) {
      return;
    }

    const radioButtonInput: HTMLInputElement = gwUtil.getDomNodeByName(radioButtonDiv.dataset.gwGroup!, radioButtonDiv.parentElement as HTMLDivElement) as HTMLInputElement;
    if (radioButtonInput.disabled) {
      return;
    }

    radioButtonInput.checked = true;
    gwEvents.forceGlobalChangeEvent(radioButtonInput);
  }

  /**
   * Called once a change has been confirmed or canceled. If the change was confirmed, updates the "checked" value
   * for all of the "radio buttons" (actually check boxes) in the group, updates the styling on the corresponding
   * divs and calls the server if the button is post on change. If the change was canceled then there is nothing to
   * do; the confirmation code will already have reverted the checked value on the check box so all the check boxes
   * and their corresponding divs will be in the correct state.
   *
   * @param radioButtonWidget the outer div of the value widget enclosing the "radio button" (check box)
   */
  updateRadioGroup (radioButtonWidget: GwDomNode, args: GwMap): void {
    const originatingRadioDiv = gwUtil.getDomNodeOrThrow("#" + radioButtonWidget.id + "_radio");
    const groupName = originatingRadioDiv.getAttribute("data-gw-radio-group");
    if (!groupName) {
      return;
    }

    const radioButtonsInGroup = gwUtil.getDomNodesByAttr("data-gw-radio-group", groupName);

    const confirmSpecified = this.isConfirmSpecified(radioButtonWidget);
    const originatingRadioButtonInput = gwUtil.getDomNodeByName(groupName, originatingRadioDiv.parentElement!) as HTMLInputElement;
    if (confirmSpecified && originatingRadioButtonInput && !originatingRadioButtonInput.checked) {
      // Only happens if confirmation failed; the confirm code already set the checked value back to false and we
      // never got as far as updating anything else in the group so we just bail
      return;
    }

    if (radioButtonsInGroup.length > 0) {
      // The originating input's checked value will have been set to true by radioButtonSelect. But we still need
      // to update the gw-checked style for the originating div, and ensure all the other divs and inputs are cleared
      gwUtil.forEach(radioButtonsInGroup, (radioButtonDiv) => {
        const radioButtonInput = gwUtil.getDomNodeByName(groupName, radioButtonDiv.parentElement) as HTMLInputElement;
        if (!radioButtonInput) {
          return;
        }
        if (radioButtonDiv === originatingRadioDiv) {
          gwUtil.addClass(radioButtonDiv, "gw-checked");
          radioButtonDiv.setAttribute("aria-checked", "true");
          // The value was changed in radioButtonSelect.  However, the class was not added then as a
          // confirmation cancel will not know to remove it.  If we've made it updateRadioGroup, we know
          // the value has passed confirmation and the value has already been set; add the class here.
        } else {
          gwUtil.removeClass(radioButtonDiv, "gw-checked");
          radioButtonDiv.setAttribute("aria-checked", "false");
          radioButtonInput.checked = false;
          if (confirmSpecified) {
            // The logical radio button that triggered the change will already have had it's confirmation value
            // saved.  Need to explicitly save the value for the other inputs in the group (if confirm is
            // actually specified)
            gwConfirm.saveConfirmedValue(gwForm.findEnclosingValueWidget(radioButtonInput)!);
          }
        }
      });
    }
    if (args && args.onChangeMethod) {
      gwEvents.handleOnChangeMethod(args.onChangeMethod, radioButtonWidget, {id: radioButtonWidget.id});
    }
  }

  collectRadioButtonGroups (): GwTypedMap<GwDomNode[]> {
    const buttonGroups: GwTypedMap<GwDomNode[]> = {};
    const nodes = document.querySelectorAll("[data-gw-radio-group]");
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node) {
        continue;
      }

      this.addRadioButtonToButtonGroups(node as GwDomNode, buttonGroups);
    }
    return buttonGroups;
  }

  addRadioButtonToButtonGroups (node: GwDomNode, buttonGroups: GwTypedMap<GwDomNode[]>): void {
    const groupName = this.getRadioGroupName(node);
    if (groupName == null) {
      return;
    }
    if (!(groupName in buttonGroups)) {
      buttonGroups[groupName] = [];
    }
    const buttonGroup = buttonGroups[groupName];
    buttonGroup.push(node);
  }

  private getRadioGroupName (node: GwDomNode): string | null {
    return node.getAttribute("data-gw-radio-group");
  }

  setAriaProperties (buttonGroups: GwTypedMap<GwDomNode[]>): void {
    Object.keys(buttonGroups).forEach((groupName) => {
      const buttonGroup: GwDomNode[] = buttonGroups[groupName];
      const setsize = buttonGroup.length;
      for (let i = 0; i < setsize; i++) {
        const button = buttonGroup[i];
        gwAria.setAriaPropertyForElement("setsize", setsize, button);
        gwAria.setAriaPropertyForElement("posinset", i + 1, button); // 1-indexed posinset
      }
    });
  }

  private isConfirmSpecified (radioButtonWidget: GwDomNode): boolean {
    return !!gwUtil.getSelfOrFirstParentWithAttr(radioButtonWidget, "data-gw-confirm");
  }

  selectAdjacentRadioButton(node: GwDomNode, info: GwMap, event: GwEventType, direction: "previous" | "next"): boolean {
    if (this.radioButtonGroups == null) {
      return false;
    }
    const groupName = this.getRadioGroupName(node);
    if (groupName == null) {
      return false;
    }

    const buttonGroup: GwDomNode[] = this.radioButtonGroups[groupName];
    if (!buttonGroup) {
      return false;
    }

    const buttonPosInSet = buttonGroup.findIndex((button) => button.id === node.id);

    let adjacentButton;
    if (direction === "next") {
      // next button - forwards
      adjacentButton = buttonGroup[this.mod((buttonPosInSet + 1), buttonGroup.length)];
    } else {
      // prev button - backwards
      adjacentButton = buttonGroup[this.mod((buttonPosInSet - 1), buttonGroup.length)];
    }

    gwFocus.forceFocus(adjacentButton);
    this.radioButtonSelect(adjacentButton);

    return true;
  }

  up(node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    return this.selectAdjacentRadioButton(node, info, event, "previous");
  }

  down(node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    return this.selectAdjacentRadioButton(node, info, event, "next");
  }

  left(node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    return this.selectAdjacentRadioButton(node, info, event, "previous");
  }

  right(node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    return this.selectAdjacentRadioButton(node, info, event, "next");
  }

  /**
   * Modular arithmetic mod, i.e., mod(-2, 5) == 3
   * @param n
   * @param m modulus
   */
  mod(n: number, m: number): number {
    return ((n % m) + m) % m;
  }

}

export const gwRadioButtonGroup = new GwRadioButtonGroup();
