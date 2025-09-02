/**
 * Handler of all "dropdown" menu systems. All objects involved in menus are MenuItemWidgets, but are differentiated
 * based on a number of factors: parent container, whether it's in a submenu or is a top level menu.
 * Dropdown menus can be on stand alone buttons, in toolbars, in header cells, navigation tabs, left navigation, etc.
 * The one thing they have in common is their structure:
 *
 *      <div class="gw-action--outer"> // Handles any mouseenter, mouseleave, focus, or blur
 *          <div class="gw-action--inner">LABEL</div> fires the primary action if any when clicked
 *          <div class="gw-action--expand-button">ICON</div> toggles the subMenu when clicked
 *          <div class="gw-subMenu">
 *              ...children
 *          </div>
 *      </div>
 *
 * Note: One oddity: calling openSubMenu only registers the subMenu to be opened. We have to call "closeAllMenus" at various
 * points in the event chain. So only after closing all menus, do we then call make makeMenuVisibleInDom on the stored subMenu,
 * which then makes it and all of it's ancestor menus visible.
 *
 * See menus.scss for SASS mixins.
 * @type {{}}
 */
import {
  GW_BREAKER, GwClassIdTagOrNode, GwDomNode, GwMap, GwEventType, GwKeyboardNavigation
} from "../types/gwTypes";
import {gwNavigation} from "./gwNavigation";
import {gwUtil} from "./util/gwUtil";
import {gwFocus} from "./gwFocus";
import {GwInitializableSystem} from "./util/GwInitializableSystem";
import {gwAria} from "./aria/GwAria";
import {gwDisplayKey} from "./gwDisplayKey";
import {gwResizer} from "./gwResizer";
import {gwPrefPanel} from "./gwPrefPanel";

const enum GwMenusDirection {
  up = "Up",
  down = "Down"
}

export class GwMenus extends GwInitializableSystem implements GwKeyboardNavigation {
  getSystemName (): string {
    return "gwMenus";
  }

  private menuVerticalScrollAmount: string = "";

  /**
   * id and element
   * if a menu is toggled open, it needs to register itself so the mouse event doesn't close it as part of closing all the menus
   * @type {{}}
   */
  private storedMenuToOpenAfterClosingOthers: GwMap = {};

  /**
   * map of id:el
   * @type {{[id]:[el]}}
   */
  private currentlyOpenMenus: GwMap = {};

  /**
   * Store the groupname of the currently open top level menu group
   * @type {string}
   */
  private topLevelGroupMenuOpen: string = "";

  init (isFullPageReload: boolean): void {
    if (isFullPageReload) {
      gwNavigation.registerNavClasses(["gw-action--outer", "gw-action--inner", "gw-action--expand-button"], gwMenus);
    }

    this.convertScreenToolbarButtonsToMenuItemsIfNeeded();
  }

  // Menu boundaries
  private getBoundaries (): GwMap {
    return {
      top: 0,
      bottom: window.innerHeight,
      left: 0,
      right: window.innerWidth
    };
  }

  /**
   * @private
   * Returns the first node, including the node itself, that is gw-action--outer with .gw-hasChildren.
   *
   * Has a safety check depth of 10. This means that if you actually have a focusable element 10 layers deep
   * inside of the outer, then it won't get there.
   * @param node - DOM Element
   * @param nullIfFoundActionButNoChildren - if true will return null when a gw-action--outer is found with no children,
   * otherwise the closest .gw-action--outer with children will be returned.
   * @returns {DOM Elmement or null}
   */
  private getSelfOrFirstParentActionOptionallyWithChildren (node: GwDomNode | null, nullIfFoundActionButNoChildren: boolean = false): GwDomNode | null {
    let safety = 10;
    let testNode: GwDomNode | null = node;
    while (testNode && (safety-- > 0)) {
      if (gwUtil.hasClass(testNode, "gw-action--outer")) {
        if (gwUtil.hasClass(testNode, "gw-hasChildren")) {
          return testNode;
        }
        if (nullIfFoundActionButNoChildren) {
          return null;
        }

      }
      testNode = testNode.parentElement;
    }
    return null;
  }

  /**
   * Should only be called by the global mouseenter event.
   * If this method was triggered by a browser attempting to be "helpful" and calling mouseover when you touch down, then this becomes a noop
   * @param node
   * @returns {boolean} true if a menu is opened as a result of this mouseenter event, false otherwise
   */
  openSubMenuMouseEnter (node: GwDomNode): boolean {
    // if (gwEvents.isCurrentlyInTouchEvent()) {
    //   return false;
    // }

    const menuNode = this.getEnteredMenuNode(node);
    return menuNode != null && this.openSubMenu(menuNode, "mouseenter");
  }

  private getEnteredMenuNode (node: GwDomNode): GwDomNode | null {
    if (node.hasAttribute("data-gw-menu-hover")) {
      return node;
    }
    // Handle unfortunate case where a menu has a tooltip, in which case the "action inner" div grabs the mouseenter
    if (gwUtil.hasClass(node, "gw-action--inner")) {
      const parent = node.parentElement;
      if (parent != null && parent.hasAttribute("data-gw-menu-hover") && !gwUtil.isDisabled(parent)) {
        return parent;
      }
    }
    return null;
  }

