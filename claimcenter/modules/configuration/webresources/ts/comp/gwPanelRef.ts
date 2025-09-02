import {GwInitializableSystem} from "../core/util/GwInitializableSystem";
import {GwDomNode, GwEventType, GwMap, GwPartialReloadDetails} from "../types/gwTypes";
import {gwUtil} from "../core/util/gwUtil";
import {gwStorage} from "../core/gwStorage";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * A PanelRefWidget is a PCF element that can reference another panel.
 * It's only purpose on the client is to be a collapsible container.
 *
 * It wraps all of its children in a gw-panelRefWidget--children div
 * and has a gw-panelRefWidget--titleArea div that will contain a TitleBar widget if it was present in the pcf
 *
 * The collapsed state of the container is persisted in local storage by ID.
 * However, if the container has a data-gw-custom-collapse attribute, then its state is persisted via that string
 *
 * Also, if the container has a data-gw-accordion-group attribute, then when its toggled open, all other
 * containers with the same data-gw-accordion-group value will be closed.
 */
export class GwPanelRef extends GwInitializableSystem {
  init (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    this.restoreCollapsedPanelStates();
  }

  getSystemName (): string {
    return "gwPanelRef";
  }

  expandAllParents (el: GwDomNode): void {
    let collapsibleParent: GwDomNode | null = el;
    //NOTE: if the el itself is a collapsible container's title bar, we do NOT want to change its state. Only those of its collapsible ancestors
    if (gwUtil.hasClass(el, "gw-panelRefWidget--titleArea")) {
      collapsibleParent = el.parentElement ? el.parentElement.parentElement : null;
    }

    let safety = 100;

    while (collapsibleParent && safety-- > 0) {
      this.forceExpandedAndStoreState(collapsibleParent);
      collapsibleParent = gwUtil.getSelfOrFirstParentWithAttr(collapsibleParent, "data-gw-collapsible-container");
    }
  }

  toggleCollapsed (el: GwDomNode, args: GwMap, event: GwEventType): void {
    const container = this.getOuterCollapsibleContainerOrThrow(el);
    this.toggleCollapsedAndStoreState(container);
  }

  private restoreCollapsedPanelStates (): void {
    gwUtil.forEachReverse(gwUtil.getDomNodesByAttr("data-gw-collapsible-container"), this.restoreCollapsedState.bind(this));
  }

  private getCollapsedKey (container: GwDomNode): string {
    const sharedPersistentCollapseId = container.getAttribute("data-gw-custom-collapse");
    if (sharedPersistentCollapseId) {
      return this.getSystemName() + "." + sharedPersistentCollapseId + ".custom_collapsed";
    }

    return this.getSystemName() + "." + container.id + ".collapsed";
  }

  private restoreCollapsedState (container: GwDomNode): boolean {
    let isCollapsed = gwStorage.get(this.getCollapsedKey(container));
    // If the Container has no persisted value, then persist the current state from the server
    if (!gwUtil.hasValue(isCollapsed)) {
      isCollapsed = container.classList.contains("gw-collapsed");
    }

    if (isCollapsed) {
      this.forceCollapsedAndStoreState(container);
    } else {
      this.forceExpandedAndStoreState(container);
    }

    return isCollapsed;
  }

  private forceCollapsedAndStoreState (container: GwDomNode): void {
    gwStorage.set(this.getCollapsedKey(container), true);
    gwUtil.addClass(container, "gw-collapsed");
    this.updateErrorStatesOnContainer(container, true);
  }

  private forceExpandedAndStoreState (container: GwDomNode): void {
    gwStorage.set(this.getCollapsedKey(container), false);
    gwUtil.removeClass(container, "gw-collapsed");
    this.updateErrorStatesOnContainer(container, false);

    // Check for accordion ID and matching group members
    const accordionId = container.getAttribute("data-gw-accordion-group");

    if (!gwUtil.hasValue(gwUtil.convertIfString(accordionId))) {
      return;
    }

    const accordionSiblings = gwUtil.getDomNodesByAttr("data-gw-accordion-group", accordionId!);
    gwUtil.forEachReverse(accordionSiblings, (sibling: GwDomNode) => {
      if (sibling && sibling.id === container.id) {
        return;
      }

      this.forceCollapsedAndStoreState(sibling);
    });
  }

  private toggleCollapsedAndStoreState (container: GwDomNode): boolean {
    const isCollapsed = gwStorage.toggleFlag(this.getCollapsedKey(container), container.classList.contains("gw-collapsed"));
    if (isCollapsed) {
      this.forceCollapsedAndStoreState(container);
    } else {
      this.forceExpandedAndStoreState(container);
    }

    return isCollapsed;
  }

  private getOuterCollapsibleContainerOrThrow (el: GwDomNode): GwDomNode {
    const container: GwDomNode | null = gwUtil.getSelfOrFirstParentWithAttr(el, "data-gw-collapsible-container");
    if (!container) {
      throw new Error("Unable to locate collapsible container for element: " + el.id);
    }

    return container;
  }

  private updateErrorStatesOnContainer (container: GwDomNode, isCollapsed: boolean): void {
    const containsWidgetWithError = !!container.querySelector(".gw-invalid");

    gwUtil.conditionalAddRemoveClass(isCollapsed && containsWidgetWithError, container, "gw-contains-error");
  }

}

export const gwPanelRef = new GwPanelRef();
