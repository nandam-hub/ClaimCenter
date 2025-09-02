import {GwDomNode, GwEventType, GwKeyboardNavigation, GwMap, GwPartialReloadDetails} from "../../types/gwTypes";
import {GwInitializableSystem} from "../../core/util/GwInitializableSystem";
import {gwNavigation} from "../../core/gwNavigation";
import {gwUtil} from "../../core/util/gwUtil";
import {gwTooltips} from "../../core/gwTooltips";
import {gwDisplayKey} from "../../core/gwDisplayKey";
import {gwListView} from "./gwListView";
import {gwFocus} from "../../core/gwFocus";
import {gwAria} from "../../core/aria/GwAria";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * Builds the show/hide and group/ungroup menu items in the special list view column menu. Also contains the code
 * for keyboard navigation within these menu items. The navigation code relies on the structure of the menu items
 * so any change to how the menu items are built will probably require corresponding changes to the navigation code.
 */
export class GwListViewColumnMenu extends GwInitializableSystem implements GwKeyboardNavigation {

  private readonly CUSTOM_MENU_ITEM_CLASS: string = "gw-columns-menu--clientMenuItem";
  private readonly VISIBILITY_TOGGLE_CLASS: string = "gw-toggle-column-visibility";
  private readonly GROUPING_TOGGLE_CLASS: string = "gw-toggle-column-grouping";

  getSystemName (): string {
    return "gwListViewColumnMenu";
  }

  init (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    if (isFullPageReload) {
      gwNavigation.registerNavClasses([this.VISIBILITY_TOGGLE_CLASS, this.GROUPING_TOGGLE_CLASS], gwListViewColumnMenu);
    }
  }

  addColumnMenuItems (listview: GwDomNode, headerRow: HTMLTableRowElement, columnsButton: GwDomNode): boolean {
    const subMenu = columnsButton.querySelector(".gw-subMenu");
    if (!subMenu) {
      return false;
    }

    const tds = headerRow.querySelectorAll("td");
    let menuNeeded = false;

    $(subMenu).find(".gw-client-only-item").remove();

    gwUtil.forEach(tds, (td) => {
      const headerInner = td.querySelector(".gw-header--inner");

      if (headerInner) {
        //NOTE: these first two are not being used yet, but we are going to need them when UX decides where to put filtering.
        //const isSortable = td.querySelector(".gw-sortable");
        //const isFilterable = td.querySelector(".gw-filterable");
        const isHideable = td.querySelector(".gw-hideable");
        const isGroupable = td.querySelector(".gw-groupable");
        const isDraggable = td.querySelector(".gw-draggable");

        // Menu obviously needed if hideable/groupable; but also needed if draggable so can reset positions
        if (isHideable || isGroupable || isDraggable) {
          menuNeeded = true;
        }

        // If either is true, then we'll add a menu item for the header
        if (isHideable || isGroupable) {
          const menuItemId = td.id + "_columns_menu";
          const header = gwListView.getFirstValueWidgetInCell(td);
          if (!header) {
            return;
          }
          const headerId = header.id;
          const menuItem = gwUtil.createDiv([this.CUSTOM_MENU_ITEM_CLASS, "gw-client-only-item"], {id: menuItemId});

          let label;
          const ariaLabelHolder = headerInner.querySelector("[aria-label]:not([aria-label=''])");
          if (ariaLabelHolder) {
            // potential future enhancement: also support migrating aria-labelledby, aria-describedby properties to visibility / group by toggles
            label = ariaLabelHolder.getAttribute("aria-label");
          } else if (headerInner.textContent && headerInner.textContent.length > 0) {
            label = headerInner.textContent;
          } else {
            const idx = parseInt(td.getAttribute("data-gw-cellindex"));
            label = idx >= 0 ? gwDisplayKey.get("Web.Client.ListView.Column.EmptyHeaderColumnNumber", idx + 1) : "";
          }

          // 1. If hideable add the hide toggle
          if (isHideable) {
            const isHidden = gwUtil.hasClass(td, "gw-isHiddenViaMenu");
            const visibilityToggle = gwUtil.createDiv(
              [this.VISIBILITY_TOGGLE_CLASS, isHidden ? "" : "gw-checked"],
              {"data-gw-click": "gwListView.toggleColumnVisibility headerId:" + td.id}
            );
            gwAria.addRoleAttributeToElement("checkbox", visibilityToggle);
            gwAria.addAriaPropertyToElement("checked", !isHidden, visibilityToggle);
            gwAria.addAriaPropertyToElement("label", gwDisplayKey.get("Web.Client.ListView.Column.ToggleCheckboxAriaLabel", label), visibilityToggle);
            gwTooltips.addTooltip(visibilityToggle, gwDisplayKey.get("Web.Client.ListView.Column.ToggleHidden", headerInner.id));

            menuItem.appendChild(visibilityToggle);
          }

          // 2. Copy the entire contents of the header inner into the menu, icons and labels and bears oh my
          const clonedHeaderInner = headerInner.cloneNode(true);
          clonedHeaderInner.removeAttribute("id");
          clonedHeaderInner.classList.add("gw-columns-menu-item-label");
          const clonedInnerLabel = clonedHeaderInner.querySelector(".gw-label");
          if (!clonedHeaderInner.textContent && !clonedHeaderInner.querySelector(".gw-icon")) {
            if (clonedInnerLabel) {
              clonedInnerLabel.textContent = label;
            } else {
              const newInnerLabel = gwUtil.createDiv("gw-label");
              newInnerLabel.textContent = label;
              clonedHeaderInner.appendChild(newInnerLabel);
            }
          }
          menuItem.appendChild(clonedHeaderInner);

          // 3. If groupable, add the group toggle
          if (isGroupable) {
            const isGrouped = !!td.querySelector(".gw-isGrouped");
            if (isGrouped) {
              this.modifyGroupRowLabels(td, listview);
            }

            const groupToggle = gwUtil.createDiv(
              [this.GROUPING_TOGGLE_CLASS, isGrouped ? "gw-grouped" : ""],
              {
                "data-gw-click": "gwListView.toggleGroupedBy headerId:" + headerId,
                "data-gw-tooltip": gwDisplayKey.get("Web.Client.ListView.Column.ToggleGroup")
              }
            );

            gwAria.addRoleAttributeToElement("button", groupToggle);
            gwAria.addAriaPropertyToElement("pressed", isGrouped, groupToggle);
            gwAria.addAriaPropertyToElement("label", gwDisplayKey.get("Web.Client.ListView.Column.GroupingButtonAriaLabel", label), groupToggle);

            gwTooltips.addTooltip(groupToggle, gwDisplayKey.get("Web.Client.ListView.Column.ToggleGroup"));

            menuItem.appendChild(groupToggle);
          }

          subMenu.appendChild(menuItem);
        }
      }
    });

    return menuNeeded;
  }