  private isSubMenusBelow (menuElement: GwDomNode): boolean {
    return gwUtil.hasClass(menuElement, "gw-putSubMenusBelow");
  }

  ensureFocusedItemIsVisibleIfInHiddenSubmenu (el: GwDomNode): void {
    if (!el || !el.parentElement) {
      return;
    }

    const isInSubmenu = $(el).parents(".gw-subMenu")[0];
    if (isInSubmenu) {
      const possibleParent = $(el.parentElement).parents(".gw-hasChildren")[0];
      if (possibleParent) {
        this.makeMenuVisibleInDom(possibleParent);
      }
    }
  }

  focusChangedViaTabPossiblyCloseAbandonedMenus (el: GwDomNode): void {
    if (!el || !el.parentElement) {
      return;
    }

    this.closeAllMenus(false);
    const isInSubmenu = $(el).parents(".gw-subMenu")[0];
    if (isInSubmenu) {
      // Skip self (gw-action--outer) in the parents lookup, since the focus won't be on the outer
      const possibleParent = $(el.parentElement).parents(".gw-hasChildren")[0];
      if (possibleParent) {
        this.makeMenuVisibleInDom(possibleParent);
      }
    }
  }

  convertScreenToolbarButtonsToMenuItemsIfNeeded (): void {
    if (gwPrefPanel.getTopNavCollapseLevel() !== "all") {
      return;
    }

    const toolbarOverflow = gwUtil.getDomNode("#gw-TabBarWidget--toolbarOverflow");
    if (!toolbarOverflow) {
      return;
    }

    const subMenu = gwUtil.getDomNode(".gw-subMenu", toolbarOverflow);
    if (!subMenu) {
      return;
    }

    Array.prototype.forEach.call(subMenu.children, (child: HTMLElement) => {
      if (gwUtil.hasClass(child, "gw-ToolbarButtonWidget")) {
        gwUtil.removeClass(child, ["gw-putSubMenusBelow", "gw-isTopLevelMenu"]);

        child.setAttribute("data-gw-menu-hover", "");
        child.setAttribute("data-gw-mouse-enter", "gwMouse.enter");
      }
    });

  }

  /**
   * @private
   * Takes a DOM element and makes it's subMenu visible, then walks up the dom and makes any ancestor menus visible as well.
   * - if gw-putSubMenusBelow class is present, then moves the subMenu to render like a top NavBar would
   * - otherwise it renders like a subMenu would, to the right of the menu item, top aligned.
   * - finds the first child element with gw-subMenu, and adds the class gw-open to it.
   * - It then runs logic to determine if the subMenu would be off the screen, and if it is, aligns it to the otherside of that axis
   * - Looks for a parent menu, and makes a recursive call passing the parent as an argument.
   * @param el
   * @returns {null}
   */
  private makeMenuVisibleInDom (el: GwDomNode): void {
    let subMenusBelow = this.isSubMenusBelow(el);
    const subMenu: GwDomNode = el.querySelector(".gw-subMenu") as GwDomNode;
    if (!subMenu) {
      return;
    }

    const staticMenus = gwUtil.hasClass(el, "gw-staticMenus");

    gwUtil.addClass(el, "gw-hasOpenSubMenu");
    gwUtil.addClass(subMenu, "gw-open");
    gwAria.setAriaPropertyForElement("hidden", false, subMenu);

    const menuitem: GwDomNode = el.querySelector(".gw-action--inner") as GwDomNode;
    gwAria.setAriaPropertyForElement("expanded", true, menuitem);

    // If menus are set to display: none when hidden, then querying their bounds in the current frame
    // returns null results. So we push the query into the next animation frame, which will have the correct values
    // and also serve to batch some of the multiple calls.
    window.requestAnimationFrame(() => {
      if (!staticMenus) {
        this.resetHiddenMenus(subMenu);

        const parentRect = el.getBoundingClientRect();

        // subMenu may be modified within the current animation frame; this means the height of the boundClientRect
        // may be reset to 0.  Manually calculate height of the menu.
        const subMenuHeight = this.getSubMenuHeight(subMenu);
        const subMenuWidth = this.getSubMenuWidth(subMenu);
        const boundaries = this.getBoundaries();

        // -- Handle menu location east and west -- //
        let subMenuLeftEdge = 0;
        if (parentRect.right + subMenuWidth > boundaries.right) {
          if (subMenusBelow) {
            subMenuLeftEdge = parentRect.right - subMenuWidth;
          } else {
            subMenuLeftEdge = parentRect.left - subMenuWidth;
          }
        } else {
          if (subMenusBelow) {
            subMenuLeftEdge = parentRect.left;
          } else {
            subMenuLeftEdge = parentRect.right;
          }
        }

        // Handle case where left edge of menu is offscreen to the left by shifting it to the left edge of the window
        subMenuLeftEdge = Math.max(subMenuLeftEdge, 0);

        // If it's not already being rendering below and it overlaps the parent menu, shift it down (so the parent menu
        // is visible)
        if (!subMenusBelow && (subMenuLeftEdge < parentRect.right) && (subMenuLeftEdge + subMenuWidth > parentRect.left)) {
          subMenusBelow = true;
        }
        subMenu.style.left = subMenuLeftEdge + "px";

        if (subMenuHeight > (boundaries.bottom - boundaries.top)) {
          this.buildScrollingMenu(subMenu, boundaries, subMenu.style.left);
        } else {
          this.resetMenuArrows(subMenu);
          this.buildNonScrollingMenu(subMenu, boundaries, subMenuHeight, subMenusBelow, parentRect);
        }
      }
    });

    if (!staticMenus) {
      this.currentlyOpenMenus[el.id] = el;
      if (gwUtil.hasClass(el, "gw-isTopLevelMenu")) {
        this.topLevelGroupMenuOpen = this.getMenuGroup(el);
        return;
      }
      const possibleParent = $(el).parents(".gw-hasChildren")[0];
      if (possibleParent) {
        this.makeMenuVisibleInDom(possibleParent);
      }
    }
  }

