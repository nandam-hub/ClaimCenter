import {GwDomNode, GwMap} from "../types/gwTypes";
import {gwFocus} from "../core/gwFocus";
import {GwInitializableSystem} from "../core/util/GwInitializableSystem";
import {gwUtil} from "../core/util/gwUtil";
import {gwAnimation} from "../core/gwAnimation";
import {gwSouthPanel} from "./gwSouthPanel";
import {gwAria} from "../core/aria/GwAria";
import {gwDisplayKey} from "../core/gwDisplayKey";
import {gwEvents} from "../core/events/gwEvents";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwMessages extends GwInitializableSystem {
  getSystemName (): string {
    return "gwMessages";
  }

  private readonly NAV_ATTR: string = "data-gw-nav";
  private readonly ERROR_CLASS: string = "gw-navHasErrors";
  private readonly WARNING_CLASS: string = "gw-navHasWarnings";
  private readonly ERROR_QUICK_BUTTON_ID: string = "gw-quickErrorButton";
  private readonly LIVE_REGION_ID: string = "gw-messagesLiveRegion";

  private focusElementOnNextPageLoad: string | null = null;
  private errorsOnCurrentPage: boolean = false;
  private possiblyHighlightErrorButton: boolean = false;
  // These variables should reflect each kind of WebMessage severity present in the com.guidewire.pl.web.widget.WebMessage#Severity enum.
  private numErrorsOnPage: number = 0; // Reflects both normal errors and request validation errors
  private numWarningsOnPage: number = 0;
  private numInfosOnPage: number = 0;

  private readonly MESSAGE_SELECTOR_PARENT: string =  ".gw-WebMessage";
  private readonly ERROR_MESSAGE_SELECTOR: string = this.MESSAGE_SELECTOR_PARENT + " .gw-alert-error";
  private readonly WARNING_MESSAGE_SELECTOR: string = this.MESSAGE_SELECTOR_PARENT + " .gw-alert-warning";
  private readonly INFO_MESSAGE_SELECTOR: string = this.MESSAGE_SELECTOR_PARENT + " .gw-alert-info";

  /**
   * @Optimize, could do this entire init method server side and mark elements there, instead of modifying the dom here
   * Marks any widgets that lead to the destination of the errors as being in an error state.
   * If there's a focusElementOnNextPageLoad, then moves the focus to that element.
   */
  init (): void {
    this.updateWebMessageIndicators();
  }

  private updateWebMessageIndicators (): void {
    //@Optimize
    //Remove any error classes we've added previously to nav elements
    gwUtil.removeClass("." + this.ERROR_CLASS, this.ERROR_CLASS);
    gwUtil.removeClass("." + this.WARNING_CLASS, this.WARNING_CLASS);

    this.possiblyHighlightErrorButton = !this.errorsOnCurrentPage;
    this.errorsOnCurrentPage = false;

    this.iterateMessagesWidgetsWithErrors(messagesWidget => {
      this.errorsOnCurrentPage = true;

      const southPanelAsParent = gwUtil.getSelfOrFirstParentWithClass(messagesWidget, "gw-south-panel");
      if (southPanelAsParent) {
        gwUtil.addClass(southPanelAsParent, this.ERROR_CLASS);
      }
    });

    // If we hadn't seen any errors before, and now found one, then blink the button
    this.possiblyHighlightErrorButton = this.possiblyHighlightErrorButton && this.errorsOnCurrentPage;

    //If a messageGroup points to an off page element error, then we'll highlight the nav element that takes you there
    const messageGroups = gwUtil.getDomNodesByAttr(this.NAV_ATTR);
    gwUtil.forEach(messageGroups, (messageGroup) => {
      this.markNavElementAsHavingErrors(messageGroup.getAttribute(this.NAV_ATTR), gwUtil.hasClass(messageGroup, "gw-MessagesWidget--group-warning"));
    });

    if (this.focusElementOnNextPageLoad) {
      this.highlight(null, {id: this.focusElementOnNextPageLoad});
      this.focusElementOnNextPageLoad = null;
    }

    this.updateQuickErrorButton();
    this.countAllMessagesBySeverityAndUpdateLiveRegion();
  }

  private updateQuickErrorButton (): void {
    const button = this.getQuickErrorButtonOrThrow();
    gwUtil.conditionalAddRemoveClass(this.errorsOnCurrentPage, button, "gw-hasErrors");
    if (this.possiblyHighlightErrorButton) {
      gwAnimation.addAnimation(button, "hugepulse");
    }
  }

  willFocusElementOnNextPageLoad (): boolean {
    return !!this.focusElementOnNextPageLoad;
  }

  private getQuickErrorButtonOrThrow (): HTMLDivElement {
    const button = document.getElementById(this.ERROR_QUICK_BUTTON_ID);
    if (!button) {
      throw new Error("missing quick error button at id: " + this.ERROR_QUICK_BUTTON_ID);
    }

    return button as HTMLDivElement;
  }

  private getLiveRegion (): HTMLDivElement | null {
    const region = document.getElementById(this.LIVE_REGION_ID);
    if (region) {
      return region as HTMLDivElement;
    }
    return null;
  }

  private iterateMessagesWidgetsWithErrors (cb: (mw: HTMLDivElement) => void): void {
    gwUtil.forEach(gwUtil.getDomNodes(".gw-MessagesWidget--group-error"), errorGroup => {
      const messagesWidget = gwUtil.getSelfOrFirstParentWithClass(errorGroup, ".gw-MessagesWidget");
      if (messagesWidget && !gwUtil.hasAnyClass(messagesWidget, ["gw-hidden", "gw-placeholder"])) {
        cb(messagesWidget as HTMLDivElement);
      }
    });
  }

  private countAllMessagesBySeverityAndUpdateLiveRegion (): void {
    this.numInfosOnPage = document.querySelectorAll(this.INFO_MESSAGE_SELECTOR).length;
    this.numWarningsOnPage = document.querySelectorAll(this.WARNING_MESSAGE_SELECTOR).length;
    this.numErrorsOnPage = document.querySelectorAll(this.ERROR_MESSAGE_SELECTOR).length;
    this.updateMessagesLiveRegion();
  }

  /**
   * The constructed message will not appear on the page but will instead inhabit a region with role="alert", a "live-region",
   * which causes screen readers to read these messages aloud.
   * Example messages:
   * * This page contains error and warning messages. Errors: (3). Warnings: (1).
   * * This page contains informational messages. Infos: (1).
   * * This page contains error, warning, and informational messages. Errors: (2). Warnings: (3). Infos: (2).
   */
  private updateMessagesLiveRegion (): void {
    const liveRegion = this.getLiveRegion();
    if (!liveRegion) {
      return;
    }

    let containsMessagesInfoDisplayKey = "Web.Client.MessagesWidgetLiveRegionContains";

    const snippets: string[] = [];

    // Simultaneously:
    // Construct the display key for the message which describes what kinds of messages are present on the page
    // Gather snippets of text which will describe exactly how many of each kind of message are present on the page.
    if (this.numErrorsOnPage > 0) {
      containsMessagesInfoDisplayKey += "Errors";
      snippets.push(gwDisplayKey.get("Web.Client.MessagesWidgetLiveRegionNumErrors", this.numErrorsOnPage));
    }
    if (this.numWarningsOnPage > 0) {
      containsMessagesInfoDisplayKey += "Warnings";
      snippets.push(gwDisplayKey.get("Web.Client.MessagesWidgetLiveRegionNumWarnings", this.numWarningsOnPage));
    }
    if (this.numInfosOnPage > 0) {
      containsMessagesInfoDisplayKey += "Infos";
      snippets.push(gwDisplayKey.get("Web.Client.MessagesWidgetLiveRegionNumInfos", this.numInfosOnPage));
    }

    if (snippets.length === 0) {
      gwAria.setAriaPropertyForElement("label", "", liveRegion);
    } else {
      snippets.unshift(gwDisplayKey.get(containsMessagesInfoDisplayKey)); // add to beginning
      gwAria.setAriaPropertyForElement("label", snippets.join(" "), liveRegion);
    }
  }

  quickErrorButton (el: GwDomNode, args: GwMap): void {
    this.iterateMessagesWidgetsWithErrors((messagesWidget: HTMLDivElement) => {
      const southPanelAsParent = gwUtil.getSelfOrFirstParentWithClass(messagesWidget, "gw-south-panel");
      if (southPanelAsParent) {
        gwSouthPanel.unMinimize();
      }

      const webMessage = messagesWidget.querySelector(".gw-WebMessage") as HTMLDivElement;

      if (webMessage) {
        const subGroup = gwUtil.getSelfOrFirstParentWithClass(webMessage, ".gw-MessagesWidget--severity-sub-group");
        if (subGroup === null) {
          return;
        }

        gwUtil.removeClass(subGroup, "gw-collapsed");
        gwEvents.setVisibleFocusMode(true);
        // If we found a webMessage in an unknown destination group, then it won't be focusable, so focus the toggle button
        // NOTE: Disabled animate on focus for now; Chrome on Mac OS seems to have problems applying this animation - works
        // in Windows Chrome, Mac/Win Firefox.  Win IE 11 doesn't run the animation but it does not render strangely
        // like Chrome on Mac OS.
        if (gwUtil.getSelfOrFirstParentWithClass(subGroup, "gw-MessagesWidget--group-UNKNOWN") !== null) {
          const toggleButton = (subGroup as HTMLDivElement).querySelector(".gw-toggle-button") as HTMLDivElement;
          gwFocus.forceFocus(toggleButton, false);
        } else {
          gwFocus.forceFocus(webMessage, false);
        }
      }

    });
  }

  toggleGroup (el: GwDomNode, args: GwMap): void {
    const group = gwUtil.getSelfOrFirstParentWithClass(el, ".gw-MessagesWidget--destination-group");
    if (!group) {
      return;
    }
    gwUtil.toggleClass(group, "gw-collapsed");
  }

  /**
   * Toggles the group of messages open or closed.
   */
  toggleSubGroup (el: GwDomNode, args: GwMap): void {
    const group = gwUtil.getSelfOrFirstParentWithClass(el, ".gw-MessagesWidget--severity-sub-group");
    if (!group) {
      return;
    }
    gwUtil.toggleClass(group, "gw-collapsed");

    gwAria.setAriaPropertyForElement("expanded", !gwUtil.hasClass(group, "gw-collapsed"), el);
  }

  private markNavElementAsHavingErrors (navId: string, hasOnlyWarnings: boolean = false): void {
    gwUtil.addClass("#" + navId, hasOnlyWarnings ? this.WARNING_CLASS : this.ERROR_CLASS);
  }

  // Widget ID specific methods

  /**
   * Move the focus to a field, animate it to show it, which will also scroll the page to include it if not currently visible.
   */
  highlight (el: GwDomNode | null, args: GwMap): void {
    gwFocus.forceFocus("#" + args.id, true);
  }

  /**
   * Requires the NAV_ATTR to be present on the element.
   * If present, then fires the event of the associated navigation element.
   */
  navigate (el: GwDomNode, args: GwMap): void {
    const navOwner = gwUtil.getSelfOrFirstParentWithClass(el, "gw-MessagesWidget--destination-group");
    if (!navOwner) {
      throw new Error("Could not find parent group for Message Widget." + (el.id || (el as HTMLInputElement).name || el.innerHTML));
    }
    const navId = navOwner.getAttribute(this.NAV_ATTR);
    if (navId) {
      if (args.next) {
        this.focusElementOnNextPageLoad = args.next;
      }
      gwUtil.fireEvent(navId + args.suffix);
    }
  }

  /**
   * If the web message widget has an action listener, then it has specific functionality to fire an event,
   * passing the parameter of the the WebMessage source id.
   */
  action (el: GwDomNode, args: GwMap): void {
    gwUtil.setEventParam("action", args.param.replace(/\+\+actionValue\+colon\+\+/g, ":")); //TODO: undo, right now the action string comes down with :'s in it, and the event system parses them as args.
    gwUtil.fireEvent(args.id + args.suffix);
  }

}

export const gwMessages = new GwMessages();