  /**
   * Amends the currently grouped header cell label to the beginning of each of the group row labels.
   * @param groupedTd
   * @param listview
   */
  private modifyGroupRowLabels (groupedTd: HTMLTableDataCellElement, listview: GwDomNode): void {
    if (!groupedTd || !listview) {
      return;
    }
    const labelEl = groupedTd.querySelector(".gw-label");
    if (!labelEl) {
      return;
    }
    let prefix = labelEl.textContent || "_";
    prefix += ":";

    gwUtil.forEach(listview.querySelectorAll(".gw-RowGroup--label"), (groupLabelEl: HTMLDivElement) => {
      const colNameElement = groupLabelEl.querySelector(".gw-RowGroup--label--col-name");
      if (!colNameElement) {
        const newColNameElement = document.createElement("div");
        newColNameElement.classList.add("gw-RowGroup--label--col-name");
        newColNameElement.textContent = prefix;

        const rightHandSideText = document.createTextNode(groupLabelEl.textContent || "");
        gwUtil.clearInnerHTML(groupLabelEl);

        groupLabelEl.appendChild(newColNameElement);
        groupLabelEl.appendChild(rightHandSideText);
      }
    });
  }

  up (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    const previousItem = node.parentElement!.previousElementSibling;
    if (previousItem !== null) {
      this.focusOnMatchingToggle(previousItem as GwDomNode, node);
      return true;
    }

    return false;
  }

  down (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    const nextItem = node.parentElement!.nextElementSibling;
    if (nextItem != null) {
      this.focusOnMatchingToggle(nextItem as GwDomNode, node);
      return true;
    }
    return false;
  }

  left (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    this.switchBetweenToggles(node, this.GROUPING_TOGGLE_CLASS);
    return true;
  }

  right (node: GwDomNode, info: GwMap, event: GwEventType): boolean {
    this.switchBetweenToggles(node, this.VISIBILITY_TOGGLE_CLASS);
    return true;
  }

  private switchBetweenToggles (toggle: GwDomNode, startingToggleClass: string): void {
    if (this.toggleClass(toggle) === startingToggleClass) {
      const otherToggle = toggle.parentElement!.querySelector("." + this.otherToggleClass(toggle));
      if (otherToggle !== null) {
        gwFocus.forceFocus(otherToggle as GwDomNode);
      }
    }
  }

  private focusOnMatchingToggle (menuItem: GwDomNode, toggle: GwDomNode): void {
    if (gwUtil.hasClass(menuItem, this.CUSTOM_MENU_ITEM_CLASS)) {
      // Try to go to the same toggle in this menu item, but if it's not present back off to the other toggle
      for (const className of [this.toggleClass(toggle), this.otherToggleClass(toggle)]) {
        const otherToggle = menuItem.querySelector("." + className);
        if (otherToggle !== null) {
          gwFocus.forceFocus(otherToggle as GwDomNode);
          break;
        }
      }
    } else {
      // Not one of our custom menu items; let forceFocus figure out first focusable item
      gwFocus.forceFocus(menuItem);
    }
  }

  private otherToggleClass (toggle: GwDomNode): string {
    return this.toggleClass(toggle) === this.GROUPING_TOGGLE_CLASS
      ? this.VISIBILITY_TOGGLE_CLASS : this.GROUPING_TOGGLE_CLASS;
  }

  private toggleClass (toggle: GwDomNode): string {
    return gwUtil.hasClass(toggle, this.GROUPING_TOGGLE_CLASS)
      ? this.GROUPING_TOGGLE_CLASS : this.VISIBILITY_TOGGLE_CLASS;
  }

}

export const gwListViewColumnMenu = new GwListViewColumnMenu();