  private isMultiColumnMenu (menu: GwDomNode): boolean {
    return gwUtil.hasClass(menu.firstElementChild as GwDomNode, "gw-menu-col");
  }

  private getSubMenuWidth (subMenu: GwDomNode): number {
    let subMenuWidth = 0;

    // Using .clientWidth or .offsetWidth fluctuates in value by 1 pixel in Chrome in Windows
    // under certain cases (e.g. - in PX for AF menus when AF located in hamburger menu happens to be in
    // the right place at the right width for this to manifest as the menu alternating rendering from left
    // to right)
    // getBoundingClientRect does not seem to have the same issue.
    if (subMenu.children && subMenu.children.length > 0) {
      if (this.isMultiColumnMenu(subMenu)) {
        gwUtil.forEach(subMenu.children, (subMenuColumn) => {
          subMenuWidth = subMenuWidth + Math.ceil(subMenuColumn.getBoundingClientRect().width);
        });
      } else {
        subMenuWidth = Math.ceil(subMenu.getBoundingClientRect().width);
      }
    }

    return subMenuWidth;
  }

  private getSubMenuHeight (subMenu: GwDomNode): number {
    let subMenuHeight = 0;
    if (subMenu.children && subMenu.children.length > 0) {
      if (this.isMultiColumnMenu(subMenu)) {
        // When menu containers specify numEntriesPerColumn, column(s) are generated
        // based on the number of total menu entries; grab the tallest column and use its height.
        // Note, because a single "entry" can contain multiple menu items in the form of flattened menus,
        // the first column is not guaranteed to be the tallest column.
        let tallestColumnHeight = 0;
        gwUtil.forEach(subMenu.children, (subMenuColumn) => {
          const columnHeight = this.getSubMenuHeight(subMenuColumn);
          if (columnHeight > tallestColumnHeight) {
            tallestColumnHeight = columnHeight;
          }
        });
        return tallestColumnHeight;
      } else {
        gwUtil.forEach(subMenu.children, (child) => {
          subMenuHeight = subMenuHeight + child.offsetHeight;
        });
      }
    }
    return subMenuHeight;
  }

  private resetHiddenMenus (menu: GwDomNode): void {
    $(menu.children).removeClass("gw-hidden-menu");
  }

  private resetMenuArrows (menu: GwDomNode): void {
    $(menu).find("> div.gw-scrolling-menu-arrow").remove();
    $(menu).removeClass("gw-subMenu--scrolling");
  }

  private buildScrollingMenu (menu: GwDomNode, panelBoundaries: GwMap, subMenuLeftStyle: any): void {
    const menuId = this.getMenuId(menu);
    const upArrowId = menuId + "_menuUp";
    const downArrowId = menuId + "_menuDown";
    const menuWidth = menu.offsetWidth;

    let newUpArrow = false;
    let newDownArrow = false;

    // --- Build or reuse up arrow --- //
    let upArrow = $(menu).find("#" + upArrowId)[0];
    if (!upArrow) {
      upArrow = this.buildArrow(upArrowId, "gw-menu--up-arrow", GwMenusDirection.up, "" + menuWidth);
      upArrow.style.top = "0px";
      $(upArrow).attr("aria-disabled", "true");
      $(upArrow).appendTo(menu);
      newUpArrow = true;
    }
    upArrow.style.left = subMenuLeftStyle;

    // --- Build or reuse down arrow --- //
    let downArrow = $(menu).find("#" + downArrowId)[0];
    if (!downArrow) {
      downArrow = this.buildArrow(downArrowId, "gw-menu--down-arrow", GwMenusDirection.down, "" + menuWidth);
      downArrow.style.bottom = "0px";
      $(downArrow).appendTo(menu);
      newDownArrow = true;
    }
    downArrow.style.left = subMenuLeftStyle;

    // --- Add hover scrolling support --- //
    if (newUpArrow) {
      $(upArrow).hover(() => {
        if (!gwUtil.isDisabled(upArrow)) {
          this.menuVerticalScrollAmount = "-=15"; // TODO: make scroll speed configurable?
          this.scroll(menu, upArrow, downArrow);
        }
      }, () => {
        this.menuVerticalScrollAmount = "";
      });
    }

    if (newDownArrow) {
      $(downArrow).hover(() => {
        if (!gwUtil.isDisabled(downArrow)) {
          this.menuVerticalScrollAmount = "+=15";  // TODO: make scroll speed configurable?
          this.scroll(menu, upArrow, downArrow);
        }
      }, () => {
        this.menuVerticalScrollAmount = "";
      });
    }

    menu.style["top"] = panelBoundaries.top + "px";
    menu.style["bottom"] = panelBoundaries.bottom + "px";
    menu.style["height"] = panelBoundaries.bottom - panelBoundaries.top + "px";

    $(menu).addClass("gw-subMenu--scrolling");
  }

