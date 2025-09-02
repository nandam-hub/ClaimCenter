import { gwMessages } from "../comp/gwMessages";
import { GwDomNode, GwDomNodeList, GwPartialReloadDetails, GwTypedMap } from "../types/gwTypes";
import { gwPrefPanel } from "./gwPrefPanel";
import { gwStorage } from "./gwStorage";
import { GwOrderDependentInitializableSystem } from "./util/GwOrderDependentInitializableSystem";
import { gwUtil } from "./util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * System to store and restore scroll position on Dom elements between server round-trips;
 * Before each server event it stores off any divs that have a scroll position other than 0 into local storage
 * and then on page refresh, uses events.js doCustomSystemWorkOnEveryNodeOnPageLoad to restore scroll position.
 * @type {{}}
 */
export class GwScroll extends GwOrderDependentInitializableSystem {
  getSystemName(): string {
    return "gwScroll";
  }

  private readonly DO_NOT_PERSIST_SCROLL: GwTypedMap<boolean> = {
    "gw-west-panel--children--wrapper": true, // West Panel handles its own scroll restore, to ensure the active menu item is in view
  };

  private readonly LOC_NAME_ATTR: string = "data-gw-location-name";
  private readonly LOC_OBJECT_CLASS: string = ".gw-location-name";
  private readonly DEST_HASH_ATTR: string = "data-gw-dest-hash";
  private readonly SCREEN_WIDGET_CLASS: string = ".gw-ScreenWidget";

  readonly scrollKey: string = "scroll";

  // NOTE: resizer.js onResize calls clearStoredScrollPositions
  orderSpecificInit(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    if (isFullPageReload) {
      this.clearStoredScrollPositions();
    }
    // The restore logic lives in the doCustomSystemWorkOnPageLoad in events.js
  }

  setScreenScrollTo0(node: GwDomNode): void {
    const screen = gwUtil.getSelfOrFirstParentWithClass(node, this.SCREEN_WIDGET_CLASS);
    if (!screen) {
      return;
    }
    this.scrollElTo0(screen);
  }

  private scrollElTo0(node: GwDomNode): void {
    if (node) {
      node.scrollTop = 0;
      node.scrollLeft = 0;
      const key = this.getStorageKeyForNode(node);
      if (key) {
        this.setTopAndLeftInStorage(key);
      }
    }
  }

  private getLocationObject(): GwDomNode | null {
    return gwUtil.getDomNode(this.LOC_OBJECT_CLASS);
  }

  private getLocationKey(): string | null {
    const locObject = this.getLocationObject();
    if (!locObject) {
      return null;
    }

    let locationKey = locObject.getAttribute(this.DEST_HASH_ATTR);
    if (!locationKey) {
      return null;
    }

    const locationName = locObject.getAttribute(this.LOC_NAME_ATTR);
    if (locationName) {
      locationKey = locationKey + "." + locationName;
    }
    return locationKey;
  }

  private getStorageKeyForNode(node: GwDomNode): string | null {
    const nodeId = node.id;
    if (!nodeId) {
      return null;
    }

    const locationKey = this.getLocationKey();
    if (!locationKey) {
      return null;
    }

    return this.scrollKey + "." + locationKey + "." + nodeId;
  }

  /**
   * If a node has an id and either a scrollTop or a scrollLeft greater than 0, then store it in local storage
   * @param node
   */
  storeScrollForNode(node: GwDomNode): void {
    if (Object.prototype.hasOwnProperty.call(this.DO_NOT_PERSIST_SCROLL, node.id) || node.hasAttribute("data-gw-no-persist-scroll")) {
      return;
    }

    const keyId = this.getStorageKeyForNode(node);
    if (!keyId) {
      return;
    }

    const top = node.scrollTop || 0;
    const left = node.scrollLeft || 0;
    // If either top or left is greater than 0, then store the scroll positions.
    // Or if there's already a value stored, then this might be scrolling back to 0,0
    if (top + left > 0 || gwStorage.get(keyId)) {
      this.setTopAndLeftInStorage(keyId, top, left);
    }
  }

  private setTopAndLeftInStorage(keyId: string, top?: number, left?: number): void {
    top = top || 0;
    left = left || 0;
    gwStorage.set(keyId, { top: top, left: left });
  }

  /**
   * If a node has an id, and that id has an object stored in the scroll local storage,
   * then set the scrollTop and scrollLeft values of that node.
   * Called per node in events.js doCustomSystemWorkOnEveryNodeOnPageLoad
   * @param node
   */
  restoreScrollForNode(node: GwDomNode): void {
    const keyId = this.getStorageKeyForNode(node);
    if (!keyId) {
      return;
    }

    // If the scrollable node contains an error element, then don't restore scroll, and scroll to 0 instead
    if (node.querySelector(".gw-alert-error")) {
      if (gwPrefPanel.getPrefValueByPrefName("scrollToTopOnError") && !gwMessages.willFocusElementOnNextPageLoad()) {
        this.scrollElTo0(node);
        return;
      }
    }

    const scrollStorage = gwStorage.get(keyId);
    if (scrollStorage) {
      node.scrollTop = scrollStorage.top;
      node.scrollLeft = scrollStorage.left;
    }
  }

  /**
   * sets the local storage for 'scroll' to an empty object.
   * Currently called by resizer.js onResize
   */
  clearStoredScrollPositions(): void {
    gwStorage.set(this.scrollKey, {});
  }

  /**
   * This is a relatively brute force implementation, as it just goes and gets every single div,
   * but it's simple and clean. Once day we may choose to have a "walkAllDomNodesBeforeServerEvent" method
   * and if we do that, this would become part of it.
   * @returns {*|jQuery|HTMLElement}
   */
  private getScrollNodesInDom(): GwDomNodeList {
    return gwUtil.getDomNodes("div");
  }

  /**
   * Calls storeScrollForNode on the results of getScrollNodesInDom
   * Currently called by beforeFireServerEvent in app.js
   */
  saveScrollPositions(): void {
    const nodes = this.getScrollNodesInDom();
    gwUtil.forEach(nodes, this.storeScrollForNode.bind(this));
  }

  private canScroll(node: GwDomNode): boolean {
    return node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth;
  }

  private scrollElBy<T extends HTMLElement>(el: T, x: number, y: number): T {
    if (x) {
      el.scrollLeft = el.scrollLeft + x;
    }

    if (y) {
      el.scrollTop = el.scrollTop + y;
    }

    return el;
  }

  scrollElementIntoView(scrollContainer: GwDomNode, targetEl: GwDomNode | null): void {
    if (!targetEl) {
      return;
    }

    if (!this.canScroll(scrollContainer)) {
      return;
    }

    const parentRect = scrollContainer.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    let scrollY = 0;
    let scrollX = 0;

    if (targetRect.top < parentRect.top) {
      scrollY = -(targetRect.top - parentRect.top);
    } else if (targetRect.bottom > parentRect.bottom) {
      scrollY = targetRect.bottom - parentRect.bottom;
    }

    if (targetRect.left < parentRect.left) {
      scrollX = parentRect.left - targetRect.left;
    } else if (targetRect.right > parentRect.right) {
      scrollX = targetRect.right - parentRect.right;
    }

    this.scrollElBy(scrollContainer, scrollX, scrollY);
  }
}

export const gwScroll = new GwScroll();
