import {GwDomNode} from "../../types/gwTypes";
import {gwListView} from "./gwListView";
import {GwPoint} from "../../core/GwPoint";
import {gwAnimation} from "../../core/gwAnimation";
import {gwDraggable} from "../../core/gwDraggable";
import {gwUtil} from "../../core/util/gwUtil";
import {gwListViewColumnMenu} from "./gwListViewColumnMenu";
import {gwMouse} from "../../core/gwMouse";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwListViewHelper {
  // DRAGGABLE RELATED FUNCTIONALITY
  /**
   * Configurable number determine the valid drop area on either side of a cell border.
   * @type {number}
   */
  private readonly DROP_MARGIN: number = 12;
  private readonly SCROLL_TRIGGER_MARGIN: number = 12;
  private readonly SCROLL_AMOUNT: number = 12;
  /**
   * Used to calculate the offset of the drag bar from it's originally grabbed position.
   * @type {gwPoint}
   */
  private mouseOffset: GwPoint | null = null;
  /**
   * Updated from draggable on every drag frame
   * @type gwPoint
   */
  private mousePos: GwPoint | null = null;
  private origContainerPos: GwPoint | null = null;
  private dragContainerHalfWidth: number | null = null;
  private headerRow: HTMLTableRowElement | null = null;
  private headerCellTds: NodeListOf<HTMLTableDataCellElement> | null = null;
  private ownerHeaderCell: HTMLTableDataCellElement | null = null;

  private currentDragContainer: HTMLDivElement | null = null;

  private getCurrentDragContainerOrThrow (): HTMLDivElement {
    if (!this.currentDragContainer) {
      throw new Error("Missing currentDragContainer");
    }

    return this.currentDragContainer;
  }

  private getOwnerHeaderCellOrThrow (): HTMLTableDataCellElement {
    if (!this.ownerHeaderCell) {
      throw new Error("Missing ownerHeaderCell");
    }

    return this.ownerHeaderCell;
  }

  private getHeaderCellTdsOrThrow (): NodeListOf<HTMLTableDataCellElement> {
    if (!this.headerCellTds) {
      throw new Error("Missing headerCellTds");
    }

    return this.headerCellTds;
  }

  private getHeaderRowOrThrow (): HTMLTableRowElement {
    if (!this.headerRow) {
      throw new Error("Missing headerRow");
    }

    return this.headerRow;
  }

  private getDragContainerHalfWidthOrThrow (): number {
    if (!this.dragContainerHalfWidth) {
      throw new Error("Missing dragContainerHalfWidth");
    }

    return this.dragContainerHalfWidth;
  }

  private getMousePosOrThrow (): GwPoint {
    if (!this.mousePos) {
      throw new Error("Missing mouse pos");
    }

    return this.mousePos;
  }

  private getMouseOffsetOrThrow (): GwPoint {
    if (!this.mouseOffset) {
      throw new Error("Missing mouse offset");
    }

    return this.mouseOffset;
  }

  private getOrigContainerPosOrThrow (): GwPoint {
    if (!this.origContainerPos) {
      throw new Error("Missing original container position");
    }

    return this.origContainerPos;
  }

  /**
   * Populates the Columns Menu with Menu Items for each valid header cell in each listview on the page.
   * @param optionalSingleLV - passing an optional LV element will cause the method to only generate
   * content for that LV.
   */
  buildColumnsMenusForAllLVs (optionalSingleLV?: GwDomNode): void {
    let listViews;
    if (optionalSingleLV) {
      listViews = [optionalSingleLV];
    } else {
      listViews = $(".gw-ListViewWidget");
    }

    gwUtil.forEach(listViews, (listview) => {
      const headerRow = listview.querySelector(".gw-RowWidget:not(.gw-isSmartHeader)");
      const uiSection = listview.querySelector(".gw-ListView--UI-section");
      const title = listview.querySelector(".gw-ListView--UI--title:not(:empty)");
      const toolbar = uiSection ? uiSection.querySelector(".gw-ToolbarWidget:not(:empty):not(.gw-placeholder)") : null;
      const paging = uiSection ? uiSection.querySelector(".gw-IteratorPagingWidget:not(:empty):not(.gw-placeholder)") : null;
      const filters = uiSection ? uiSection.querySelector(".gw-ListView--UI-filters:not(:empty)") : null;
      const columnsButton = uiSection ? uiSection.querySelector(".gw-ListView--UI--columns-menu") : null;
      const bumperEl = listview.querySelector(".gw-ListView--bottom-bumper") as HTMLDivElement;
      let needsColumnMenu = false;
      let hasControls = false;
      if (headerRow && columnsButton) {
        needsColumnMenu = gwListViewColumnMenu.addColumnMenuItems(listview, headerRow, columnsButton);
      }

      if (toolbar) {
        gwUtil.forEach(toolbar.childNodes, (child) => {
          if (!gwUtil.hasAnyClass(child, ["gw-placeholder", "gw-ToolbarDividerWidget"])) {
            hasControls = true;
          }
        });
      }

      if (paging && !hasControls) {
        gwUtil.forEach(paging.childNodes, (child) => {
          if (!gwUtil.hasClass(child, "gw-placeholder")) {
            hasControls = true;
          }
        });
      }

      if (filters && !hasControls) {
        gwUtil.forEach(filters.childNodes, (child) => {
          if (!gwUtil.hasClass(child, "gw-placeholder")) {
            hasControls = true;
          }
        });
      }

      if (columnsButton) {
        gwUtil.conditionalAddRemoveClass(!needsColumnMenu, columnsButton, "gw-hidden");
      }
      if (uiSection) {
        gwUtil.conditionalAddRemoveClass(!needsColumnMenu && !hasControls && !title && !filters, uiSection, "gw-hidden");
        const columnsMenuOnly = columnsButton && needsColumnMenu && !hasControls && !title && !filters;
        gwUtil.conditionalAddRemoveClass(columnsMenuOnly, [uiSection, listview], "gw-columns-menu-only");
      }

      if (bumperEl) {
        gwUtil.removeClass(bumperEl, "gw-hasPaging");

        if (paging && hasControls && listview.hasAttribute("data-gw-bottom-paging")) {
          gwUtil.addClass(bumperEl, "gw-hasPaging");
          this.duplicatePagingToBottomOfLV(listview, paging, bumperEl);
        }
      }
    });
  }

  private duplicatePagingToBottomOfLV (lv: HTMLDivElement, paging: HTMLDivElement, bumper: HTMLDivElement): void {
    if (paging.hasAttribute("data-gw-duplicated")) {
      return;
    }

    paging.setAttribute("data-gw-duplicated", "true");

    // Deep clone the paging element
    const clonedPaging = paging.cloneNode(true) as HTMLDivElement;
    clonedPaging.setAttribute("id", clonedPaging.getAttribute("id") + "--dupe");

    // Get every child of the cloned paging element that has an id, and append --dupe to it
    gwUtil.forEach(
        gwUtil.getDomNodesByAttr("id", undefined, clonedPaging),
        (elWithId) => elWithId.setAttribute("id", elWithId.getAttribute("id") + "--dupe")
    );

    const possiblyExistingPaging = bumper.querySelector(".gw-IteratorPagingWidget") as HTMLDivElement;
    gwUtil.removeNode(possiblyExistingPaging);
    bumper.appendChild(clonedPaging);
  }

  /**
   * Calls getIndexForAndHighlightPossibleDrop
   * Moves the original column to the left of the targetColumn, unless the target column is the last in the row,
   * in which case it inserts the original column to the right of it.
   */
  private possiblyPlaceColumn (): void {
    const el = this.currentDragContainer;
    let targetIndex = this.getIndexForAndHighlightPossibleDrop();
    if (targetIndex === null) {
      return;
    }

    const headerCellTds = this.getHeaderCellTdsOrThrow();

    let originalIndex = targetIndex;
    for (let i = 0; i < headerCellTds.length; i++) {
      if (headerCellTds[i] === this.getOwnerHeaderCellOrThrow()) {
        originalIndex = i;
        break;
      }
    }

    //normalize indexes for 1 based element array
    originalIndex++;
    targetIndex++;

    // PLACE COLUMN
    const listview = gwUtil.getSelfOrFirstParentWithClassOrThrow(el, "gw-ListViewWidget");

    const columnToMove = $(listview).find("tr:not(.gw-RowGroup) td:nth-child(" + originalIndex + ")");

    if (targetIndex - 1 === headerCellTds.length) {
      targetIndex--;
      const targetColumn = $(listview).find("tr:not(.gw-RowGroup) td:nth-child(" + targetIndex + ")");

      $(columnToMove).each((idx, element) => {
        const $el = $(element);
        $el.insertAfter($(targetColumn).get(idx)!);
        gwAnimation.addAnimation($el[0], "highlight-swap");
      });

    } else {
      if (originalIndex === targetIndex || (originalIndex < targetIndex && originalIndex + 1 === targetIndex)) {
        return;
      }
      const targetColumn = $(listview).find("tr:not(.gw-RowGroup) td:nth-child(" + targetIndex + ")");

      $(columnToMove).each((idx, element) => {
        const $el = $(element);
        $el.insertBefore($(targetColumn).get(idx)!);
        gwAnimation.addAnimation($el[0], "highlight-swap");
      });
    }

    this.buildColumnsMenusForAllLVs(listview);
    gwListView.applyColumnClasses(listview);
    gwListView.markColumnsAsOrdered(listview);
    gwListView.storeColumnOrder(listview);
  }

  /**
   * Returns the first element in the hierarchy with a scroll width greater than its client width
   * and with it's computed overflow x being equal to auto or scroll.
   * Stops at the screen widget.
   * @param el
   * @returns {element or null if none found}
   */
  private getScrollParentOrNull (el: GwDomNode | null): GwDomNode | null {
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
   * Updates the header drag slider to be aligned with the mouse, while capping its position
   * to the row element, and attempting to scroll parent elements if the dragged element is near
   * either horizontal edge.
   */
  private moveSliderToMouse (): void {
    const el = this.getCurrentDragContainerOrThrow();
    const mousePos = this.getMousePosOrThrow();
    const mouseOffset = this.getMouseOffsetOrThrow();
    const headerRow = this.getHeaderRowOrThrow();
    const dragContainerHalfWidth = this.getDragContainerHalfWidthOrThrow();
    const origContainerPos = this.getOrigContainerPosOrThrow();

    const originalX = (mousePos.x + mouseOffset.x);
    const headerRowBounds = headerRow.getBoundingClientRect();

    // Restrict how far the drag container will go.  Positions are
    // relative to the left side of the dragContainer
    const minXposition = headerRowBounds.left - dragContainerHalfWidth;
    const maxXposition = headerRowBounds.right - dragContainerHalfWidth;

    let updatedXPosition = originalX;
    if (originalX < minXposition) {
      updatedXPosition = minXposition;
    } else if (originalX > maxXposition) {
      updatedXPosition = maxXposition;
    }

    el.style.top = origContainerPos.y + "px";
    el.style.left = updatedXPosition + "px";

    this.scrollListView(el);
  }

  private scrollListView (dragContainer: GwDomNode): void {
    const scrollParent = this.getScrollParentOrNull(this.getOwnerHeaderCellOrThrow());
    if (scrollParent) {
      const dragContainerBounds = dragContainer.getBoundingClientRect();
      const scrollParentBounds = scrollParent.getBoundingClientRect();
      if (dragContainerBounds.right >= scrollParentBounds.left + scrollParent.clientWidth - this.SCROLL_TRIGGER_MARGIN) {
        scrollParent.scrollLeft += this.SCROLL_AMOUNT;
      } else if (dragContainerBounds.left <= (scrollParentBounds.left + this.SCROLL_TRIGGER_MARGIN)) {
        scrollParent.scrollLeft -= this.SCROLL_AMOUNT;
      }
    }
  }

  /**
   * Caches off the headerRow and headerCellTds array.
   */
  private processHeaderRow (): void {
    this.headerRow = $(this.getOwnerHeaderCellOrThrow()).closest("tr")[0] as any as HTMLTableRowElement | null;
    this.headerCellTds = this.getHeaderRowOrThrow().querySelectorAll("td") as NodeListOf<HTMLTableDataCellElement> | null;
  }

  /**
   * Highlights both the dragged header, and valid left and right headers if the dragged header can be legally dropped.
   * Also returns the index of the valid drop position.
   * Returns null if the slider is not in a valid position to be dropped.
   * @returns {int or null}
   */
  private getIndexForAndHighlightPossibleDrop (): number | null {
    const el = this.getCurrentDragContainerOrThrow();
    const headerCellTds = this.getHeaderCellTdsOrThrow();
    const centerDragContainer = el.getBoundingClientRect().left + this.getDragContainerHalfWidthOrThrow();
    let currentHeaderInfo = null;
    const ownerHeaderCell = this.getOwnerHeaderCellOrThrow();

    gwUtil.removeClass(el, "gw-possibleDrop");

    for (let i = 0; i < headerCellTds.length; i++) {
      const currentHeaderCell: HTMLTableDataCellElement = headerCellTds[i];
      // Skip over it if the header cell being checked is:
      // 1) hidden
      // 2) the same as the cell that's moving
      if (gwUtil.hasClass(currentHeaderCell, "gw-hidden") ||
        currentHeaderCell === ownerHeaderCell) {
        continue;
      }

      currentHeaderInfo = {
        td: currentHeaderCell,
        bounds: currentHeaderCell.getBoundingClientRect()
      };

      gwUtil.removeClass(currentHeaderCell, ["gw-tdDropHighlightRightCell", "gw-tdDropHighlightLeftCell"]);

      if (centerDragContainer >= currentHeaderInfo.bounds.left && centerDragContainer <= currentHeaderInfo.bounds.left + this.DROP_MARGIN) {
        // Don't highlight if the first column is not draggable or
        // it's the immediate boundary to the left of the cell begin moved
        if ((i === 0 && !this.headerCellDraggable(currentHeaderCell)) || (i > 0 && ownerHeaderCell === headerCellTds[i - 1])) {
          return null;
        }
        gwUtil.addClass(currentHeaderCell, "gw-tdDropHighlightRightCell");
        gwUtil.addClass(el, "gw-possibleDrop");

        if (i > 0 && currentHeaderCell.previousSibling) {
          gwUtil.addClass(currentHeaderCell.previousSibling as HTMLElement, "gw-tdDropHighlightLeftCell");
        }
        return i;
      }

      if (centerDragContainer <= currentHeaderInfo.bounds.right && centerDragContainer >= currentHeaderInfo.bounds.right - this.DROP_MARGIN) {
        // Don't highlight if it's the immediate boundary to the right of the cell being moved
        if (i < headerCellTds.length && ownerHeaderCell === headerCellTds[i + 1]) {
          return null;
        }
        gwUtil.addClass(currentHeaderCell, "gw-tdDropHighlightLeftCell");
        gwUtil.addClass(el, "gw-possibleDrop");

        if (i < headerCellTds.length && currentHeaderCell.nextSibling) {
          gwUtil.addClass(currentHeaderCell.nextSibling as HTMLElement, "gw-tdDropHighlightRightCell");
        }
        return i + 1;
      }
    }
    //Slider is not in highlight range of anything
    return null;
  }

  /**
   * Returns true if the header cell is marked as being draggable
   * @param headerCell header cell being checked for drag-ability
   * @returns {boolean} returns true if the header cell is marked to be draggable else returns false
   */
  private headerCellDraggable (headerCell: HTMLTableDataCellElement): boolean {
    return !!headerCell.querySelector(".gw-draggable");
  }

  private resetAllDragChanges (): void {
    gwUtil.forEach(this.headerCellTds, (td) => {
      gwUtil.removeClass(td, ["gw-tdDropHighlightRightCell", "gw-tdDropHighlightLeftCell"]);
    });

    const el = this.currentDragContainer;
    if (el) {
      gwUtil.removeClass(el, "gw-sliding");
      el.style.height = null as any;
      el.style.width = null as any;
      el.style.left = null as any;
      el.style.top = null as any;
    }

    if (this.ownerHeaderCell) {
      const headerInner = this.ownerHeaderCell.querySelector(".gw-header--inner");
      if (headerInner) {
        gwUtil.removeClass(headerInner as HTMLDivElement, "gw-sliding");
      }
    }

    if (this.currentDragContainer) {
      gwUtil.removeClass(this.currentDragContainer, "gw-sliding");
    }

    if (this.ownerHeaderCell) {
      gwUtil.removeClass(this.ownerHeaderCell, "gw-sliding");
    }

    this.mouseOffset = null;
    this.mousePos = null;
    this.ownerHeaderCell = null;
    this.currentDragContainer = null;
    this.dragContainerHalfWidth = null;
  }

  dragStart (actionInner: GwDomNode, initialPosition: GwPoint): void {
    const dragId = actionInner.getAttribute("data-gw-drag-id");
    if (!dragId) {
      return;
    }
    this.currentDragContainer = document.getElementById(dragId) as HTMLDivElement;
    if (!this.currentDragContainer) {
      return;
    }

    gwDraggable.enableDragHover(); //Needed so that gwDraggable.ts calls "drag" on an interval, even when the mouse isn't moving
    this.mousePos = initialPosition;
    this.origContainerPos = GwPoint.getElTopLeftVector(actionInner);
    this.mouseOffset = this.origContainerPos.minus(this.mousePos);
    this.ownerHeaderCell = gwUtil.getSelfOrFirstParentWithClass(actionInner, "gw-HeaderCellWidget") as HTMLTableDataCellElement;

    this.processHeaderRow();

    const currentDragContainer = this.getCurrentDragContainerOrThrow();
    const ownerHeaderCell = this.getOwnerHeaderCellOrThrow();

    gwUtil.addClass(currentDragContainer, "gw-sliding");
    gwUtil.addClass(ownerHeaderCell, "gw-sliding");

    const sizerForDrag = ownerHeaderCell;

    currentDragContainer.style.height = sizerForDrag.offsetHeight + "px";
    currentDragContainer.style.width = sizerForDrag.offsetWidth + "px";

    this.dragContainerHalfWidth = sizerForDrag.offsetWidth / 2;

    const headerInner = ownerHeaderCell.querySelector(".gw-header--inner");
    if (headerInner) {
      gwUtil.addClass(headerInner as HTMLDivElement, "gw-sliding");
    }
  }

  dragEnd (): void {
    if (!this.currentDragContainer) {
      return;
    }
    this.possiblyPlaceColumn();
    this.resetAllDragChanges();
  }

  dragCancel (): void {
    if (!this.currentDragContainer) {
      return;
    }
    this.resetAllDragChanges();
  }

  drag (): void {
    if (!this.currentDragContainer) {
      return;
    }

    this.mousePos = gwMouse.position;
    this.moveSliderToMouse();
    this.getIndexForAndHighlightPossibleDrop();
  }
}

export const gwListViewHelper = new GwListViewHelper();