  private scroll (scrollContainer: GwDomNode, upArrow: GwDomNode, downArrow: GwDomNode): void {
    $(scrollContainer).animate({
      scrollTop: this.menuVerticalScrollAmount
    }, 100, "linear", () => {
      if (this.menuVerticalScrollAmount !== "") {
        this.scroll(scrollContainer, upArrow, downArrow);
        this.updateUpArrowStatus(scrollContainer, upArrow);
        this.updateDownArrowStatus(scrollContainer, downArrow);
      }
    });
  }

  private updateUpArrowStatus (menu: GwDomNode, upArrow: GwDomNode): void {
    gwUtil.conditionalAddRemoveAttr(menu.scrollTop <= 0, upArrow, "aria-disabled", "true");
  }

  private updateDownArrowStatus (menu: GwDomNode, downArrow: GwDomNode): void {
    if (menu.offsetHeight === menu.scrollHeight) {
      return; // Occurs on initial state.  Kick out in this case
    }

    const disabled = (menu.scrollTop + menu.offsetHeight) >= menu.scrollHeight;
    gwUtil.conditionalAddRemoveAttr(disabled, downArrow, "aria-disabled", "true");
  }

  private buildArrow (id: string, arrowClass: string, direction: GwMenusDirection, width: string): GwDomNode {
    const arrow = $("<div id=\"" + id + "\" class=\"" + arrowClass + " gw-scrolling-menu-arrow\" " +
      "data-gw-click=\"gwMenus.scrollMenu" + direction + "\">" +
      "<div class=\"gw-icon\"></div>" +
      "</div>")[0];

    $(arrow).width(width);

    return arrow;
  }

  private buildNonScrollingMenu (menu: GwDomNode, boundaries: GwMap, totalMenuHeight: number, subMenusBelow: boolean, parentRect: GwMap): void {
    // Vertical position
    if (subMenusBelow) {
      if (parentRect.bottom + totalMenuHeight > boundaries.bottom) { // not enough room to render below
        if ((parentRect.top - totalMenuHeight) >= boundaries.top) { // and enough room to render above
          // render above parent
          menu.style.top = (parentRect.top - totalMenuHeight) + "px";
        } else {
          menu.style.top = (boundaries.bottom - totalMenuHeight) + "px";
        }
      } else {
        menu.style.top = parentRect.bottom + "px";
      }
    } else if (parentRect.top + totalMenuHeight > boundaries.bottom) {
      // Not enough room below to render full menu
      if (parentRect.top - totalMenuHeight >= boundaries.top) {
        // There's enough room above, render upward
        menu.style.top = parentRect.bottom - menu.clientHeight + "px";
      } else {
        // This aligns the bottom of the menu with the bottom of the screen,
        // to ensure we don't push it somewhere weird
        menu.style.top = boundaries.bottom - menu.clientHeight + "px";
      }
    } else {
      menu.style.top = parentRect.top + "px";
    }
  }

  scrollMenuUp (arrow: GwDomNode, args: GwMap, e: GwEventType): void {
    this.scrollMenu(arrow, GwMenusDirection.up);
  }

  scrollMenuDown (arrow: GwDomNode, args: GwMap, e: GwEventType): void {
    this.scrollMenu(arrow, GwMenusDirection.down);
  }

  private scrollMenu (arrow: GwDomNode, direction: GwMenusDirection): void {
    if (gwUtil.isDisabled(arrow)) {
      return;
    }

    const scroller = gwUtil.getSelfOrFirstParentWithClass(arrow, "gw-subMenu");

    if (!scroller) {
      return;
    }
    const scrollAmount = this.calculateScrollAmount(scroller, direction);
    scroller.scrollTop += scrollAmount;

    // --- Manage enabled/disabled state for both arrows --- //
    const otherArrow = this.getOtherArrow(arrow);
    let upArrow;
    let downArrow;

    if (gwUtil.hasClass(arrow, "gw-menu--up-arrow")) {
      upArrow = arrow;
      downArrow = otherArrow;
    } else {
      upArrow = otherArrow;
      downArrow = arrow;
    }

    this.updateUpArrowStatus(scroller, upArrow);
    this.updateDownArrowStatus(scroller, downArrow);
  }

  private calculateScrollAmount (scroller: GwDomNode, direction: GwMenusDirection): number {
    // TODO: Currently just use the height of the first menu item.
    // Could be changed to calculate the next menu item up or down.
    const menuItems = $(scroller).find(".gw-action--outer");
    const scrollAmount = menuItems[0].offsetHeight;
    if (direction === GwMenusDirection.up) {
      return -scrollAmount;
    } else {
      return scrollAmount;
    }
  }

