import {GwDomNode} from "../types/gwTypes";
import {gwResizer} from "../core/gwResizer";
import {gwMenus} from "../core/gwMenus";
import {gwStorage} from "../core/gwStorage";
import {GwDraggableSystem} from "../core/util/GwDraggableSystem";
import {gwUtil} from "../core/util/gwUtil";
import {gwScroll} from "../core/gwScroll";
import {gwMouse} from "../core/gwMouse";
import {GwPoint} from "../core/GwPoint";
import {gwAria} from "../core/aria/GwAria";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwWestPanel extends GwDraggableSystem {
  getSystemName (): string {
    return "gwWestPanel";
  }

  private readonly westPanelLastActiveIDs: string = "WestPanel.lastActive";
  private readonly westPanelMinKey: string = "WestPanel_Min";
  private readonly westPanelSizeKey: string = "WestPanel.size";
  //NOTE: if this value is set too small, then there will be scenarios where the padding + icon + ellipsed label + droparrow are too wide for the container
  //And the browser will cause the text in the label to overflow visibly, despite being set to overflow hidden
  private readonly westPanelSnapLine: number = 104; //TODO: could make this a preference

  /**
   * Used to calculate the offset of the drag bar from it's original position.
   * @type gw.Point
   */
  private startX: number | null = null;
  private offsetFromDragBar: number = 0;

  init (): void {
    this._restoreWestPanel();
  }

  /**
   * @public
   * Toggles the WestPanel expanding or collapsing.
   */
  toggleMinMax (): void {
    const expanded = !gwStorage.toggleFlag(this.westPanelMinKey);
    this.restoreWestPanelWidth();
    const minMaxToggle = this.getWestPanelMinMaxToggle();
    if (minMaxToggle) {
      gwAria.setAriaPropertyForElement("expanded", expanded, minMaxToggle);
    }
    gwResizer.check();
  }

  /**
   * Only used by gwStorage.registerComponentRestoreFunction.
   * Restores the various client only UI settings relating to the west panel.
   */
  _restoreWestPanel (): void {
    this.openLastActiveMenuItem();
    this.restoreWestPanelWidth();
    this.scrollActiveLocationMenuItemIntoViewIfNeeded();
  }

  private scrollActiveLocationMenuItemIntoViewIfNeeded (): void {
    // Get the last element with gw-active
    const westPanelScroller = document.getElementById("gw-west-panel--children--wrapper");
    if (!westPanelScroller) {
      return;
    }

    const actives = westPanelScroller.querySelectorAll(".gw-active");

    if (!actives) {
      return;
    }
    const lastActive = actives[actives.length - 1];

    gwScroll.scrollElementIntoView(westPanelScroller, lastActive as HTMLElement);
  }

  /**
   * We diff-replace the currently open active menu in the west panel when the user switches to a new location, which closes the menu, which is undesired.
   * So now we save off the last active menus and open them all up again after the diff.
   */
  private openLastActiveMenuItem (): void {
    const lastIds = gwStorage.get(this.westPanelLastActiveIDs);
    if (Array.isArray(lastIds)) {
      lastIds.forEach((id: string) => {
        const el = document.getElementById(id);
        if (el) {
          gwMenus.openSubMenu(el);
        }
      });
    }

    const newIds: string[] = [];
    gwUtil.forEach(this.getWestPanelEl().querySelectorAll(".gw-staticMenus.gw-active"), el => {
      if (el.hasAttribute("id")) {
          newIds.push(el.id);
      }
    });

    gwStorage.set(this.westPanelLastActiveIDs, newIds);
  }

  toggleActionMenu (): void {
    gwMenus.toggleSubMenu(".gw-MenuActionsWidget");
  }

  /**
   * Dragging
   */
  setWestPanelSizingOnEvent (): void {
    this.setWestPanelSizing(gwMouse.position.x - this.offsetFromDragBar);
    gwResizer.check();
  }

  restoreWestPanelWidth (recalculateCenterPanel: boolean = true): void {
    let width = gwStorage.get(this.westPanelSizeKey) || null;
    const isMin = gwStorage.get(this.westPanelMinKey);
    if (isMin) {
      width = "min";
    }

    this.setWestPanelSizing(width, recalculateCenterPanel);
  }

  setWestPanelSizing (pixelWidth: string | number | null, recalculateCenterPanel: boolean = true): void {
    const wp = this.getWestPanelEl();
    if (!wp) {
      return;
    }

    if (pixelWidth) {
      if (pixelWidth === "min" || (typeof pixelWidth === "number" && pixelWidth < this.westPanelSnapLine)) {
        gwStorage.set(this.westPanelMinKey, true);
        pixelWidth = null;
      }
    }

    if (pixelWidth) {
      pixelWidth = +pixelWidth;
      const maxWidth = gwResizer.windowWidth ? (gwResizer.windowWidth * .8) : pixelWidth;

      pixelWidth = Math.min(pixelWidth, maxWidth);
      pixelWidth = Math.max(pixelWidth, this.westPanelSnapLine);

      gwStorage.set(this.westPanelSizeKey, pixelWidth);
      gwStorage.set(this.westPanelMinKey, false);

      wp.style.width = pixelWidth + "px";
    } else {
      wp.style.width = "";
    }

    const isMin = gwStorage.get(this.westPanelMinKey);
    gwUtil.conditionalAddRemoveClass(isMin, "#gw-west-panel", ".gw-makeWestPanel--min");
    gwUtil.conditionalAddRemoveClass(isMin, ".gw-MenuActionsWidget", ".gw-makeWestPanel--min");
    if (recalculateCenterPanel) {
      gwResizer.recalcCenterPanel();
    }
  }

  getWestPanelEl (): GwDomNode {
    const westPanelEl = document.getElementById("gw-west-panel");
    if (!westPanelEl) {
      throw new Error("Unable to locate the west panel element");
    }

    return westPanelEl;
  }

  getWestPanelMinMaxToggle (): GwDomNode | null {
    return document.getElementById("gw-west-panel--bottom-bar--minmax");
  }

  private moveDragBarToMouse (): void {
    if (this.startX === null) {
      throw new Error("found null start position");
    }

    this.dragBar.style.top = "0";
    this.dragBar.style.right = (this.startX - gwMouse.position.x + this.offsetFromDragBar) + "px";
  }

  private resetDragBar (): void {
    this.dragBar.style.right = null as any;
    this.dragBar.style.top = null as any;
  }

  private _dragBar: HTMLDivElement | null = null;

  private get dragBar (): HTMLDivElement {
    if (this._dragBar === null) {
      this._dragBar = document.querySelector(".gw-WestPanelWidget--drag");
    }

    if (this._dragBar === null) {
      throw new Error("Unable to locate the west panel drag bar");
    }

    return this._dragBar;
  }

  /**
    * Called by gwDraggable.ts
   * @param el
   * @param args
   * @param e
   */
  drag (el: GwDomNode): void {
    this.moveDragBarToMouse();
  }

  /**
   * Called by gwDraggable.ts
   * @param el
   * @param initialPosition
   */
  dragStart (el: GwDomNode, initialPosition: GwPoint): void {
    gwUtil.addClass(this.getWestPanelEl(), "gw-beingResized");
    this._dragBar = null;
    const dragBarRect = this.dragBar.getBoundingClientRect();
    this.startX = dragBarRect.right - (dragBarRect.width * .5);
    this.offsetFromDragBar = initialPosition.x - this.startX;
  }

  /**
   * Called by gwDraggable.ts
   * @param el
   * @param args
   * @param e
   */
  dragEnd (el: GwDomNode): void {
    this.dragEndOrCancel();
    this.setWestPanelSizingOnEvent();
  }

  /**
   * Called by gwDraggable.ts
   * @param el
   * @param args
   * @param e
   */
  dragCancel (el: GwDomNode): void {
    this.dragEndOrCancel();
    this.setWestPanelSizing(gwStorage.get(this.westPanelSizeKey));
  }

  private dragEndOrCancel (): void {
    this.resetDragBar();
    gwUtil.removeClass(this.getWestPanelEl(), "gw-beingResized");
    this.startX = null;
    this._dragBar = null;
  }
}

export const gwWestPanel = new GwWestPanel();
