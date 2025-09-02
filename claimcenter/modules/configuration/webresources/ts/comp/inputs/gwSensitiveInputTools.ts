import {gwUtil} from "../../core/util/gwUtil";
import {GwDomNode, GwMap} from "../../types/gwTypes";
import {gwFocus} from "../../core/gwFocus";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwSensitiveInputTools {
  readonly hiddenClass: string = "gw-hidden";

  clearValue (triggerNode: GwDomNode, dropMenuClass: string, valueFieldClass: string, args: GwMap): void {
    const widgetNode = gwUtil.getDomNode("#" + args.id);
    if (!widgetNode) {
      return;
    }
    const $widgetElement = $(widgetNode);

    const $menuElement = $widgetElement.find(dropMenuClass);
    $menuElement.addClass(this.hiddenClass);

    const $inputElement = $widgetElement.find(valueFieldClass);
    $inputElement.removeAttr("disabled");
    $inputElement.val("");
    gwFocus.forceFocus($inputElement[0], false);
  }

  setValueProgammatically (widgetNode: GwDomNode, dropMenuClass: string, valueFieldClass: string, value: string): boolean {
    if (!widgetNode) {
      return false;
    }
    const $widgetElement = $(widgetNode);
    const $menuElement = $widgetElement.find(dropMenuClass);
    if (!$menuElement) {
      return false;
    }
    $menuElement.removeClass(this.hiddenClass);
    const $inputElement = $widgetElement.find(valueFieldClass);
    if (!$inputElement) {
      return false;
    }
    $inputElement.val(value);
    $inputElement.prop("disabled", true);
    return true;
  }
}

export const gwSensitiveInputTools = new GwSensitiveInputTools();