  private getOtherArrow (arrow: GwDomNode): GwDomNode {
    const arrows = $(arrow.parentElement!).find("> .gw-scrolling-menu-arrow");
    if (arrows.length === 2) {
      return arrow === arrows[0] ? arrows[1] : arrows[0];
    }

    throw new Error("scroll arrows error");
  }

  private getMenuId (menu: GwDomNode): string {
    const enclosingMenu = gwUtil.getSelfOrFirstParentWithClass(menu, "gw-action--outer");
    if (!enclosingMenu) {
      throw new Error("unable to locate enclosing menu");
    }
    return enclosingMenu.id;
  }

  /**
   * Sets 'storedMenuToOpenAfterClosingOthers', after checking various open menu logic:
   * 1. if this is from a mouseover event, and the el is top level, check to see if there is an open top
   *    menu group that is already open.  If the el's menu group menu does not match, kick out.  If it's
   *    not a top level menu, it means it is an open submenu and we can go ahead and call fetchMenuIfNeeded
   * 2. store the menu to be opened
   * 3. if this is a mouse click event, kick out.  Rely on events.doAfterAnyClick to handle closing and then opening
   *    opening the menu stored in step 2.
   * 4. if not a click (mouse over or keyboard), close all menus and open the stored menu
   *
   * If the event type is click, then this method defers all open and closing to the doAfterAnyClick methodf
   * @param classIdTagOrNode - a clickable element either inside a gw-action--outer node, or the node itself.
   * @param eventType - (Optional) the event type associated with the method call. mouseover and click have special handling
   * @param ignoreSubMenuOnDemand (Optional) if true, then fetchMenuIfNeeded is not called. Only needed because of how MultiTab resets deferred state on its menu
   * @returns {boolean} true if the sub menu is opened, false otherwise (if, for example, the menu is disabled)
   */
  openSubMenu (classIdTagOrNode: GwClassIdTagOrNode, eventType?: string, ignoreSubMenuOnDemand?: boolean): boolean {
    const el = gwUtil.getDomNodeOrThrow(classIdTagOrNode);

    const parent = this.getSelfOrFirstParentActionOptionallyWithChildren(el, false);
    if (!parent || gwUtil.isDisabled(parent)) {
      return false;
    }

    if (eventType === "mouseenter") {
      // If this is from a mouseover, and is a top level parent, check to see if the toplevel's menu group
      // matches the current topLevelGroupMenu.  If it does not match, then do not open its sub menus.
      if (gwUtil.hasClass(parent, "gw-isTopLevelMenu")) {
        const menuGroup = this.getMenuGroup(parent);
        if (this.topLevelGroupMenuOpen !== menuGroup) {
          return false;
        }
      }
    }

    if (!ignoreSubMenuOnDemand) {
      this.fetchMenuIfNeeded(parent);
    }

    this.storedMenuToOpenAfterClosingOthers = {id: parent.id, el: parent};

    if (eventType === "click") {
      //NOTE: if open subMenu was called as a result of a click, then doAfterAnyClick will handle the final call to
      //openStoredMenu. Which is confusing, but needs to be handled so that global clicking can close menus efficiently
      return false;
    }

    this.closeAllMenus();
    this.openStoredMenu();
    return true;
  }

  /**
   * @private Gets the menu group from the passed in element.  If no group is specifiec, returns "NoGroup"
   * @param el
   * @returns {string|string}
   */
  private getMenuGroup (el: GwDomNode): string {
    return el.getAttribute("data-gw-menu-group") || "NoGroup";
  }

  /**
   * Fired after any click event, or inside of openSubMenu, if the call came from a mouseover event.
   * Iterates over all currentlyOpenMenus and closes them.
   */
  closeAllMenus (modifyFocus: boolean = true): void {
    gwUtil.forEach(this.currentlyOpenMenus, (el) => {
      this.closeSubMenu(el, modifyFocus);
    });

    this.currentlyOpenMenus = {};
  }

  closeAllMenusContainedBy (parentElem?: GwDomNode | null): void {
    if (!parentElem || (Object.keys(this.currentlyOpenMenus).length > 100)) {
      this.closeAllMenus();
      return;
    }

    gwUtil.forEach(this.currentlyOpenMenus, (el) => {
      if ($.contains(parentElem, el)) {
        this.closeSubMenu(el);
      }
    });
  }

  /**
   * Takes the storedMenuToOpenAfterClosing element, and if it exists, fires makeMenuVisibleInDom on it.
   * -If the storedMenuToOpenAfterClosingOthers.restoreFocusSelector exists
   * then calls setFocusToClosestFocusableSelfOrParent on it
   */
  openStoredMenu (): void {
    const el = this.storedMenuToOpenAfterClosingOthers.el;
    if (!el) {
      return;
    }

    const restoreFocusSelector = this.storedMenuToOpenAfterClosingOthers.restoreFocusSelector;
    this.storedMenuToOpenAfterClosingOthers = {};
    this.makeMenuVisibleInDom(el);

    if (restoreFocusSelector) {
      const restoreFocusEl = document.querySelector(restoreFocusSelector);
      gwNavigation.setFocusToClosestFocusableSelfOrParent(restoreFocusEl, true);
    }
  }

