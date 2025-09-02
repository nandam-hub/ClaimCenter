import {GwDomNode, GwMap, GwPartialReloadDetails} from "../types/gwTypes";
import {gwUtil} from "./util/gwUtil";
import {gwEvents} from "./events/gwEvents";
import {gwDraggable} from "./gwDraggable";
import {GwInitializableSystem} from "./util/GwInitializableSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwTooltips extends GwInitializableSystem {

  getSystemName (): string {
    return "gwTooltips";
  }

  private readonly xOffset: number = 8;     // Offset of right end of tooltip from mouse position
  private readonly yOffsetUp: number = 8;   // Offset of bottom of tooltip from mouse position
  private readonly yOffsetDown: number = 14; // Offset of top of tooltip from mouse position, if there's no room above the mouse

  private tooltipDiv: HTMLDivElement | null = null;

  readonly DATA_TOOLTIP: string = "data-gw-tooltip";

  init (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    if (isFullPageReload && this.tooltipDiv === null) {
      this.tooltipDiv = document.createElement("div");
      this.tooltipDiv.classList.add("gw-tooltip");
      document.body.appendChild(this.tooltipDiv);
    }
  }

  /**
   * Used to add a tooltip, and all the required attributes, to a client generated element, generated after the page walk is complete
   * @param el
   * @param tooltip
   */
  addTooltip (el: GwDomNode, tooltip: string): void {
    el.setAttribute(this.DATA_TOOLTIP, tooltip);

    gwEvents.addInlineEventListenersToThisSpecificNode(el);
  }

  private getTooltipDiv (): HTMLDivElement {
    if (this.tooltipDiv === null) {
      throw new Error("Missing tooltip div");
    }

    return this.tooltipDiv;
  }

  private positionTooltip (e: MouseEvent): void {
    const tooltipRect = this.getTooltipDiv().getBoundingClientRect();
    const left = Math.max(e.clientX - (tooltipRect.width + this.xOffset), 0);
    let top = e.clientY - (tooltipRect.height + this.yOffsetUp);
    if (top < 0) {
      top = e.clientY + this.yOffsetDown;
    }
    this.getTooltipDiv().style.left = left + "px";
    this.getTooltipDiv().style.top = top + "px";
  }

  show (el: GwDomNode, args: GwMap, e: MouseEvent): void {
    // if (gwEvents.isCurrentlyInTouchEvent()) {
    //   return;
    // }

    if (gwDraggable.isDragging() ||
      !el.hasAttribute(this.DATA_TOOLTIP) ||
      el.hasAttribute("data-gw-hideHelptext")) {
      this.hide();
      return;
    }

    gwUtil.addClass(this.getTooltipDiv(), "gw-show");

    this.getTooltipDiv().textContent = el.getAttribute(this.DATA_TOOLTIP) || "";
    //position anyway, so that it is in the right place when it appears
    this.positionTooltip(e);
  }

  move (el: GwDomNode, args: GwMap, e: MouseEvent): void {
    this.positionTooltip(e);
  }

  hide (): void {
    if (this.tooltipDiv === null) {
      return;
    }

    gwUtil.removeClass(this.getTooltipDiv(), "gw-show");
    this.getTooltipDiv().style.removeProperty("left");
    this.getTooltipDiv().style.removeProperty("top");
    gwUtil.clearInnerHTML(this.getTooltipDiv());
  }
}

export const gwTooltips = new GwTooltips();
