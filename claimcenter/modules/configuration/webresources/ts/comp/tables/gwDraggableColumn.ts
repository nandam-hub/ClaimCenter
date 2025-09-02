import {GwDomNode} from "../../types/gwTypes";
import {gwUtil} from "../../core/util/gwUtil";
import {gwResizer} from "../../core/gwResizer";
import {gwListView} from "./gwListView";
import {GwDraggableSystem} from "../../core/util/GwDraggableSystem";
import {GwPoint} from "../../core/GwPoint";
import {gwDraggable} from "../../core/gwDraggable";
import {gwMouse} from "../../core/gwMouse";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * Dedicated class for handling the .gw-drag-bar inside of every horizontally resizable cell
 * Currently, only column (horizontal) resizing is supported
 */
export class GwDraggableColumn extends GwDraggableSystem {
  private readonly SCROLL_TRIGGER_MARGIN: number = 12;
  private readonly SCROLL_AMOUNT: number = 12;
  private readonly MIN_DRAGGED_WIDTH: number = 16;
  private mousePos: GwPoint | null = null;
  private originalContainerRect: ClientRect | null = null;
  private currentDragCell: HTMLTableDataCellElement | null = null;
  private currentDragCellInner: HTMLDivElement | null = null;
  private tdOriginalMinWidth: string | null = null;
  private tdOriginalMaxWidth: string | null = null;
  private cellInnerOriginalWidth: string | null = null;

  getSystemName (): string {
    return "gwDraggableColumn";
  }

  // Initialized by LVs after LV setup
  protected availableToInitialize (): boolean {
    return false;
  }

  init (): void {
    this.resetAllDragChanges();
  }

  private resetAllDragChanges (): void {
    if (this.currentDragCell) {
      gwListView.sizeColumnByCellId(this.currentDragCell.id, this.cellInnerOriginalWidth!, this.tdOriginalMinWidth, this.tdOriginalMaxWidth, false, false, true);
      gwListView.restoreStretchToLV(gwUtil.getSelfOrFirstParentWithClass(this.currentDragCell, ".gw-ListViewWidget"));
    }

    this.clearDragVariables();
  }

  private clearDragVariables (): void {
    this.mousePos = null;
    this.originalContainerRect = null;
    this.currentDragCell = null;
    this.currentDragCellInner = null;
    this.tdOriginalMinWidth = null;
    this.tdOriginalMaxWidth = null;
    this.cellInnerOriginalWidth = null;
  }

  dragStart (dragBar: GwDomNode, initialPosition: GwPoint): void {
    this.currentDragCell = gwUtil.getSelfOrFirstParentWithTag(dragBar, "td");
    if (!this.currentDragCell) {
      return;
    }

    this.currentDragCellInner = this.currentDragCell.querySelector(".gw-cell-inner");
    if (!this.currentDragCellInner) {
      return;
    }

    gwDraggable.enableDragHover(); //Allows holding the mouse near the edge of the screen to scroll
    const LV = gwUtil.getSelfOrFirstParentWithClass(this.currentDragCell, ".gw-ListViewWidget");
    gwListView.removeStretchFromLV(LV);

    this.mousePos = initialPosition;
    this.originalContainerRect = this.currentDragCell.getBoundingClientRect();

    // Store all the inline style values that a PCF or the server may have added to the cells
    this.tdOriginalMinWidth = this.currentDragCell.style.minWidth;
    this.tdOriginalMaxWidth = this.currentDragCell.style.maxWidth;
    this.cellInnerOriginalWidth = this.currentDragCellInner.style.width;

    // Zero out all the mins and maxes that will get in the way of visible dragging
    this.currentDragCell.style.minWidth = "0px";
    this.currentDragCell.style.maxWidth = "none";
    this.currentDragCell.style.width = "auto"; //NOTE: the only time that tds have a width, is when the LV is filling and growing
    this.currentDragCellInner.style.width = "auto";
  }

  dragEnd (): void {
    if (!this.currentDragCell || !this.currentDragCellInner) {
      return;
    }

    this.setCellSize(true);
  }

  dragCancel (): void {
    if (!this.currentDragCell) {
      return;
    }
    this.resetAllDragChanges();
  }

  drag (): void {
    if (!this.currentDragCell) {
      return;
    }

    this.mousePos = gwMouse.position;
    this.setCellSize(false);
  }

  /**
   * Returns the first element in the hierarchy with a scroll width greater than its client width
   * and with it's computed overflow x being equal to auto or scroll.
   * @param el
   * @returns {element or null if none found}
   */
  private getScrollParentOrNull (el: HTMLElement | null): GwDomNode | null {
    if (!el) {
      return null;
    }

    if (el.tagName.toLowerCase() === "div") {
      if (el.scrollWidth > el.clientWidth) {
        const compStyle = window.getComputedStyle(el);
        if (compStyle.overflowX === "auto" || compStyle.overflowX === "scroll") {
          return el;
        }
      }

      // Limit of top level scroll parent to the four major panels
      if (gwUtil.hasAnyClass(el, ["gw-center-panel", "gw-west-panel", "gw-south-panel", "gw-north-panel"])) {
        return null;
      }
    }

    return this.getScrollParentOrNull(el.parentElement);
  }

  /**
   * Sets the width of the cell based on the mouse position relative to the cells right edge
   * uses gwListView.sizeColumnByCellId
   * width is capped at MIN_DRAGGED_WIDTH < width < windowWidth
   */
  private setCellSize (finalFrame: boolean = false): void {
    if (this.mousePos === null || this.originalContainerRect === null || this.currentDragCell === null) {
      return;
    }

    let newWidth = this.mousePos.x - this.originalContainerRect.left;

    if (newWidth < this.MIN_DRAGGED_WIDTH) {
      newWidth = this.MIN_DRAGGED_WIDTH;
    } else if (newWidth > gwResizer.windowWidth) {
      newWidth = gwResizer.windowWidth;
    }

    gwListView.sizeColumnByCellId(this.currentDragCell.id, newWidth + "px", null, null, finalFrame, !finalFrame);

    this.scrollListView();

    if (finalFrame) {
      this.clearDragVariables();
    }
  }

  private scrollListView (): void {
    if (this.mousePos === null) {
      return;
    }

    const scrollParent = this.getScrollParentOrNull(this.currentDragCell);
    if (!scrollParent) {
      return;
    }

    const scrollParentBounds = scrollParent.getBoundingClientRect();
    if (this.mousePos.x >= scrollParentBounds.left + scrollParent.clientWidth - this.SCROLL_TRIGGER_MARGIN) {
      scrollParent.scrollLeft += this.SCROLL_AMOUNT;
    }
  }
}

export const gwDraggableColumn = new GwDraggableColumn();