  /**
   * @public
   * Takes the first result of getDomNodes. And then runs getSelfOrFirstParentActionOptionallyWithChildren to find a gw-action--outer element.
   * Removes the gw-open class from the first child with gw-subMenu found
   * -If the currentFocus is found to be effectively a direct child of the subMenu, then calls setFocusToClosestFocusableSelfOrParent on it
   * @param classIdTagOrNode
   */
  closeSubMenu (classIdTagOrNode: GwClassIdTagOrNode, modifyFocus: boolean = true): void {
    const el = gwUtil.getDomNodeOrThrow(classIdTagOrNode);
    const parent = this.getSelfOrFirstParentActionOptionallyWithChildren(el, true);
    if (!parent) {
      return;
    }

    delete this.currentlyOpenMenus[parent.id];
    gwUtil.removeClass(parent, "gw-hasOpenSubMenu");
    gwUtil.removeClass(parent.getElementsByClassName("gw-hasOpenSubMenu"), "gw-hasOpenSubMenu");

    gwUtil.removeClass(parent.getElementsByClassName("gw-open"), "gw-open");

    const menuitem: GwDomNode = parent.querySelector(".gw-action--inner") as GwDomNode;
    gwAria.setAriaPropertyForElement("expanded", false, menuitem);

    if (gwUtil.hasClass(parent, "gw-isTopLevelMenu")) {
      this.topLevelGroupMenuOpen = "";
    }
    const currentFocus = gwFocus.getCurrentFocus();
    if (!currentFocus) {
      this.storedMenuToOpenAfterClosingOthers.restoreFocusSelector = null;
      return;
    }

    if (!this.storedMenuToOpenAfterClosingOthers.restoreFocusSelector) {
      this.storedMenuToOpenAfterClosingOthers.restoreFocusSelector
        = gwUtil.getUniqueSelector(currentFocus);
    }

    //If the parent's subMenu has direct action--outers that are focused, or the inners or expands
    // inside of those action--outers are focused, then move focus up
    const subMenu = document.querySelector("#" + parent.id + " > .gw-subMenu");
    if (!subMenu) {
      return;
    }
    gwAria.setAriaPropertyForElement("hidden", true, subMenu as GwDomNode);

    if (!modifyFocus) {
      return;
    }

    const focusParent = gwUtil.hasAnyClass(currentFocus, ["gw-action--inner", "gw-action--expand-button"])
      ? currentFocus.parentElement : null;
    gwUtil.forEach(subMenu.children, (itrEl) => {
      if (itrEl.id === currentFocus.id || (focusParent != null && itrEl.id === focusParent.id)) {
        if (this.storedMenuToOpenAfterClosingOthers.id !== itrEl.id) {
          gwNavigation.setFocusToClosestFocusableSelfOrParent(currentFocus, true);
        }
        return GW_BREAKER;
      }
      return;
    });

  }

  /**
   * @public
   * Takes the first result of getDomNodes. And then runs getSelfOrFirstParentActionto find a gw-action--outer element.
   * Chooses between openSubMenu and closeSubMenu based on the presence of the gw-open class on the
   * first child found with gw-subMenu class
   * @param classIdTagOrNode
   */
  toggleSubMenu (classIdTagOrNode: GwClassIdTagOrNode, eventType?: string): void {
    const parent = this.getSelfOrFirstParentActionOptionallyWithChildren(gwUtil.getDomNode(classIdTagOrNode), true);
    if (!parent) {
      return;
    }

    const subMenu = parent.querySelector(".gw-subMenu") as HTMLElement;
    if (!subMenu) {
      return;
    }

    if (gwUtil.hasClass(subMenu, "gw-open")) {
      this.closeSubMenu(parent);
    } else {
      gwResizer.showNavBarIfElementIsChild(parent);
      this.fetchMenuIfNeeded(parent);
      this.openSubMenu(parent, eventType);
    }
  }

  toggleFromShortcut (na: any, args: GwMap): void {
    gwMenus.toggleSubMenu(args.target, "key");
    const menuNode = gwUtil.getDomNode(args.target) as GwDomNode;
    const openSubMenuNode = gwUtil.getDomNode(".gw-subMenu gw-open", menuNode);
    if (openSubMenuNode) {
      gwFocus.forceFocus(openSubMenuNode, false, true);
    } else {
      gwFocus.forceFocus(menuNode, false, true);
    }
  }

  /**
   * @private
   * Fetches the subMenu for the given on-demand MenuItem if needed
   * @param outer
   */
  private fetchMenuIfNeeded (outer: GwDomNode): void {
    if (gwUtil.hasValue(outer.dataset.gwSubmenuOndemand)) {
      const deferredMenuItem = $(outer).find(".gw-deferred-menuItem");
      if (deferredMenuItem && deferredMenuItem.length > 0) {
        if (this.isSubMenusBelow(outer)) {
          deferredMenuItem[0].style.width = outer.offsetWidth + "px";
        } else {
          // Renders to the side, match the height of the parent menu
          deferredMenuItem[0].style.height = outer.offsetHeight + "px";
        }
      }

      delete outer.dataset.gwSubmenuOndemand; // deletes "data-gw-submenu-ondemand" attribute from gw-action--outer

      const inner = outer.querySelector(".gw-action--inner");

      gwUtil.renderDeferredChildren(outer.id,
        () => {
          // Success; open the menu again to ensure that the menu placement is correctly calculated
          if (inner) {
            const oldLabel = inner.getAttribute("aria-label");
            if (oldLabel) {
              const deferredKeyword: string = gwDisplayKey.get("Web.Client.DeferredMenuAriaKeyword");
              const newLabel: string = oldLabel.replace(deferredKeyword, "").trim();
              gwAria.setAriaPropertyForElement("label", newLabel, inner as GwDomNode);
            }
          }
          this.openSubMenu(outer, undefined, true);
        },
        () => {
          // Error; restore submenu on demand flag so we can try again later, let menu system know no menus open
          outer.dataset.gwSubmenuOndemand = "true";
          this.closeAllMenus();
        });
    }
  }

