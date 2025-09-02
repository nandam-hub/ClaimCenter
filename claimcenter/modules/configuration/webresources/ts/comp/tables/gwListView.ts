import {
  GW_BREAKER, GwDomNode, GwDomNodeList, GwEventType, GwKeyboardNavigation,
  GwMap, HTMLCheckboxElement
} from "../../types/gwTypes";
import {gwListViewHelper} from "./gwListViewHelper";
import {gwEvents} from "../../core/events/gwEvents";
import {gwScroll} from "../../core/gwScroll";
import {gwPreferences} from "../../core/gwPreferences";
import {gwFocus} from "../../core/gwFocus";
import {gwUtil} from "../../core/util/gwUtil";
import {GwDraggableSystem} from "../../core/util/GwDraggableSystem";
import {gwNavigation} from "../../core/gwNavigation";
import {gwPrefPanel} from "../../core/gwPrefPanel";
import {gwDraggableColumn} from "./gwDraggableColumn";
import {gwAnimation} from "../../core/gwAnimation";
import {GwPoint} from "../../core/GwPoint";
import {gwInputs} from "../../core/inputs/gwInputs";
import {gwKeys} from "../../core/events/gwKeys";
import {GwKeyListener} from "../../core/events/GwKeyListener";
import {GwEventDescription} from "../../core/events/GwEventDescription";
import {gwFlags} from "../../core/inputs/gwFlags";
import {GwFlagGroup} from "../../core/inputs/GwFlagGroup";
import {gwAria} from "../../core/aria/GwAria";
import {gwCheckboxDiv} from "../inputs/gwCheckboxDiv";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwListView extends GwDraggableSystem implements GwKeyboardNavigation {

  private lastClickedCheckBoxNode: HTMLCheckboxElement | null = null;

  getSystemName (): string {
    return "gwListView";
  }

  private readonly PREFERENCE_TYPE: string = "LISTVIEW";
  private readonly COLUMN_PREFERENCES: string = "COLUMN_PREFERENCES";

  private readonly FIRST_HEADER_CELL_CLASS: string = "gw-first-cell";
  private readonly LAST_HEADER_CELL_CLASS: string = "gw-last-cell";

  init (isFullPageReload: boolean): void {
    this.applyPreferences();
    gwListViewHelper.buildColumnsMenusForAllLVs();
    if (isFullPageReload) {
      gwNavigation.registerNavClasses(["gw-listDetail", "gw-IteratorEntryCheckBoxWidget"], this);
      gwNavigation.registerContextualNavClass("gw-ListViewWidget--table", this);
      this.initializeOnEnterNavigation();
    }
    gwDraggableColumn.init();
  }

  checkBoxChanged (cbNode: GwDomNode, eventDescription: GwEventDescription): void {
    const cbElement = gwFlags.getCheckBox(cbNode);

    if (gwEvents.getShiftkeyPressedDuringLastMouseUp()) {
      if (this.lastClickedCheckBoxNode !== null) {
        this.multiToggleCheckboxNodes(this.lastClickedCheckBoxNode, cbElement);
      }
    }
    this.lastClickedCheckBoxNode = cbElement;
    gwFlags.checkBoxChanged(cbNode);
  }

  private multiToggleCheckboxNodes (startCBElem: HTMLCheckboxElement, endCBElem: HTMLCheckboxElement): void {
    const cbGroup = new GwFlagGroup(endCBElem.dataset.gwFlagsScope);
    const checkboxNames: string[] = cbGroup.checkBoxes.map(cb => cb.name);
    const startIdx = checkboxNames.indexOf(startCBElem.name, 0);
    const endIdx = checkboxNames.indexOf(endCBElem.name, 0);
    if (startIdx < 0 || endIdx < 0) {
      return;
    }

    // Second click determines what value to set
    const targetCheckValue = endCBElem.checked;

    // Toggle the value of all checkboxes between the two indexes (inclusive)
    const lowIdx = startIdx > endIdx ? endIdx : startIdx;
    const highIdx = startIdx > endIdx ? startIdx : endIdx;
    for (let i = lowIdx; i <= highIdx; i++) {
      cbGroup.checkBoxes[i].checked = targetCheckValue;
      gwCheckboxDiv.syncCheckboxDivToCheckboxInput(cbGroup.checkBoxes[i]);
    }
  }

  /**
   * This implementation walks a long pressed row and builds a comma separated text string of its cell contents
   * And adds the string to the clipboard if the browser supports navigator.clipboard.writeText
   * so <tr <td>a</td><td>b</td><td>c</td> becomes a, b, c in the clipboard
   *
   * If the original target is a header cell, then we do the same thing, but for the column.
   *
   * If row is a smart header, we ignore the event.
   * @param {GwDomNode} rowEl
   */
  longpressRow (rowEl: GwDomNode, args: GwMap, e: PointerEvent): void {
    if (gwUtil.hasClass(rowEl, ".gw-isSmartHeader")) {
      return;
    }

    const relatedTarget = e.relatedTarget as GwDomNode;

    if (!relatedTarget) {
      return;
    }

    const clipboard: any = (window.navigator as any).clipboard;

    if (clipboard && clipboard.writeText) {
      const cell = gwUtil.getSelfOrFirstParentWithTag(relatedTarget, "td");
      if (!cell) {
        return;
      }

      if (gwUtil.hasClass(cell, "gw-header")) {
        clipboard.writeText(this.getColumnAsCommaDelimitedString(cell)).catch((ev: Error) => console.error(ev));
      } else {
        clipboard.writeText(this.getRowAsCommaDelimitedString(rowEl)).catch((ev: Error) => console.error(ev));
      }
    }
  }

  getColumnAsCommaDelimitedString (cellEl: HTMLTableCellElement, highlightColumnOnComplete: boolean = true): string {
    const listview = gwUtil.getSelfOrFirstParentWithClassOrThrow(cellEl, "gw-ListViewWidget");

    let cellIndex = 0;
    let currChild: Element | null = cellEl.parentElement!.firstElementChild;
    while (currChild) {
      if (currChild === cellEl) {
        break;
      }

      cellIndex++;
      currChild = currChild.nextElementSibling;
    }

    const column = $(listview).find(`tr:not(.gw-RowGroup):not(.gw-isSmartHeader) td:nth-child(${+cellIndex + 1})`);
    const final = this.convertCellsToCommaDelimitedString(column);
    if (highlightColumnOnComplete) {
      let countdown = 20;
      gwUtil.forEach(column, cell => {
        gwAnimation.addAnimation(cell, "focus");
        if (countdown-- === 0) {
          return GW_BREAKER;
        }

        return;
      });
    }

    return final;
  }

  getRowAsCommaDelimitedString (rowEl: GwDomNode, highlightRowOnComplete: boolean = true): string {
    const final = this.convertCellsToCommaDelimitedString(rowEl.querySelectorAll("td"));

    if (highlightRowOnComplete) {
      gwAnimation.addAnimation(rowEl, "focus");
    }

    return final;
  }

  private convertCellsToCommaDelimitedString (cells: GwDomNodeList): string {
    const cellContent: string[] = [];
    gwUtil.forEach(cells, (td) => {
      const cellText: string[] = [];
      gwUtil.forEach(td.querySelectorAll(".gw-ValueWidget[data-gw-getset]"), (widget) => {
        const val = gwInputs.getValueById(widget);
        if (gwUtil.hasValue(val)) {
          const trimmedVal = (val + "").trim();
          if (trimmedVal.length > 0) {
            cellText.push(trimmedVal);
          }
        }
      });

      // Follow standard CSV rules for surrounding strings with quotes, and escaping content double quotes by adding another double quote in front of them
      cellContent.push(cellText.length === 0 ? "\"\"" : "\"" + cellText.join(" ").replace(/\"/g, "\"\"") + "\"");
    });

    return cellContent.join(",");
  }

  /**
   * @public
   * @param targetGroupRowNode
   */
  toggleRowGroup (targetRowGroupEl: GwDomNode): void {
    $(targetRowGroupEl).toggleClass("gw-RowGroup--expanded")
        .nextUntil("tr.gw-RowGroup, tr:has(td.gw-FooterCellWidget)")
        .toggleClass("gw-hidden");
    gwAria.setAriaPropertyForElement("expanded", targetRowGroupEl.classList.contains("gw-RowGroup--expanded"), targetRowGroupEl);
  }

  /**
   * Handles any commands an LV header cell might fire. Grouping, sorting, etc.
   * @param headerNode
   * @param args
   * @param event
   */
  headerAction (headerNode: GwDomNode, args: GwMap, event?: GwEventType): void {
    const headerInput = $("#gw-util--headers");
    headerInput.attr("name", args.id);
    headerInput.val(args.act);
    gwEvents.methods.fireEvent(headerNode, args, event, () => {
      headerInput.attr("name", "gw-util--headers");
      headerInput.val("");
    });
  }

  /**
   * @public
   * Filters the ListView using the given "opKey", which corresponds to specific Header's
   * filter values
   * @param filterNode
   * @param args
   */
  filter (filterNode: GwDomNode, args: GwMap): void {
    const outer = filterNode.parentElement;
    if (!outer) {
      return;
    }
    const filterEl = gwUtil.getSelfOrFirstParentWithClass(filterNode, "gw-HeaderCellFilterValueWidget");
    if (!filterEl) {
      return;
    }

    const valueNode = gwUtil.getDomNode(".gw-opKey--input", filterEl) as HTMLInputElement;
    if (outer.dataset && gwUtil.hasValue(outer.dataset.gwSelected)) {
      valueNode.value = "";
    } else {
      valueNode.value = args.opKey;
    }
    gwUtil.fireEvent(args.id);
  }

  /**
   * A helper method for triggering the paging event
   */
  page (pageNode: HTMLInputElement, pageArgs: GwMap): void {
    const paging = $("#gw-paging");
    paging.attr("name", pageArgs.renderId);
    // This is a little hacky, but allows using an input widget to set the page value
    if (pageArgs.page === "value") {
      paging.val(pageNode.value);
    } else {
      paging.val(pageArgs.page);
    }
    // Scroll the screen to the top and the left if we are paging the listview
    gwScroll.setScreenScrollTo0(pageNode);
    gwUtil.fireEvent(pageArgs.renderId);
    paging.attr("name", "");
  }

  resetTablePreferences (headerNode: GwDomNode): void {
    const listView = $(headerNode).closest("div.gw-ListViewWidget").get(0);
    if (!listView) {
      return;
    }

    // If one of the columns is grouped, ungroup it before we send the request to reset prefs
    const groupedHeader = gwUtil.getDomNode(".gw-isGrouped", listView);
    const headerInput = $("#gw-util--headers");

    // Set up the info to ungroup the currently grouped header, for when resetPrefs talks to the server
    if (groupedHeader) {
      headerInput.attr("name", groupedHeader.id);
      headerInput.val("GROUP_UNGROUP");
    }

    gwPreferences.resetPreferencesForId(listView.id);

    headerInput.attr("name", "gw-util--headers");
    headerInput.val("");
  }

  /**
   * A helper method for hiding columns on the client side
   */
  private hideColumnByHeaderId (associatedHeaderId: string): void {
    const enclosingTd = this.getHeaderTD(associatedHeaderId);
    if (!enclosingTd) {
      return;
    }

    const colIdx = $(enclosingTd).index();

    const $listViewElement = $(enclosingTd).closest(".gw-ListViewWidget");
    if (!$listViewElement) {
      return;
    }

    const columnToHide = $listViewElement.find("tr:not(.gw-RowGroup) td:nth-child(" + (colIdx + 1) + ")");
    if (columnToHide) {
      gwUtil.addClass(enclosingTd, "gw-isHiddenViaMenu");
      $(columnToHide).hide();
      this.applyColumnClasses($listViewElement[0] as HTMLDivElement);
      this.storeHiddenColumnValueInLVPreferences($listViewElement[0].id, associatedHeaderId, true);
    }
  }

  private getCellAtIndexIncludingColspan (tr: HTMLTableRowElement, index: number): HTMLTableDataCellElement | null {
    let finalTd: HTMLTableDataCellElement | null = null;
    let counter = 0;

    gwUtil.forEach(tr.children, (td: HTMLTableDataCellElement) => {
      if (counter === index) {
        finalTd = td;
        return GW_BREAKER;
      }

      counter = counter + (td.colSpan || 1);
      return;
    });

    return finalTd!;
  }

  sizeColumnByCellId (cellId: string, size: string, minSize: string | null = null, maxSize: string | null = null, storeValue: boolean = false, addSizingClass: boolean = false, resetting: boolean = false): void {
    const td = document.getElementById(cellId);
    if (!td) {
      return;
    }

    const $listViewElement = $(td).closest(".gw-ListViewWidget");
    if (!$listViewElement) {
      return;
    }

    const parentTr = td.parentElement;
    if (!parentTr) {
      return;
    }

    //Figure out index of td by counting including colspans
    //We don't let you drag explicitly in a colspanned td, so we don't have to worry about inclusivity
    let cellIndex = 0;

    gwUtil.forEach(parentTr.children, (siblingTd: HTMLTableDataCellElement) => {
      if (siblingTd === td) {
        return GW_BREAKER;
      }

      cellIndex = cellIndex + (siblingTd.colSpan || 1);
      return;
    });

    const rows = $listViewElement.find("tr:not(.gw-RowGroup)");
    let columnHeaderId = cellId;
    gwUtil.forEach(rows, (row) => {
      const columnCell = this.getCellAtIndexIncludingColspan(row, cellIndex);
      if (columnCell) {
        if (columnCell.hasAttribute("data-gw-cellindex")) {
          columnHeaderId = columnCell.id;
        }

        if (!columnCell.hasAttribute("colspan")) {
          if (addSizingClass) {
            gwUtil.addClass(columnCell, ".gw-resizing");
          } else if (storeValue || resetting) {
            gwUtil.removeClass(columnCell, ".gw-resizing");
          }
          columnCell.style.maxWidth = maxSize === null ? size : maxSize;
          columnCell.style.minWidth = minSize === null ? size : minSize;
          columnCell.style.width = size; //NOTE: this has no real effect, but acts to remove the possible "grow percentage" based width that can cause problems
          const cellInner = columnCell.querySelector(".gw-cell-inner") as HTMLDivElement;
          if (cellInner) {
            cellInner.style.width = size;
          }
        }
      }
    });

    if (storeValue) {
      this.storeSizedColumnValueInLVPreferences($listViewElement[0].id, columnHeaderId, size);
    }
  }

  /**
   * A helper method for showing columns on the client side
   */
  showColumnByHeaderId (associatedHeaderId: string): void {
    const enclosingTd = this.getHeaderTD(associatedHeaderId);
    if (!enclosingTd) {
      return;
    }
    const hiddenColIdx = $(enclosingTd).index(); // 0 based index

    gwUtil.removeClass(enclosingTd, "gw-isHiddenViaMenu");

    const listViewElement = $(enclosingTd).closest(".gw-ListViewWidget")[0] as HTMLDivElement;
    if (!listViewElement) {
      return;
    }
    this.storeHiddenColumnValueInLVPreferences(listViewElement.id, associatedHeaderId);

    // nth child is 1 based idx; hiddenColIdx actually matches the column prior to the hidden col
    const columnToShow = $(listViewElement).find("tr:not(.gw-RowGroup) td:nth-child(" + (hiddenColIdx + 1) + ")");
    $(columnToShow).show();

    this.applyColumnClasses(listViewElement);
  }

  applyPreferences (): void {
    const listViewIds = this.getListViewRenderIds();
    const columnsToHide: string[] = [];
    const columnsToSize: GwMap = {};
    let foundSizedColumns: boolean = false;
    gwUtil.forEach(listViewIds, (listViewId) => {
      const listViewElement = document.getElementById(listViewId);
      if (listViewElement) {
        const columnPreferencesStr = gwPreferences.getPreference(listViewId, this.COLUMN_PREFERENCES);
        if (columnPreferencesStr) {
          const columnPreferences = JSON.parse(columnPreferencesStr);
          Object.getOwnPropertyNames(columnPreferences).forEach((columnId) => {
            if (columnPreferences[columnId].hidden) {
              columnsToHide.push(columnId);
            }
            if (columnPreferences[columnId].size) {
              foundSizedColumns = true;
              columnsToSize[columnId] = columnPreferences[columnId].size;
            }
          });

          // Clear hidden columns, apply ordering, then reapply hidden columns
          if (columnPreferences.ordering) {
            this.resetHiddenColumns(listViewElement);
            this.applyColumnOrdering(listViewElement, columnPreferences.ordering);
          }
          // Hide columns
          columnsToHide.forEach((hideId) => this.hideColumnByHeaderId(hideId));

          // Add Manual sizing back to columns
          if (foundSizedColumns) {
            this.removeStretchFromLV(listViewElement);
            gwUtil.forEach(columnsToSize, (size, sizeId) => this.sizeColumnByCellId(sizeId, size));
          }
        }
      }
    });
  }

  isCellInner (maybeCellInner: GwDomNode): boolean {
    return maybeCellInner.classList.contains("gw-cell-inner");
  }

  processCellInner (cellInner: GwDomNode): void {
    if (GwListView.isEmpty(cellInner)) {
      gwAria.setAriaPropertyForElement("hidden", true, cellInner);
    }
  }

  // TODO Enhancement: I don't like that this is an opt-out system. Ideally, we should default to a cell being non-empty if we don't know for sure.
  //  But there's basically no way to do that here. We could alternatively check server-side, and indeed, that was the first attempt at this.
  //  Unfortunately, that involves a lot of special casing, since different cell contents interpret (and render) emptiness very differently.
  //  The cleanest way would be for all (ValueWidgets? anything that can go into a List View cell) to implement/override a method called "isEmpty".
  //  - zfine
  private static isEmpty (cellInner: GwDomNode): boolean {
    if (cellInner.textContent && cellInner.textContent.length >= 0) {
      return false;
    }

    // If it's got one of these things, it's probably not an empty cell.
    return !cellInner.querySelector(".gw-editable, .gw-actionable, [data-gw-click], .gw-icon");
  }

  /**
   * Called when a column begins dragging, or when an LV has sizes restored to it on page load
   * @param {GwDomNode | null} listViewElement
   */
  removeStretchFromLV (listViewElement: GwDomNode | null): void {
    if (!listViewElement || gwUtil.hasClass(listViewElement, "gw-placeholder")) {
      return;
    }
    const wasStretched = gwUtil.hasClass(listViewElement, ".gw-LV-stretch");
    if (wasStretched) {
      listViewElement.setAttribute("data-gw-old-stretch", "true");
    }

    listViewElement.classList.remove("gw-LV-stretch");

    const lvWrapper: HTMLDivElement | null = (listViewElement.querySelector(".gw-ListViewWidget--table") as HTMLDivElement | null);
    if (!lvWrapper) {
      gwUtil.devlog("removeStretchFromLV: Non placeholder Listview is missing table wrapper.");
      return;
    }

    lvWrapper.setAttribute("data-gw-old-min", lvWrapper.style.minWidth || "");
    lvWrapper.style.minWidth = "0px";
    gwUtil.forEachReverse(gwUtil.getDomNodes(".gw-cell-grow", listViewElement), (growCell) => {
      // Clobber the % grow width and attempt to set the cell at its current width to limit the LV jumping around
      growCell.setAttribute("data-gw-old-grow", growCell.style.width);
      growCell.style.width = growCell.clientWidth + "px";
      gwUtil.removeClass(growCell, ".gw-cell-grow");
    });
  }

  /**
   * Called by gwDraggableColumn if the drag event is cancelled by the user
   * @param {GwDomNode | null} listViewElement
   */
  restoreStretchToLV (listViewElement: GwDomNode | null): void {
    if (!listViewElement || gwUtil.hasClass(listViewElement, "gw-placeholder")) {
      return;
    }

    if (listViewElement.hasAttribute("data-gw-old-stretch")) {
      listViewElement.removeAttribute("data-gw-old-stretch");
      gwUtil.addClass(listViewElement, "gw-LV-stretch");
      const lvWrapper: HTMLDivElement | null = (listViewElement.querySelector(".gw-ListViewWidget--table") as HTMLDivElement | null);
      if (!lvWrapper) {
        gwUtil.devlog("restoreStretchToLV: Non placeholder Listview is missing table wrapper.");
        return;
      }

      lvWrapper.style.minWidth = lvWrapper.getAttribute("data-gw-old-min") || "";
      lvWrapper.removeAttribute("data-gw-old-min");

      gwUtil.forEachReverse(gwUtil.getDomNodesByAttr("data-gw-old-grow", undefined, lvWrapper), (oldGrowCell) => {
        oldGrowCell.style.width = oldGrowCell.getAttribute("data-gw-old-grow") || "";
        oldGrowCell.removeAttribute("data-gw-old-grow");
      });
    }
  }

  storeColumnOrder (listViewElement: GwDomNode): void {
    const ids = this.headerColumnIds(listViewElement);
    if (ids.length > 0) {
      this.storeColumnOrderingInLVPreferences(listViewElement.id, ids);
    }
  }

  moveFocusToTop (childNode: GwDomNode): void {
    const listViewParent = gwUtil.getSelfOrFirstParentWithClass(childNode, "gw-ListViewWidget");
    if (listViewParent) {
        gwFocus.forceFocus(listViewParent);
    }
  }

  toggleColumnVisibility (target: GwDomNode, args: GwMap): void {
    gwUtil.toggleClass(target, "gw-checked");
    if (gwUtil.hasClass(target, "gw-checked")) {
      this.showColumnByHeaderId(args.headerId);
      gwAria.setAriaPropertyForElement("checked", true, target);
    } else {
      this.hideColumnByHeaderId(args.headerId);
      gwAria.setAriaPropertyForElement("checked", false, target);
    }
  }

  toggleGroupedBy (target: GwDomNode, args: GwMap): void {
    gwUtil.toggleClass(target, "gw-grouped");

    // have to do this first to keep consistent state
    gwAria.setAriaPropertyForElement("pressed", gwUtil.hasClass(target, "gw-grouped"), target);

    const header = document.getElementById(args.headerId);
    if (!header) {
      return;
    }

    if (gwUtil.hasClass(target, "gw-grouped")) {
      this.headerAction(header, {id: args.headerId, act: "GROUP_GROUP", suffix: "_act"});
    } else {
      this.headerAction(header, {id: args.headerId, act: "GROUP_UNGROUP", suffix: "_act"});
    }
  }

  // ----- Private helper functions ----- //

  /**
   * Contextual navigation for list views where the ENTER key can be used to navigate
   */
  private initializeOnEnterNavigation (): void {
    for (const navMode of ["cellNavOnEnter", "rowNavOnEnter", "quickAddOnEnter"]) {
      gwKeys.registerContextualKeyListener(
        "gw-ListViewWidget--" + navMode,
        new GwKeyListener("13").withMethodName("gwListView." + navMode)
      );
    }
  }

  private getHeaderTD (headerId: string): HTMLTableDataCellElement | null {
    const headerDiv = $("#" + headerId);
    if (!headerDiv) {
      return null;
    }
    return headerDiv.closest("td")[0] as HTMLTableDataCellElement;
  }

  private resetHiddenColumns (listViewElement: GwDomNode): void {
    const $collapsedColumns = $(listViewElement).find("td.gw-CollapsedCellWidget");
    $collapsedColumns.next().show();
    $collapsedColumns.remove();
  }

  private storeHiddenColumnValueInLVPreferences (listViewId: string, headerId: string, hiddenValue: boolean = false): void {
    const columnPreferences = this.getColumnPreferences(listViewId);

    columnPreferences[headerId] = columnPreferences[headerId] || {};
    columnPreferences[headerId].hidden = hiddenValue;

    gwPreferences.storePreference(
      listViewId, this.COLUMN_PREFERENCES, JSON.stringify(columnPreferences), this.PREFERENCE_TYPE);
  }

  storeSizedColumnValueInLVPreferences (listViewId: string, headerId: string, size: string): void {
    const columnPreferences = this.getColumnPreferences(listViewId);

    columnPreferences[headerId] = columnPreferences[headerId] || {};
    columnPreferences[headerId].size = size;

    gwPreferences.storePreference(listViewId, this.COLUMN_PREFERENCES, JSON.stringify(columnPreferences), this.PREFERENCE_TYPE);
  }

  private storeColumnOrderingInLVPreferences (listViewId: string, columnIdsInOrder: string[]): void {
    const columnPreferences = this.getColumnPreferences(listViewId);

    columnPreferences.ordering = columnIdsInOrder;

    gwPreferences.storePreference(listViewId, this.COLUMN_PREFERENCES, JSON.stringify(columnPreferences), this.PREFERENCE_TYPE);
  }

  private getColumnPreferences (listViewId: string): GwMap {
    const columnPreferencesStr = gwPreferences.getPreference(listViewId, this.COLUMN_PREFERENCES);
    let columnPreferences;
    if (columnPreferencesStr) {
      columnPreferences = JSON.parse(columnPreferencesStr);
    } else {
      columnPreferences = {};
    }
    return columnPreferences;
  }

  private getListViewRenderIds (): string[] {
    const renderIds: string[] = [];
    const listViews = $(".gw-ListViewWidget");
    gwUtil.forEach(listViews, (listViewWidget) => {
      renderIds.push(listViewWidget.id);
    });
    return renderIds;
  }

  private moveColumn (listViewElement: GwDomNode, sourceIndex: number, targetIndex: number): void {
    const $columnToMove = $(listViewElement).find("tr:not(.gw-RowGroup):not([data-gw-ordered]) td:nth-child(" + (sourceIndex + 1) + ")");
    const $targetColumn = $(listViewElement).find("tr:not(.gw-RowGroup):not([data-gw-ordered]) td:nth-child(" + (targetIndex + 1) + ")");
    $columnToMove.each((idx, element) => {
      const cell = $targetColumn.get(idx);
      if (cell) {
        $(element).insertBefore(cell);
      }
    });
  }

  getFirstValueWidgetInCell (td: HTMLTableDataCellElement): GwDomNode | null {
    return td.querySelector(".gw-cell-inner .gw-ValueWidget");
  }

  private headerCells (listViewElement: GwDomNode): GwDomNode[] {
    return Array.prototype.slice.call(listViewElement.querySelectorAll("[data-gw-cellindex]"));
  }

  private headerValueWidgets (listViewElement: GwDomNode): GwDomNode[] {
    const headerCells = this.headerCells(listViewElement);
    const valueWidgets: GwDomNode[] = [];
    gwUtil.forEach(headerCells, (cell) => {
      const valueWidget = this.getFirstValueWidgetInCell(cell);
      if (valueWidget) {
        valueWidgets.push(valueWidget);
      }
    });
    return valueWidgets;
  }

  private headerColumnIds (listViewElement: GwDomNode): string[] {
    return this.headerValueWidgets(listViewElement).map((el) => {
      return el.id;
    });
  }

  private headerColumnIdsInRenderOrder (listViewElement: GwDomNode): string[] {
    const cells = this.headerCells(listViewElement);
    const ids: string[] = [];
    gwUtil.forEach(cells, (cell) => {
      const valueWidget = this.getFirstValueWidgetInCell(cell);
      if (valueWidget !== null) {
        const cellIndex = parseInt(cell.dataset.gwCellindex);
        ids[cellIndex] = valueWidget.id;
      }
    });
    return ids;
  }

  applyColumnClasses (listViewElement: GwDomNode): void {
    this.refreshHeaderCellWithTargetClass(listViewElement, this.FIRST_HEADER_CELL_CLASS, "first");
    this.refreshHeaderCellWithTargetClass(listViewElement, this.LAST_HEADER_CELL_CLASS, "last");
  }

  private refreshHeaderCellWithTargetClass (listViewElement: GwDomNode, targetClass: string, firstOrLast: string): void {
    const prevHeaderCellWithTargetClass = $(listViewElement).find("tr:first").find("td." + targetClass);
    prevHeaderCellWithTargetClass.removeClass(targetClass);
    const newHeaderCellWithTargetClass = $(listViewElement).find("tr:first").find("td.gw-HeaderCellWidget")
      .filter(":not([class^=\"gw-impl-cell\"]):visible:" + firstOrLast);
    newHeaderCellWithTargetClass.addClass(targetClass);
  }

  private applyColumnOrdering (listViewElement: GwDomNode, columnOrdering: string[]): void {
    if (columnOrdering) {
      let targetIndex = 0;
      const columnIdsInCellOrder = this.headerColumnIdsInRenderOrder(listViewElement);
      columnOrdering.forEach((columnId) => {
        const sourceIndex = columnIdsInCellOrder.indexOf(columnId);
        if (sourceIndex >= 0) {
          // Source index can never be less than target index as everything less than target index is
          // already ordered
          if (sourceIndex > targetIndex) {
            // Keep columnIdsInCellOrder array in sync with actual cells being moved around
            columnIdsInCellOrder.splice(targetIndex, 0, columnIdsInCellOrder.splice(sourceIndex, 1)[0]);
            this.moveColumn(listViewElement, sourceIndex, targetIndex);
          }
          targetIndex++;
        }
      });
      this.applyColumnClasses(listViewElement);
      this.markColumnsAsOrdered(listViewElement);
    }
  }

  markColumnsAsOrdered (listViewElement: GwDomNode): void {
    $(listViewElement).find("tr:not(.gw-RowGroup)").attr("data-gw-ordered", "true");
  }

  /**
   * @public
   * Handles an "Alt-Shift-Left" shortcut while in the context of an LV
   * @param node the node that received the shortcut
   * @param info the method info
   * @param event the event
   */
  left (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    // Select iterator checkbox if this is a listDetail row and the checkbox is present
    if (gwUtil.hasClass(node, "gw-listDetail")) {
      const possibleCheckboxChild = node.querySelector(".gw-IteratorEntryCheckBoxWidget");
      gwFocus.forceFocusIgnoreIfNull(possibleCheckboxChild as GwDomNode);
      return true;
    }

    if (gwUtil.hasClass(node, ".gw-IteratorEntryCheckBoxWidget")) {
      // Let this fall through and behave like standard LV navigation
    }

    let nextFocusable: Element | null = null;
    let safety = 100;

    const goLeftUntilEnd = ($currCell: JQuery) => {
      let $lastKnownGoodCell = $currCell;
      while ($currCell.length > 0) {
        $lastKnownGoodCell = $currCell;
        safety--;
        if (safety <= 0) {
          break;
        }

        if (gwFocus.isFocusable($currCell[0])) {
          nextFocusable = $currCell[0];
          break;
        }

        $currCell = $currCell.prev("td");
      }

      if (!nextFocusable) {
        stepUpARow($lastKnownGoodCell);
      }
    };

    const stepUpARow = ($currCell: JQuery) => {
      safety--;
      if (safety <= 0) {
        return;
      }

      const $prevRow = $currCell.closest("tr").prev("tr");
      if ($prevRow.length > 0) {
        goLeftUntilEnd($prevRow.children("td").last());
      }
    };

    const $startCell = $(node).closest("td");
    const $prevCell = $startCell.prev("td");

    if ($prevCell.length > 0) {
      goLeftUntilEnd($prevCell);
    } else {
      stepUpARow($startCell);
    }

    if (nextFocusable) {
      gwFocus.forceFocus(nextFocusable as HTMLElement, false);
    }

    return true;
  }

  cellNavOnEnter (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    return this.right(node, info, event, true);
  }

  rowNavOnEnter (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    return this.down(node, info, event);
  }

  quickAddOnEnter (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    const initialFocus = gwFocus.getCurrentFocus();
    this.right(node, info, event, true);
    if (initialFocus === gwFocus.getCurrentFocus()) {
      // Unable to find a new place to go; add row
      const listView = gwUtil.getSelfOrFirstParentWithClass(node, "gw-ListViewWidget--quickAddOnEnter");
      if (listView && listView.id) {
        gwUtil.fireEvent(listView.id + "_quickAdd");
      }
    }
    return true;
  }

  /**
   * @public
   * Handles an "Alt-Shift-Right" shortcut while in the context of an LV
   * @param node the node that received the shortcut
   * @param info the method info
   * @param event the event
   * @param navigatingOnEnter if this flag is set then avoid iterator check boxes and move down
   *                          a row when get to a cell marked "end of cell nav"
   */
  right (node: GwDomNode, info: GwMap, event: GwEventType, navigatingOnEnter: boolean = false): boolean {
    // If this is an iterator checkbox, and its inside of a ListDetailView row, then move to the row
    if (gwUtil.hasClass(node, ".gw-IteratorEntryCheckBoxWidget")) {
      const parentListDetailRow = gwUtil.getSelfOrFirstParentWithClass(node, "gw-listDetail");
      if (parentListDetailRow) {
        this.moveToAndPossiblySelectListDetailRow(parentListDetailRow as HTMLTableRowElement);
        return true;
      }
    }

    let nextFocusable: Element | null = null;
    let safety = 100;

    const goRightUntilEnd = ($currCell: JQuery) => {
      let $lastKnownGoodCell = $currCell;

      while ($currCell.length > 0) {
        $lastKnownGoodCell = $currCell;
        safety--;
        if (safety <= 0) {
          break;
        }

        if (gwFocus.isFocusable($currCell[0]) && !(navigatingOnEnter && this.isIteratorCheckBoxCell($currCell[0]))) {
          nextFocusable = $currCell[0];
          break;
        }

        $currCell = $currCell.next("td");
      }

      if (!nextFocusable) {
        stepDownARow($lastKnownGoodCell);
      }
    };

    const stepDownARow = ($currCell: JQuery) => {
      safety--;
      if (safety <= 0) {
        return;
      }

      const $nextRow = $currCell.closest("tr").next("tr");
      if ($nextRow.length > 0) {
        goRightUntilEnd($nextRow.children("td").first());
      }
    };

    const $startCell = $(node).closest("td");

    if (navigatingOnEnter && $startCell.is("[data-gw-endcellnav]")) {
      stepDownARow($startCell);
    } else {
      const $nextCell = $startCell.next("td");

      if ($nextCell.length > 0) {
        goRightUntilEnd($nextCell);
      } else {
        stepDownARow($startCell);
      }
    }

    if (nextFocusable) {
      gwFocus.forceFocus(nextFocusable as HTMLElement, false);
    }

    return true;
  }

  /**
   * @public
   * Handles an "Alt-Shift-Up" shortcut while in the context of an LV
   * @param node the node that received the shortcut
   * @param info the method info
   * @param event the event
   */
  up (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    if (gwUtil.hasClass(node, "gw-listDetail")) {
      this.moveUpInListDetail(node as HTMLTableRowElement);
      return true;
    }
    if (gwUtil.hasClass(node, "gw-rowselect-radio")) {
      this.moveUpInListDetail(gwUtil.getSelfOrFirstParentWithClass(node, "gw-listDetailBodyRow") as HTMLTableRowElement);
      return true;
    }

    let nextFocusable: Element | null = null;
    let $currRow = $(node).closest("tr").prev("tr");
    const index = $(node).closest("td").index();

    let safety = 100;
    while ($currRow.length > 0) {
      safety--;
      if (safety <= 0) {
        break;
      }

      const testCell = $currRow.children()[index];
      if (gwFocus.isFocusable(testCell)) {
        nextFocusable = testCell;
        break;
      }

      $currRow = $currRow.prev("tr");
    }

    if (nextFocusable) {
      gwFocus.forceFocus(nextFocusable as HTMLElement, false);
    }

    return true;
  }

  /**
   * @public
   * Handles an "Alt-Shift-Down" shortcut while in the context of an LV
   * @param node the node that received the shortcut
   * @param info the method info
   * @param event the event
   */
  down (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    if (gwUtil.hasClass(node, "gw-listDetail")) {
      this.moveDownInListDetail(node as HTMLTableRowElement);
      return true;
    }
    if (gwUtil.hasClass(node, "gw-rowselect-radio")) {
      this.moveDownInListDetail(gwUtil.getSelfOrFirstParentWithClass(node, "gw-listDetailBodyRow") as HTMLTableRowElement);
      return true;
    }

    let nextFocusable: Element | null = null;
    let $currRow = $(node).closest("tr").next("tr");
    const index = $(node).closest("td").index();

    let safety = 100;
    while ($currRow.length > 0) {
      safety--;
      if (safety <= 0) {
        break;
      }

      const testCell = $currRow.children()[index];
      if (gwFocus.isFocusable(testCell)) {
        nextFocusable = testCell;
        break;
      }

      $currRow = $currRow.next("tr");
    }

    if (nextFocusable) {
      gwFocus.forceFocus(nextFocusable as HTMLElement, false);
    }

    return true;
  }

  private isIteratorCheckBoxCell (node: GwDomNode): boolean {
    return gwUtil.hasClass(node, ".gw-impl-cell--CB");
  }

  private moveDownInListDetail (row: HTMLTableRowElement): void {
    this.moveToAndPossiblySelectListDetailRow($(row).next("tr.gw-listDetailBodyRow")[0] as HTMLTableRowElement);
  }

  private moveUpInListDetail (row: HTMLTableRowElement): void {
    this.moveToAndPossiblySelectListDetailRow($(row).prev("tr.gw-listDetailBodyRow")[0] as HTMLTableRowElement);
  }

  private moveToAndPossiblySelectListDetailRow (row: HTMLTableRowElement): void {
    if (!row) {
      return;
    }

    let el: GwDomNode = row;

    // if we're using radio buttons instead of the table rows themselves, then we need to find and (maybe) activate it
    if (gwPrefPanel.getPrefValueByPrefName("useListDetailViewRowSelectionButtons")) {
      el = row.querySelector(".gw-rowselect-radio") as GwDomNode;
    }

    if (gwPrefPanel.getPrefValueByPrefName("keyboardNavSelectsListDetail")) {
      gwEvents.forceGlobalClickEvent(el);
    }

    gwFocus.forceFocus(el);
  }

  /**
   * Called by gwDraggable.ts
   */
  dragStart (actionInner: GwDomNode, initialPosition: GwPoint): void {
    gwListViewHelper.dragStart(actionInner, initialPosition);
  }

  /**
   * Called by gwDraggable.ts
   */
  dragEnd (): void {
    gwListViewHelper.dragEnd();
  }

  /**
   * Called by gwDraggable.ts
   */
  dragCancel (): void {
    gwListViewHelper.dragCancel();
  }

  /**
   * Called by gwDraggable.ts
   */
  drag (): void {
    gwListViewHelper.drag();
  }
}

export const gwListView = new GwListView();
