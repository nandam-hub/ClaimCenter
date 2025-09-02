import {GwDomNode, GwEventType, GwMap} from "../types/gwTypes";
import {gwEvents} from "../core/events/gwEvents";
import {gwStorage} from "../core/gwStorage";
import {gwResizer} from "../core/gwResizer";
import {GwPoint} from "../core/GwPoint";
import {gwUtil} from "../core/util/gwUtil";
import {GwDraggableSystem} from "../core/util/GwDraggableSystem";
import {gwMouse} from "../core/gwMouse";
import {gwAria} from "../core/aria/GwAria";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * The south panel (also known as the workspace) is displayed at the bottom of the UI and contains one or more
 * worksheets, which can contain arbitrary panels, inputs and so on. You can switch between worksheets via tabs at
 * the top of the workspace.
 *
 * The south panel is in one of three states:
 * - Hidden entirely
 * - Showing normally
 * - Minimized (just the worksheet tab labels showing)
 *
 * The server determines whether the south panel is hidden. On every render it will figure out the current worksheet,
 * if any, and then render it. The client side code cannot hide the south panel directly, it must cause a server
 * request that will then figure out if there is still a current worksheet and render accordingly. All tab changes
 * also require a server round trip and re-render, as the client only has the content for the "current" worksheet.
 *
 * The client is in control of the south panel height and whether it is minimized. These values are both kept in
 * local storage and the controls for resizing and minimizing the south panel are purely client side. So when the
 * panel is minimized all its contents is available on the client side, just not all visible.
 *
 * The very first time the south panel is displayed there will be no stored height or minimization flag and, in that
 * case, the client side code will set the south panel height to be a proportion of the overall UI height.
 *
 * Resizing the south panel is done via a drag control so it implements the GwDraggableSystem interface.
 */
export class GwSouthPanel extends GwDraggableSystem {

  getSystemName (): string {
    return "gwSouthPanel";
  }

  /**
   *  Used to store a boolean indicating whether the south panel is minimized - if unset, assume false
   */
  private readonly IS_MINIMIZED_KEY: string = "SouthPanel_Min";

  /**
   * Used to store the south panel height in pixels - if unset need to calculate default height
   */
  private readonly HEIGHT_KEY: string = "SouthPanel.size";

  /**
   * Used when there is no stored south panel height; used to calculate how high it should be relative to the
   * center panel
   */
  private readonly DEFAULT_HEIGHT_PERCENTAGE: number = 0.4;

  /**
   * Minimum number of pixels to allow for the center panel, to stop the south panel from entirely covering it.
   * This ensures at least a little of the center panel is visible and also leaves space for the south panel
   * "minimizer" control.
   */
  private readonly MINIMUM_CENTER_PANEL_HEIGHT: number = 10;

  /**
   * If the south panel is smaller than the "snapLine" height (in pixels) then it is minimized automatically
   */
  private _snapLine: number = 80;

  /**
   * Used to calculate the offset of the drag bar from it's original position.
   * @type GwPoint
   */
  private _startY: number | null = null;
  private _offsetFromDragBar: number = 0;
    /**
   * Initialization, called after server round trip
   */
  init (isFullPageReload: boolean): void {
    this.setSnapLineFromCss();
    this.setPanelToSavedHeightAfterRender();
    this.possiblyHideDuplicateTitlebar();
    const southPanelToggleMinimizer = document.getElementById("gw-south-panel-toggleMinMax_float");
    if (southPanelToggleMinimizer) {
      gwAria.setAriaPropertyForElement("expanded", !this.isMinimized(), southPanelToggleMinimizer);
    }
  }

  private possiblyHideDuplicateTitlebar (): void {
    const el = this.getSouthPanelEl();
    if (!el) {
      return;
    }

    const screenTitleBar = el.querySelector(".gw-isScreenTitle") as HTMLDivElement;
    if (!screenTitleBar) {
      return;
    }

    const titleBarTitle = screenTitleBar.querySelector(".gw-TitleBar--title") as HTMLDivElement;
    if (!titleBarTitle) {
      return;
    }

    const tabLabel = el.querySelector(".gw-WorksheetTabWidget.gw-active .gw-label") as HTMLDivElement;
    if (!tabLabel) {
      gwUtil.removeClass(titleBarTitle, "gw-hidden");
      return;
    }

    gwUtil.conditionalAddRemoveClass(titleBarTitle.innerText === tabLabel.innerText, screenTitleBar, ".gw-hidden");
  }