  /**
   * @public
   * This returns a fully formed div with identical structure to the MenuItemWidgets built out by the server, which are then
   * customized by the inline events system. Its purpose is to add client side menu options that the server should not know
   * anything about, like "change to theme x" or "clear local storage".
   * Keep in mind, that any element added to the dom client side, will need to be readded on full and partial page reload.
   *
   * @param id: String: inline id attribute
   * @param label: String: text for the MenuItem label
   * @param click: String: Optional, the string normally values to data-gw-click in server templates. ie 'fireEvent' or 'gwUtil.toggleClass target:#blah'.
   * @param children: Array of Objects: Optional. {id:String, label:String, click:String, children:Array of Objects};
   * @returns {DOMElement, identical to MenuItemWidget}
   */
  createMenuItemDiv (id: string, label: string, click?: string, children?: GwMap[]): HTMLDivElement {
    const menuItemClasses: string[] = ["gw-MenuItemWidget", "gw-action--outer"];
    const menuItemAttr: GwMap = {id: id};

    if (children && children.length) {
      menuItemClasses.push("gw-hasChildren");
      menuItemAttr["data-gw-menu-hover"] = "true";
      menuItemAttr["data-gw-mouseenter"] = "gwMenus.openSubMenuMouseEnter";
    }

    const menuItem = gwUtil.createDiv(menuItemClasses, menuItemAttr);
    const actionInnerAttr: GwMap = {};
    if (click) {
      actionInnerAttr["data-gw-click"] = click;
      actionInnerAttr["onclick"] = "gw.globals.gwEvents.onElementEvent(event, this)";
      actionInnerAttr["tabindex"] = "0";
    }
    const actionInner = gwUtil.createDiv("gw-action--inner", actionInnerAttr);
    menuItem.appendChild(actionInner);
    actionInner.appendChild(gwUtil.createDiv("gw-icon"));
    actionInner.appendChild(gwUtil.createDiv("gw-label", undefined, undefined, label));

    if (children && children.length) {
      const expandDivAttr: GwMap = {
        "data-gw-click": "toggleSubMenu target:#" + id,
        onclick: "gw.globals.gwEvents.onElementEvent(event, this)",
        tabindex: "0"
      };

      const expandDiv = gwUtil.createDiv("gw-action--expand-button", expandDivAttr);
      menuItem.appendChild(expandDiv);
      expandDiv.appendChild(gwUtil.createDiv(["gw-icon", "gw-icon--expand"]));

      const subMenu = gwUtil.createDiv("gw-subMenu", undefined, {
        right: "100%",
        left: "auto",
        top: "0px",
        bottom: "auto"
      });
      menuItem.appendChild(subMenu);

      gwUtil.forEach(children, (props) => {
        subMenu.appendChild(gwMenus.createMenuItemDiv(props.id, props.label, props.click, props.children));
      });
    }
    return menuItem;
  }

  /**
   * @private
   * Helper method to determine whether a menu item node is in a submenu.
   * @param outer - a Menu Item node with the gw-action--outer css class.
   * @returns {boolean}
   */
  private isInSubMenu (outer: GwDomNode): boolean {
    return (!!outer.parentElement && gwUtil.hasClass(outer.parentElement, "gw-subMenu"));
  }

  private isInStaticMenus (outer: GwDomNode): boolean {
    return gwUtil.hasClass(outer, "gw-staticMenus");
  }

  /**
   * @private
   * Helper method to return the gw-action--outer node by passing one of the focusable children to it,
   * currently expected to be the gw-action--inner or the gw-action--expand-button.
   * @param node
   * @returns {DOM Element}
   */
  private getOuterFromInnerOrExpand (node: GwDomNode): GwDomNode {
    return $(node).parents(".gw-action--outer")[0];
  }

  /**
   * @private
   * Helper method to return the gw-action--outer that is holding the submenu..that is holding the focusable node.
   * It does this simply by making 2 calls to getouterFromInnerOrExpand.
   * @param node - a DOM node, expected to be the gw-action--inner, or gw-action--expand-button.
   * @returns {DOM Element}
   */
  private getParentOuterFromInnerOrExpand (node: GwDomNode): GwDomNode {
    return this.getOuterFromInnerOrExpand(this.getOuterFromInnerOrExpand(node));
  }

