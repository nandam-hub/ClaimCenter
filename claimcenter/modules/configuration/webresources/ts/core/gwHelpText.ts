import {GwDomNode, GwInputElement} from "../types/gwTypes";
import {gwUtil} from "./util/gwUtil";
import {gwTooltips} from "./gwTooltips";
import {gwInputSystems} from "./inputs/gwInputSystems";
import {gwPrefPanel} from "./gwPrefPanel";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * - Helptext can only appear on an input widget in edit mode.
 * - Helptext always appears when focusing on the input.
 * - But there is a global config option on the server that allows it to also appear as a tooltip on mouseover.
 * If this is enabled, then the helptext appears as the data-gw-tooltip attribute,
 * but the tooltip is removed temporarily when the element is focused, so that you don't have the text up in 2 places.
 */
export class GwHelpText {
  readonly HELP_TEXT_EL_ID: string = "gw-helptext";
  private readonly HELP_TEXT_OPEN: string = "gw-helptextOpen";
  private readonly DATA_HELPTEXT: string = "data-gw-helptext";
  private readonly DATA_HIDDEN_TOOLTIP: string = "data-gw-hidden-tooltip";

  focusIn (input: HTMLInputElement): void {
    this.enableHelptextOnInputIfAvailable(input);
  }

  focusOut (): void {
    this.disableHelpText();
  }

  closeHelpText (): void {
    this.disableHelpText();
  }

  getHelptextEl (): HTMLDivElement | null {
    return document.getElementById(this.HELP_TEXT_EL_ID) as HTMLDivElement || null;
  }

  /**
   *
   * @param {GwDomNode | null} valueWidget
   * @param {GwInputElement} input
   * @returns {boolean} - did the reposition
   */
  possiblyForceHelptextVAlign (valueWidget: GwDomNode | null, input: GwInputElement): boolean {
    valueWidget = valueWidget || gwUtil.getSelfOrFirstParentWithClass(input, "gw-ValueWidget");
    if (valueWidget && gwUtil.hasClass(valueWidget, "gw-helptextOpen")) {
      const helpTextEl = gwHelpText.getHelptextEl();
      if (helpTextEl) {
        if (valueWidget.hasAttribute("data-gw-date-picker-v-pos")) {
          gwInputSystems.forcePickerIntoVerticalAlignment(valueWidget, input, helpTextEl, valueWidget.getAttribute("data-gw-date-picker-v-pos") === "below");
          return true;
        } else if (valueWidget.hasAttribute("data-gw-autocomplete-v-pos")) {
          gwInputSystems.forcePickerIntoVerticalAlignment(valueWidget, input, helpTextEl, valueWidget.getAttribute("data-gw-autocomplete-v-pos") === "below");
          return true;
        }
      }
    }
    return false;
  }

  private enableHelptextOnInputIfAvailable (input: GwInputElement): void {
    this.disableHelpText();
    // If the accessibility setting tabIndexedTooltips is set, show helptext for all tooltip-containing elements
    // Alternatively, go up until we find a value widget, or bail
    const valueOrGenericWidget = (gwPrefPanel.getPrefValueByPrefName("tabIndexedTooltips") && gwUtil.getSelfOrFirstParentWithAttr(input, gwTooltips.DATA_TOOLTIP)) ||
        gwUtil.getSelfOrFirstParentWithClass(input, "gw-ValueWidget");
    if (!valueOrGenericWidget || valueOrGenericWidget.hasAttribute("data-gw-no-helptext-drop")) {
      return;
    }
    const helptext = valueOrGenericWidget.getAttribute(this.DATA_HELPTEXT);
    const tooltext = valueOrGenericWidget.getAttribute(gwTooltips.DATA_TOOLTIP);
    if (helptext || tooltext) {
      // If it has a helptext as tooltip, remove it temporarily while help text is being displayed.
      if (tooltext) {
        valueOrGenericWidget.setAttribute(this.DATA_HIDDEN_TOOLTIP, tooltext);
        valueOrGenericWidget.removeAttribute(gwTooltips.DATA_TOOLTIP);
        gwTooltips.hide();
      }
      this.addHelptextElToNode(valueOrGenericWidget, input, helptext || tooltext || "");
    }
  }

  private addHelptextElToNode (valueWidget: GwDomNode, input: GwInputElement, text: string): void {
    const helptextEl = gwUtil.createDiv(null,
        {id: this.HELP_TEXT_EL_ID, role: "alert", "aria-roledescription": "tooltip"},
        {maxWidth: valueWidget.offsetWidth + "px"});
    helptextEl.textContent = text;
    gwUtil.addClass(valueWidget, this.HELP_TEXT_OPEN);
    valueWidget.appendChild(helptextEl);

    // If the widget already has a date picker open, then we'll force the helptext to the other side
    if (this.possiblyForceHelptextVAlign(valueWidget, input)) {
      return;
    }

    gwInputSystems.preventFloatingElementFromBeingOffscreen(valueWidget, input, helptextEl);
  }

  private disableHelpText (): void {
    const helptextEl = document.getElementById(this.HELP_TEXT_EL_ID);
    if (helptextEl) {
      const owner = gwUtil.getSelfOrFirstParentWithClass(helptextEl, this.HELP_TEXT_OPEN);
      if (owner) {
        if (owner.hasAttribute(this.DATA_HIDDEN_TOOLTIP)) {
          owner.setAttribute(gwTooltips.DATA_TOOLTIP, owner.getAttribute(this.DATA_HIDDEN_TOOLTIP) || "");
          owner.removeAttribute(this.DATA_HIDDEN_TOOLTIP);
        }
        gwUtil.removeClass(owner, this.HELP_TEXT_OPEN);
      }

      helptextEl.parentNode!.removeChild(helptextEl);
    }
  }
}

export const gwHelpText = new GwHelpText();