  /**
   * Called by the resizer to calculate the size of the center panel, to ensure that the south panel will fit in the
   * available space. The south panel will try to return to its saved height, if available. If there's not room for
   * that, or it has no saved height, then it will try to fill up 40% of the available space.
   * @param {number} availablePixels the amount of space available for the south panel
   * @returns {number} the height of the south panel
   */
  ensureHeightFits (availablePixels: number): number {
    if (this.isHidden()) {
      // South panel hidden entirely
      return 0;
    }

    if (this.isMinimized()) {
      // Can't negotiate height of minimized panel
      return this.computeActualHeight();
    }

    const storedHeight = this.getStoredHeight();
    const effectiveAvailablePixels = availablePixels - this.MINIMUM_CENTER_PANEL_HEIGHT;
    if (storedHeight !== null && storedHeight <= effectiveAvailablePixels) {
      return storedHeight;
    }

    const newHeight = storedHeight === null
      ? Math.min(Math.floor(availablePixels * this.DEFAULT_HEIGHT_PERCENTAGE), effectiveAvailablePixels)
      : effectiveAvailablePixels;

    // If too small, forcibly minimize. Otherwise update height
    if (newHeight < this._snapLine) {
      gwStorage.set(this.IS_MINIMIZED_KEY, true);
      this.applyMinimization();
      return this.computeActualHeight();
    } else {
      gwStorage.set(this.HEIGHT_KEY, newHeight);
      this.getSouthPanelEl().style.height = newHeight + "px";
      return newHeight;
    }
  }

  /**
   * Toggles south panel minimization
   * Public event handler
   */
  toggleCollapse (): void {
    const isExpanded = ! gwStorage.toggleFlag(this.IS_MINIMIZED_KEY);
    const southPanelToggleMinimizer = document.getElementById("gw-south-panel-toggleMinMax_float");
    if (southPanelToggleMinimizer) {
      gwAria.setAriaPropertyForElement("expanded", isExpanded, southPanelToggleMinimizer);
    }
    this.restorePanelHeight();
  }

  /**
   * Open the south panel if it is minimized
   * Public event handler
   */
  unMinimize (): void {
    if (this.isMinimized()) {
      this.toggleCollapse();
    }
  }

  /**
   * Opens the south panel if currently minimized, in addition to firing the worksheet tab event. Firing the tab
   * event will cause a server round trip and re-render
   * Public event handler
   */
  worksheetTabClick (node: GwDomNode, args: GwMap, e: GwEventType): void {
    gwStorage.set(this.IS_MINIMIZED_KEY, false);
    const outerAction = gwUtil.getSelfOrFirstParentWithClass(node, "gw-action--outer");
    if (outerAction) {
      args.id = outerAction.id;
    }

    gwEvents.methods.fireEvent(node, args, e);
  }

  private _dragBar: HTMLDivElement | null = null;

  private get dragBar (): HTMLDivElement {
    if (this._dragBar === null) {
      this._dragBar = document.querySelector(".gw-SouthPanelWidget--drag");
    }

    if (this._dragBar === null) {
      throw new Error("Unable to locate the west panel drag bar");
    }

    return this._dragBar;
  }

  /**
   * Part of the GwDraggableSystem interface, called by gwDraggable.ts when the south panel is being resized
   */
  drag (el: GwDomNode): void {
    this.moveDragBarToMouse();
  }

  /**
   * Part of the GwDraggableSystem interface, called by gwDraggable.ts when the south panel is being resized
   */
  dragStart (el: GwDomNode, initialPosition: GwPoint): void {
    gwUtil.addClass(this.getSouthPanelEl(), "gw-beingResized");
    this._dragBar = null;
    const dragBarRect = this.dragBar.getBoundingClientRect();
    this._startY = dragBarRect.bottom - (dragBarRect.height * .5);
    this._offsetFromDragBar = initialPosition.y - this._startY;
 }

  /**
   * Part of the GwDraggableSystem interface, called by gwDraggable.ts when the south panel is being resized
   */
  dragEnd (el: GwDomNode): void {
    this.dragEndOrCancel();
    this.setPanelHeightOnEvent();
  }

  /**
   * Part of the GwDraggableSystem interface, called by gwDraggable.ts when the south panel is being resized
   */
  dragCancel (el: GwDomNode): void {
    this.dragEndOrCancel();
    this.restorePanelHeight();
  }

  private dragEndOrCancel (): void {
    this.resetDragBar();
    gwUtil.removeClass(this.getSouthPanelEl(), "gw-beingResized");
    this._startY = null;
    this._dragBar = null;
  }