  /**
   * @private
   * Method should only be executed by the gwNavigation system, when a matching navigation method is found.
   * Follows logic to determine whether a MenuItem is in a submMenu, or is a top item.
   * if in submenu: then it moves focus down to the next MenuItem. If at the bottom, then does nothing
   * if is top item: like in a tab bar: then it opens the top item's sub menu, and sets focus to the first MenuItem
   * @param node
   */
  down (node: GwDomNode): boolean {
    if (!node) {
      return false;
    }

    const outer = this.getOuterFromInnerOrExpand(node);
    const inSubMenu = this.isInSubMenu(outer);
    const inStaticMenu = this.isInStaticMenus(outer);
    const isTopMenu = !inSubMenu && !inStaticMenu;

    // This could be a tabBar type menu item widget, where we want down to open its submenu
    if (gwUtil.hasClass(outer, "gw-hasChildren")) {
      if (isTopMenu) {
        this.openSubMenu(outer);
        gwFocus.forceFocus(outer.querySelector(".gw-subMenu") as HTMLElement, false, true);
        return true;
      }
    }

    if (inSubMenu || inStaticMenu) {
      const outerSibling = gwNavigation.getNextFocusableSibling(outer, true);

      if (outerSibling) {
        gwFocus.forceFocus(outerSibling, false, true);
        return true;
      }
    }

    if (inStaticMenu) {
      // See if the parent has a sibling to move down to.
      const parent = this.getParentOuterFromInnerOrExpand(node);

      if (parent) {
        const parentNext = gwNavigation.getNextFocusableSibling(parent, true);
        if (parentNext) {
          gwFocus.forceFocus(parentNext, false, true);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * @private
   * Method should only be executed by the gwNavigation system, when a matching navigation method is found.
   * Follows logic to determine whether a MenuItem is in a submMenu, or is a top item.
   * if in submenu: then it moves the focus up to the previous Menu Item. If it's at the top of the submenu,
   * then it closes the sub menu and puts focus on the gw-action--outer that held the subMenu.
   * if is top item: like in a tab bar: then it's a noop.
   * @param node
   */
  up (node: GwDomNode): boolean {
    const outer = this.getOuterFromInnerOrExpand(node);
    const inSubMenu = this.isInSubMenu(outer);
    const inStaticMenu = this.isInStaticMenus(outer);

    if (gwUtil.hasClass(outer, "gw-hasChildren")) {
      this.closeSubMenu(outer);
    }

    if (inSubMenu || inStaticMenu) {
      const outerSibling = gwNavigation.getPrevFocusableSibling(outer, true);

      if (outerSibling) {
        gwFocus.forceFocus(outerSibling, false, true);
        return true;
      }
    }

    if (inSubMenu) {
      const parent = this.getParentOuterFromInnerOrExpand(node);
      if (parent) {
        this.closeSubMenu(parent);
        gwFocus.forceFocus(parent, false, true);
        return true;
      }
    }

    return false;
  }

  /**
   * @private
   * Method should only be executed by the gwNavigation system, when a matching navigation method is found.
   * Follows logic to determine whether a MenuItem is in a submMenu, or is a top item.
   * if in submenu: then it opens the MenuItem's subMenu and sets focus to the first element. If there is no subMenu, then noop.
   * if is top item: like in a tab bar: then it moves focus to the next MenuItem sibling in the tab bar.
   * @param node
   */
  right (node: GwDomNode): boolean {
    const outer = this.getOuterFromInnerOrExpand(node);

    if (!this.isInSubMenu(outer) && !this.isInStaticMenus(outer)) {
      gwFocus.forceFocus(gwNavigation.getNextFocusableSibling(outer, true)!, false, true);
      this.closeSubMenu(outer);
      return true;
    }

    if (gwUtil.hasClass(outer, "gw-hasChildren")) {
      //NOTE: this will feel weird if the subMenu has been anchored opposite side due to otherwise being positioned off screen.
      // But there just isn't a clean intuitive way to inform the user that the left and right arrow functionality has swapped,
      // So I'm not changing key functionality based on anchor position.
      this.openSubMenu(outer);
      gwFocus.forceFocus(outer.querySelector(".gw-subMenu") as HTMLElement, false, true);
      return true;
    }

    return false;
  }

  /**
   * @private
   * Method should only be executed by the gwNavigation system, when a matching navigation method is found.
   * Follows logic to determine whether a MenuItem is in a submMenu, or is a top item.
   * if in submenu: then it closes the subMenu and puts focus onto the gw-action--outer that held the subMenu.
   * if is top item: like in a tab bar: then it moves focus to the previous MenuItem sibling in the tab bar.
   * @param node
   */
  left (node: GwDomNode): boolean {
    const outer = this.getOuterFromInnerOrExpand(node);
    const inSubMenu = this.isInSubMenu(outer);
    const inStaticMenu = this.isInStaticMenus(outer);

    if (!inSubMenu && !inStaticMenu) {
      gwFocus.forceFocus(gwNavigation.getPrevFocusableSibling(outer, true)!, false, true);
      this.closeSubMenu(outer);
      return true;
    }

    this.closeSubMenu(outer);
    const parent = this.getParentOuterFromInnerOrExpand(node);
    if (parent) {
      this.closeSubMenu(parent);
      gwFocus.forceFocus(parent, false, true);
      return true;
    }

    return false;
  }
}

export const gwMenus = new GwMenus();
