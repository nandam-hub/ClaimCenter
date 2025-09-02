import {
  GwValueWidgetElement
} from "../types/gwTypes";
import {GwEventDescription} from "./events/GwEventDescription";
import {gwUtil} from "./util/gwUtil";
import {gwInputs, GwInputValue} from "./inputs/gwInputs";
import {GwRegisteredSystem} from "./util/GwRegisteredSystem";
import {gwForm} from "./gwForm";
import {gwTooltips} from "./gwTooltips";
import {gwInputSystems} from "./inputs/gwInputSystems";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwConfirm extends GwRegisteredSystem {

  private _lastEventWasConfirmed: boolean = false;

  getSystemName (): string {
    return "gwConfirm";
  }

  /**
   * Save the current value of an input after a user has confirmed they want the change. Only
   * called for nodes that require confirmation before a value change. Does nothing if
   * node is not an input.
   * Assumption: we don't support multiselect select controls
   */
  saveConfirmedValue (el: GwValueWidgetElement): void {
    el.setAttribute("data-gw-confirmed-value", JSON.stringify(gwInputs.getValueById(el)));
  }

  /**
   * True if the last event we processed caused a confirmation dialog to be shown and the user
   * then decided the event should go ahead. Used to prevent further alerts/confirmations from
   * happening as a result of the event.
   */
  lastEventWasConfirmed (): boolean {
    return this._lastEventWasConfirmed;
  }

  private cancelValueChange (el: GwValueWidgetElement): void {
    const prevValue = this.getConfirmDataValueOrDefault(el);
    gwInputs.setValueById(el, prevValue, true);
  }

  private getConfirmDataValueOrDefault (el: GwValueWidgetElement): GwInputValue {
    const jsonValue = el.getAttribute("data-gw-confirmed-value");
    return (jsonValue && jsonValue.length > 0) ? JSON.parse(jsonValue) : gwForm.getValueWidgetOriginalServerValue(el);
  }

  /**
   * @private
   * Based on the inputType of {@param node}, check to see if the current value
   * differs from the default value.
   *
   * @param node node for which current and default values will be compared
   * @returns {boolean} return true if the current value differs from the default value
   *     else returns false
   */
  private valueDiffersFromLastChangedOrDefault (el: GwValueWidgetElement): boolean {
    const prevVal = this.getConfirmDataValueOrDefault(el);
    const currVal = gwInputs.getValueById(el.id);

    return !gwUtil.shallowCompare(prevVal, currVal);
  }

  /**
   * @public
   * Check if executing the given event needs user confirmation. If so display a confirmation dialog
   * to the user, giving them a chance to cancel it. The event description is the result of calling
   * getEventDescription and contains details of the target node, event type and the method to be
   * executed plus its arguments.
   *
   * @return {boolean} true if the event should proceed, false if it has been cancelled by the user
   */
  confirmEvent (eventDescription: GwEventDescription): boolean {
    // Assume no successful confirmation
    this._lastEventWasConfirmed = false;

    const valueWidget = eventDescription.eventTargetNode;
    if (!valueWidget) {
      return true;
    }

    if (!valueWidget.hasAttribute("data-gw-confirm")) {
      return true;
    }

    // If this is a click event, then it's an action widget we need to confirm
    if (eventDescription.eventType === "click" || eventDescription.replacesClick) {
      this.closeProblematicTemporyElementsDuringConfirmAndPrompt();
      const clickConfirmationResult = !!window.confirm(valueWidget.dataset.gwConfirm);
      this._lastEventWasConfirmed = clickConfirmationResult;
      if (!clickConfirmationResult) {
        return false;
      }
    } else if (eventDescription.eventType === "change" && this.valueDiffersFromLastChangedOrDefault(valueWidget)) {
      this.closeProblematicTemporyElementsDuringConfirmAndPrompt();
        const changeConfirmationResult = !!window.confirm(valueWidget.dataset.gwConfirm);
        this._lastEventWasConfirmed = changeConfirmationResult;
        if (changeConfirmationResult) {
          this.saveConfirmedValue(valueWidget);
        } else {
          this.cancelValueChange(valueWidget);
          return false;
        }
    }

    return true;
  }

  closeProblematicTemporyElementsDuringConfirmAndPrompt (): void {
    gwInputSystems.closeOpenInputs();
    gwTooltips.hide();
  }

}

export const gwConfirm = new GwConfirm();