  /**
   * Called when the user has dragged the south panel to a new height. Clear minimization and then attempt
   * to set height according to the mouse position - if that makes the panel smaller than the "snap line"
   * setPanelHeight will re-minimize it.
   */
  private setPanelHeightOnEvent (): void {
    const pixelHeight = (gwResizer.windowHeight - gwMouse.position.y);
    gwStorage.set(this.IS_MINIMIZED_KEY, false);
    this.setPanelHeight(pixelHeight);
  }

  private restorePanelHeight (): void {
    this.setPanelHeight(this.getStoredHeight());
  }

  /**
   * Read the snap line height configured in CSS, if possible. This allows the snap line to be configured via
   * style sheet, rather than being hard coded in this file.
   */
  private setSnapLineFromCss (): void {
    const panelMinHeight = this.getSouthPanelEl().style.minHeight;
    if (panelMinHeight) {
      this._snapLine = parseInt(panelMinHeight) || this._snapLine;
    }
  }

  /**
   * Called during initialization - that is after the server has re-rendered - to set the newly rendered panel's
   * height to the value chosen by the user. Later in initialization the resizer will ensure that the panel will
   * actually fit in the available space.
   */
  private setPanelToSavedHeightAfterRender (): void {
    if (!this.isHidden()) {
      this.applyMinimization();
      if (!this.isMinimized()) {
        const storedHeight = this.getStoredHeight();
        if (storedHeight !== null) {
          this.getSouthPanelEl().style.height = storedHeight + "px";
        }
      }
    }
  }

  private computeActualHeight (): number {
    return parseFloat(window.getComputedStyle(this.getSouthPanelEl()).height!);
  }

  /**
   * Called when a client side action (resizing or minimization) has changed the height of the panel. Notifiers
   * the resizer when it is done, and the resizer will call back to ensure the proposed height works.
   */
  private setPanelHeight (pixelHeight: number | null): void {
    const panelEl = this.getSouthPanelEl();

    if (this.isMinimized() || (pixelHeight !== null && pixelHeight < this._snapLine)) {
      gwStorage.set(this.IS_MINIMIZED_KEY, true);
      pixelHeight = null;
    }

    if (pixelHeight) {
      const maxHeight = gwResizer.windowHeight ? gwResizer.windowHeight : pixelHeight;
      pixelHeight = Math.min(pixelHeight, maxHeight);
      pixelHeight = Math.max(pixelHeight, this._snapLine);

      gwStorage.set(this.HEIGHT_KEY, pixelHeight);
      gwStorage.set(this.IS_MINIMIZED_KEY, false);
      panelEl.style.height = pixelHeight + "px";
    } else {
      panelEl.style.height = "";
    }

    this.applyMinimization();
    gwResizer.recalcCenterPanel();
  }

  private isHidden (): boolean {
    return gwUtil.hasClass(this.getSouthPanelEl(), "gw-placeholder");
  }

  private isMinimized (): boolean {
    return gwStorage.get(this.IS_MINIMIZED_KEY) || false;
  }

  private getStoredHeight (): number | null {
    return gwStorage.get(this.HEIGHT_KEY) || null as number | null;
  }

  /**
   * Check whether the south panel is minimized and then show/hide the appropriate south panel elements
   */
  private applyMinimization (): void {
    const isMin = this.isMinimized();
    gwUtil.conditionalAddRemoveClass(isMin, "#gw-south-panel", ".gw-makeSouthPanel--min");
    gwUtil.conditionalAddRemoveClass(isMin, "#gw-SouthPanel--toggle", "gw-minimized");
    gwUtil.conditionalAddRemoveClass(isMin, "#gw-south-panel-toggleMinMax_float", "gw-minimized");
  }

  private getSouthPanelEl (): HTMLDivElement {
    const panelEl = document.getElementById("gw-south-panel");
    if (!panelEl) {
      throw new Error("Unable to locate the south panel in the DOM");
    }

    return panelEl as HTMLDivElement;
  }

  private moveDragBarToMouse (): void {
    if (this._startY === null) {
      throw new Error("found null start position");
    }

    this.dragBar.style.left = "0";
    this.dragBar.style.top = this._offsetFromDragBar + (gwMouse.position.y - this._startY) + "px";
  }

  private resetDragBar (): void {
    this.dragBar.style.left = null as any;
    this.dragBar.style.top = null as any;
  }

}

export const gwSouthPanel = new GwSouthPanel();
