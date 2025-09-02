import {GwClassIdTagOrNode, GwDomNode, GwDomNodeList, GwMap, GwPanel} from "../types/gwTypes";
import {gwUtil} from "./util/gwUtil";
import {gwStorage} from "./gwStorage";
import {gwAnimation} from "./gwAnimation";
import {gwPanelRef} from "../comp/gwPanelRef";
import {gwScroll} from "./gwScroll";
import {gwEvents} from "./events/gwEvents";
import {gwResizer} from "./gwResizer";
import {gwMenus} from "./gwMenus";
import {gwPrefPanel} from "./gwPrefPanel";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwFocus {
  /**
   * @private
   * Key for localStorage.
   * @type {string}
   */
  private readonly CURR_FOCUS_KEY: string = "currentFocusSelector";

  /**
   * @private
   * Key for localStorage.
   * @type {string}
   */
  private readonly LAST_FOCUS_KEY: string = "lastFocusSelector";

  /**
   * @private
   * The cache for the current focused node.
   * We cache it to prevent having to do an ID lookup from localStorage everytime.
   * But it means we need to clear the cache on full and partial page reloads.
   * Only accessed via gw.navigation.setCurrentFocus and getCurrentFocus
   */
  private currentFocusNode: GwDomNode | null = null;

  /**
   * ibid.
   */
  private lastFocusNode: GwDomNode | null = null;

  /**
   * Early in processing a server request we may learn that we need to set focus to a given element (e.g. via a
   * server "event" or "command"). But, at that time, the focus and event systems aren't ready. So we save the
   * focus node and process it when we are ready.
   */
  private serverSpecifiedFocusNode: GwDomNode | null = null;

  private lastClickedPanel: GwPanel | null = null;

  /**
   * @public
   * Returns either the cached node in currentFocusNode, or pulls the stored id from localStorage and does a DOM lookup.
   * @returns {*}
   */
  getCurrentFocus (): GwDomNode | null {
    if (!this.currentFocusNode) {
      const selector = gwStorage.get(this.CURR_FOCUS_KEY);
      if (selector) {
        this.currentFocusNode = document.querySelector(selector);
      }
    }
    return this.currentFocusNode;
  }

  /**
   * Removes focus and focus styling from all nodes
   */
  clearFocus (): void {
    if (document.activeElement && (document.activeElement as HTMLElement).blur !== undefined) {
      (document.activeElement as HTMLElement).blur();
    }

    this.setCurrentAndLastFocusToNull();
  }

  quickJumpShortcutFired (): void {
    if (gwPrefPanel.getTopNavCollapseLevel() !== "none") {
      this.forceFocus("#QuickJump", true, false, true);
    } else {
      this.forceFocus("#QuickJump", true);
    }
  }

  private setCurrentAndLastFocusToNull (): void {
    this.currentFocusNode = null;
    this.lastFocusNode = null;

    gwStorage.set(this.CURR_FOCUS_KEY, null);
    gwStorage.set(this.LAST_FOCUS_KEY, null);

    gwUtil.removeClass(".gw-focus", "gw-focus");
  }

  /**
   * @public
   * Holds a reference to the last focused node.
   * @returns {*}
   */
  getLastFocus (): GwDomNode | null {
    if (!this.lastFocusNode) {
      const lastFocusSelector = gwStorage.get(this.LAST_FOCUS_KEY);
      if (lastFocusSelector) {
        this.lastFocusNode = document.querySelector(lastFocusSelector);
      }

    }
    return this.lastFocusNode;
  }

  /**
   * @public
   * Sets the last focused node.
   * @param node
   */
  setLastFocus (node: GwDomNode | null): void {
    if (!node || !this.focusableUsingTabIndex(node)) {
      return;
    }

    this.lastFocusNode = node;
    gwStorage.set(this.LAST_FOCUS_KEY, gwUtil.getUniqueSelector(node));
  }

  /**
   * @public
   * Only to be called by server events/commands to specify a focus node that should be applied once
   * the focus system is ready
   * @param {GwDomNode} node
   */
  setFocusFromServer (node: GwDomNode): void {
    this.serverSpecifiedFocusNode = node;
  }

  /**
   * @private
   * Given a node, returns an array of focusable children via querySelectorAll tabindex.
   * And filters the array for various properties and styles that would make it "invisible".
   * @param node
   * @returns {[DOMNodes]}
   */
  getFocusable (node: GwDomNode, allowNegativeTabIndex: boolean = false): GwDomNodeList {
    if (node) {
      if (node.style.visibility === "hidden" || node.style.display === "none") {
        return [];
      }

      const candidates = node.querySelectorAll("input, textarea, select, [tabindex]");

      return Array.prototype.filter.call(candidates, (el: GwDomNode) => {
        return this.canSelfBeFocusedBasedOnHtmlState(el, allowNegativeTabIndex);
      });
    }

    return [];
  }

  /**
   * @private
   * used by getFocusable and isFocusable, to determine if an element meets the criteria of visibility and size to be focused.
   * @param el - an HTML DOM element.
   * @returns {boolean}
   */
  private canSelfBeFocusedBasedOnHtmlState (el: GwDomNode, allowNegativeTabIndex: boolean = false): boolean {
    //TODO: cooper. I hate having to do all these checks, and getComputedStyle is slow
    // But the jquery one liners either do too much or not enough.
    if (!this.focusableUsingTabIndex(el, allowNegativeTabIndex)) {
      return false;
    }

    if (gwUtil._isSimulatedDOM()) {
      return true;
    }

    if (el.offsetWidth === 0) {
      return false;
    }
    if (el.offsetHeight === 0) {
      return false;
    }

    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden") {
      return false;
    }
    if (style.display === "none") {
      return false;
    }
    if (style.width && style.width.indexOf("0") === 0) {
      return false;
    }
    if (style.height && style.height.indexOf("0") === 0) {
      return false;
    }
    return true;
  }

  private readonly defaultFocusableMap: GwMap = {
    a: true,
    button: true,
    img: true,
    input: true,
    select: true,
    textarea: true
  };

  private allowsFocusBasedOnReadonly (el: GwDomNode): boolean {
    if (el.hasAttribute("readonly") && !el.hasAttribute("data-gw-readonly-focusable")) {
      return false;
    }

    return true;
  }

  /**
   * @private
   * Check if element is focusable based on tabIndex.  If the tabIndex is not explicitly specified
   * on the element, check a default focusable map to determine if the element should be focusable.
   *
   * Optionally, let elements with a negative tab index be focusable.
   */
  private focusableUsingTabIndex (el: GwDomNode, allowNegativeTabIndex: boolean = false): boolean {
    if (!el) {
      return false;
    }

    if (!el.hasAttribute) {
      return false;
    }

    if (el.hasAttribute("disabled")) {
      return false;
    }

    if (!this.allowsFocusBasedOnReadonly(el)) {
      return false;
    }

    if (el.hasAttribute("tabIndex")) {
      // data-gw-active-with-negative-tabindex is a complex workaround to allow radio div groups to behave like native input radios
      // Which is, only the selected input is tabbable, but all of the elements are arrow navigable
      return allowNegativeTabIndex || el.hasAttribute("data-gw-active-with-negative-tabindex") ? true : el.tabIndex >= 0;
    }
    return this.defaultFocusableMap[el.nodeName.toLowerCase()] || false;
  }

  focusableOnClick (el: GwDomNode): boolean {
    if (this.defaultFocusableMap[el.nodeName.toLowerCase()]) {
      return true;
    }

    return !!this.findFocusableNodeForClick(el);
  }

  /**
   * @public
   * Returns true if the node, or anyone of it's children is focusable.
   * @param node
   * @param allowChildren whether to search down for a focusable element to consider the node focusable
   * @returns {boolean}
   */
  isFocusable (node: GwDomNode | null, allowChildren: boolean = true, allowNegativeTabIndex: boolean = false): boolean {
    if (node === null) {
      return false;
    }
    return this.canSelfBeFocusedBasedOnHtmlState(node, allowNegativeTabIndex) || (allowChildren && this.getFocusable(node, allowNegativeTabIndex).length > 0);
  }

  /**
   * When an element is clicked, we search up the DOM for something with a tabIndex
   * to focus. In IE, everything receives a focusIn event, so we need to search
   * for what elements we support focus on.
   * @param targetNode
   * @returns {*}
   */
  findFocusableNodeForClick (targetNode: GwDomNode | null): GwDomNode | null {
    let parent: GwDomNode | null = targetNode;
    while (parent) {
      if (!this.allowsFocusBasedOnReadonly(parent)) {
        return null;
      }
      //In IE we get to the Document itself, which does not support hasAttribute
      if ((this.defaultFocusableMap[parent.nodeName.toLowerCase()]) ||
        (parent.hasAttribute
            && !parent.hasAttribute("disabled")
            && parent.hasAttribute("tabIndex")
            && +parent.getAttribute("tabIndex")! >= 0)) {
        return parent;
      }

      parent = parent.parentElement;
    }
    return null;
  }

  processNewFocus (node: GwDomNode, animateOnFocus: boolean = false, openParentMenusIfFocusTargetIsHidden: boolean = false): void {
    gwUtil.removeClass(".gw-focus", "gw-focus");

    if (animateOnFocus) {
      gwAnimation.addAnimation(node, "focus");
    }

    if (!node) {
      this.clearFocus();
      return;
    }

    if (node !== this.getCurrentFocus()) {
      this.setLastFocus(this.currentFocusNode);
    }

    this.currentFocusNode = node;
    const selector = gwUtil.getUniqueSelector(node);

    gwPanelRef.expandAllParents(node);
    gwUtil.addClass(node, "gw-focus");
    if (openParentMenusIfFocusTargetIsHidden) {
      gwMenus.ensureFocusedItemIsVisibleIfInHiddenSubmenu(node);
    }

    node.focus();

    gwResizer.showNavBarIfElementIsChild(node);

    if (node.tagName.toLowerCase() === "input" || node.tagName.toLowerCase() === "textarea") {
      gwEvents.setVisibleFocusMode(true);
    }

    gwStorage.set(this.CURR_FOCUS_KEY, selector);
  }

  forceFocusIgnoreIfNull (classIdOrNode: GwClassIdTagOrNode | null, animateOnFocus: boolean = false): boolean {
    if (classIdOrNode === null) {
      return false;
    }

    return this.forceFocus(classIdOrNode, animateOnFocus);
  }

  /**
   * @public
   * This call takes a class or Id string, or a node, and sets focus to it if it has a tab index.
   * If it does not have a tabindex it begins recursively drilling down to find the first child of child with a tabindex
   * @param classIdOrNode: argument passed to getDomNode
   * @param animateOnFocus: Whether the DOM element should "animate" to show it has been focused
   * @returns {boolean} returns true to stop the recursive calls.
   */
  forceFocus (classIdOrNode: GwClassIdTagOrNode, animateOnFocus: boolean = false, allowNegativeTabIndex: boolean = false, openParentMenusIfFocusTargetIsHidden: boolean = false): boolean {
    const el = gwUtil.getDomNode(classIdOrNode);

    if (!el || el === document.documentElement) {
      return false;
    }

    if (this.focusableUsingTabIndex(el, allowNegativeTabIndex)) {
      this.processNewFocus(el, animateOnFocus, openParentMenusIfFocusTargetIsHidden);
      return true;
    }

    const child = this.getFocusable(el, allowNegativeTabIndex)[0];
    if (child) {
      this.processNewFocus(child as GwDomNode, animateOnFocus, openParentMenusIfFocusTargetIsHidden);
      return true;
    }

    const children = el.children;
    if (children) {
      for (let i = 0; i < children.length; i++) {
        if (this.forceFocus(children[i] as GwDomNode, animateOnFocus, allowNegativeTabIndex, openParentMenusIfFocusTargetIsHidden)) {
          return true;
        }
      }
    } else {
      gwUtil.devlog("Attempt to force focus on element with no children", el);
    }

    return false;
  }

  setLastClickedPanelAndClearFocus (target: GwDomNode | null): void {
    if (!target) {
      return;
    }

    const topLevelPanelEl = gwUtil.getSelfOrFirstParentWithAttr(target, "data-gw-top-level-panel");
    if (topLevelPanelEl) {
      gwFocus.lastClickedPanel = topLevelPanelEl.getAttribute("data-gw-top-level-panel") as GwPanel;
    }
    gwFocus.clearFocus();
  }

  /**
   * @public
   * Needs to be called after full and partial page reload to restore the focus correctly.
   * Clears current node caches then forces focus onto the the currentFocus
   * @param asyncTimer: if present, and a number, then will delay calling restore focus for n milleseconds.
   * This is mainly for debugging, but it's likely there will come a time where we have async logic running
   * after page reload, and restore focus will need to wait until it's done. Though when that happens,
   * this should probably become a callback to the given async method.
   */
  restoreFocus (isFullPageReload: boolean, asyncTimer: number = -1): void {
    this.currentFocusNode = null;
    this.lastFocusNode = null;

    if (asyncTimer >= 0) {
      setTimeout(this.restoreFocus.bind(this, isFullPageReload), asyncTimer);
      return;
    }

    // On most browsers we make a last ditch effort to set the focus node to whatever the browser
    // thinks is currently focused. This helps in the case when the user is tabbing through the UI
    // with the dev console open, which generates extra focus/blur events.
    const activeElement = document.activeElement;
    const focusNode = this.serverSpecifiedFocusNode || this.getCurrentFocus() || this.getLastFocus() || activeElement;
    if (focusNode) {
      this.forceFocus(focusNode as HTMLElement, isFullPageReload);
      if (this.serverSpecifiedFocusNode) {
        gwScroll.saveScrollPositions();
        this.serverSpecifiedFocusNode = null;
      }
    } else {
      this.setCurrentAndLastFocusToNull();
    }
  }

  restoreLastFocusNodeIfAvailable (animate: boolean = false): void {
    if (this.lastFocusNode) {
      this.forceFocus(this.lastFocusNode, animate);
    }
  }

  getLastClickedPanel (): GwPanel | null {
    return this.lastClickedPanel;
  }

  focusIsOutsideApplication (): boolean {
    return !document.hasFocus() || document.activeElement === document.body || document.activeElement === document.documentElement;
  }

  /**
   * The document.activeElement is the document.body inbetween blur and focus events in chrome
   * and it's the document.documentElement in firefox an edge;
   * This makes it impossible to tell synchronously, during the blur event, whether the shift tab from the first element
   * on the page has actually put focus on the body element, in which case we need to clear our previously focused element.
   * So we have to do the check in the next frame.
   *
   * NOTE: if you have developer tools open in either chrome or firefox, the body element will receive focus always
   * as an extra step between the document and the address bar.
   */
  possiblyHandleDocumentBlur (): void {
    window.setTimeout(() => {
      if (this.focusIsOutsideApplication()) {
        this.setCurrentAndLastFocusToNull();
      }
    }, 0);
  }

  getFirstFocusableElInNorth (): GwDomNode | null {
    const focusableElementsInPanel = this.getFocusable(document.getElementById("gw-north-panel") as GwDomNode);
    return (focusableElementsInPanel[0] || null) as GwDomNode | null;
  }

  getLastFocusableElInCenterOrSouth (): GwDomNode | null {
    const southPanel = document.getElementById("gw-south-panel") as GwDomNode;
    const finalPanel = !southPanel || gwUtil.hasClass(southPanel, "gw-placeholder") ? document.getElementById("gw-center-panel") : southPanel;
    const focusableElementsInPanel = this.getFocusable(finalPanel as GwDomNode);
    return (focusableElementsInPanel[focusableElementsInPanel.length - 1] || null) as GwDomNode | null;
  }

  private getCorrespondingLockElForLastFocusNode (newFocusEl: GwDomNode): GwDomNode {
    if (!this.lastFocusNode) {
      return newFocusEl;
    }

    const lockContainer = gwUtil.getSelfOrFirstParentWithAttr(this.lastFocusNode, "data-gw-focus-lock") as GwDomNode;
    if (!lockContainer) {
      return newFocusEl;
    }

    if (lockContainer.contains(newFocusEl)) {
      return newFocusEl;
    }

    if (this.lastFocusNode.hasAttribute("data-gw-focus-lock-top")) {
      return lockContainer.querySelector("[data-gw-focus-lock-bottom]") || newFocusEl;
    } else if (this.lastFocusNode.hasAttribute("data-gw-focus-lock-bottom")) {
      return lockContainer.querySelector("[data-gw-focus-lock-top]") || newFocusEl;
    } else {
      return newFocusEl;
    }
  }

  /**
   * [IF]
   * the newFocus node is one of the application's focus barrier element, then it will run logic to determine
   * what direction the user was heading, and then return either the first element in north panel, or the last element in center/south
   *
   * [ELSE]
   * If the lastFocus node exists, and is part of a focus lock cycle. Meaning, it's either the top or the bottom node
   * Then this method goes and finds the lock container, ie the first parent element with a data-gw-focus-lock attribute
   * If the new focus is contained by the lock container, then all is good, and return the new focus.
   * If the new focus is outside of the lock container, then we query the lock container to find the corresponding lock node.
   * If the lastFocusNode is top, then returns bottom, and vice versa
   * @returns {GwDomNode | null}
   */
  getCorrespondingFocusLockOrNewFocusEl (newFocusEl: GwDomNode): GwDomNode {
    if (newFocusEl) {
      if (newFocusEl.id === "gw-focus-barrier-top") {
        if (!this.lastFocusNode || this.lastFocusNode.id === "gw-focus-barrier-bottom") {
          return this.getFirstFocusableElInNorth() || newFocusEl;
        } else if (this.lastFocusNode.hasAttribute("data-gw-focus-lock-top")) {
          return this.getCorrespondingLockElForLastFocusNode(newFocusEl) ;
        } else {
          return newFocusEl;
        }
      }

      if (newFocusEl.id === "gw-focus-barrier-bottom") {
        if (!this.lastFocusNode || this.lastFocusNode.id === "gw-focus-barrier-top") {
          return this.getLastFocusableElInCenterOrSouth() || newFocusEl;
        } else if (this.lastFocusNode.hasAttribute("data-gw-focus-lock-bottom")) {
          return this.getCorrespondingLockElForLastFocusNode(newFocusEl) ;
        } else {
          return newFocusEl;
        }
      }
    }

    return this.getCorrespondingLockElForLastFocusNode(newFocusEl);
  }

}

export const gwFocus = new GwFocus();
