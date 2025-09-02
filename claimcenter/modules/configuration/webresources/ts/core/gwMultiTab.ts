import { GwDomNode,GwPartialReloadDetails } from "../types/gwTypes";
import { gwAjax } from "./util/gwAjax";
import { GwInitializableSystem } from "./util/GwInitializableSystem";
import { gwUtil } from "./util/gwUtil";
import {gwDisplayKey} from "./gwDisplayKey";
import {gwMenus} from "./gwMenus";

export class GwMultiTab extends GwInitializableSystem {
  private MESSAGE_TIME_BEFORE_FADE: number = 10000;
  private MIN_TIME_BETWEEN_SYNC_CALLS: number = 500;
  private lastSyncCallTime: number = Date.now();
  private readonly ownerParamKey: string = "gw-local-owner-id";
  private readonly sessionTabParamKey: string = "gw-tab";
  private readonly sessionTabMaxParamKey: string = "gw-max-tabs-reached";
  private readonly multiTabSyncParamKey: string = "__multi-tab-sync";
  private multiTabEnabled: boolean | null = null;
  private localOwnerId: string = crypto.randomUUID();
  private sendLocalOwnerIdOnNextRequest: boolean = false;
  private tabIsBlurred: boolean = false;
  private requestTimeoutId: number | null =  null;
  private firedReleaseEvent: boolean = false;

  getSystemName(): string {
    return "gwMultiTab";
  }

  init(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    if (!this.isMultiTabEnabled()) {
      return;
    }

    const { ownerTabId: remoteOwnerId, sessionCount: boolean } = gwUtil.getMultiTabInfo();

    if (isFullPageReload) {
      const url = new URL(window.location.href);
      if (url.searchParams.has(this.sessionTabMaxParamKey)) {
        url.searchParams.delete(this.sessionTabMaxParamKey);
        history.replaceState(history.state, '', url.href);
        window.alert(gwDisplayKey.get("Web.Client.MultiTab.AttemptedToCreateNewContextOverMax"));
      }

      const tabId = this.getSessionIndexFromUrl()
      window.name = this.getWindowNameForTabId(tabId || "1");

      document.addEventListener("visibilitychange", () => this.onTabVisibilityChange())
      document.addEventListener("blur", this.onBlur.bind(this), { capture: true });
      document.addEventListener("focusin", this.onFocus.bind(this), { capture: true });
      document.addEventListener("mousedown", this.onInteraction.bind(this), { capture: true });
      document.addEventListener("keydown", this.onInteraction.bind(this), { capture: true });

      window.addEventListener("pagehide", this.releaseTabOwnership.bind(this));
      window.addEventListener("unload", this.releaseTabOwnership.bind(this));
    }

    if (!remoteOwnerId) {
      this.sendLocalOwnerIdOnNextRequest = true;
      return;
    }

    if(remoteOwnerId !== this.localOwnerId) {
      if (isFullPageReload) {
          this.warnOnMismatchedOwnerFromFullReload();
      } else {
          this.warnOnMismatchedOwnerFromPartialReload();
      }
    }
  }

  onTabVisibilityChange(): void {
    if (document.hidden) {
      this.tabIsBlurred = true;
      gwUtil.devlog("Tab became inactive: visibility")
    }
  }

  private onBlur(): void {
    if (!document.hasFocus()) {
      gwUtil.devlog("Tab became inactive: blur")
      this.tabIsBlurred = true;
    }
  }

  private onFocus(): void {
    this.onInteraction();
  }

  private onInteraction(): void {
    if (this.tabIsBlurred ) {
      gwUtil.devlog("Tab became active")
      this.tabIsBlurred = false;
      this.fireAction("sync");
    }
  }

  private releaseTabOwnership(): void {
    if (this.firedReleaseEvent) {
      return;
    }

    this.firedReleaseEvent = true;
    this.fireAction("release");
  }

  private setMultiTabButtonToOnDemand(totalSessions?: number | null): void {
    const multiTabButton = gwUtil.getDomNode("#gw-TabBarWidget--multiTabInfo");
    if (!multiTabButton) {
      return;
    }

    multiTabButton.dataset.gwSubmenuOndemand = "true";
    multiTabButton.dataset.gwContent = "" + (totalSessions || 0);
  }

  private warnOnMismatchedOwnerFromFullReload(): void {
    this.sendLocalOwnerIdOnNextRequest = true;
    this.showWarning(
      gwDisplayKey.get("Web.Client.MultiTab.Warning.NonOriginalTab", this.getSessionIndexFromUrl())
    );
  }

  private warnOnMismatchedOwnerFromPartialReload(): void {
    this.sendLocalOwnerIdOnNextRequest = true;
    this.showWarning(
      gwDisplayKey.get("Web.Client.MultiTab.Warning.OtherTabInteraction", this.getSessionIndexFromUrl())
    );
  }

  private getWindowNameForTabId(tabId: string): string {
    return "gw_tab_" + tabId;
  }

  private async fireAction(action: "sync" | "release" | "own"):  Promise<void> {
    if (gwUtil.onLoginPage() || !gwUtil.getSessionInfo().userId) {
      return;
    }
    console.log("Fire action: " + action);
    try {
      if (this.requestTimeoutId) {
        window.clearTimeout(this.requestTimeoutId);
      }

      const now = Date.now();
      if (now - this.lastSyncCallTime < this.MIN_TIME_BETWEEN_SYNC_CALLS) {
        this.requestTimeoutId = window.setTimeout(() => {
          this.fireAction(action);
        }, this.MIN_TIME_BETWEEN_SYNC_CALLS - (now - this.lastSyncCallTime));
        return;
      }

      this.lastSyncCallTime = now;

      const bodyParams = new URLSearchParams();
      bodyParams.set(gwUtil.CSRF_PARAM_NAME, gwAjax.getCsrfToken());
      bodyParams.set(this.multiTabSyncParamKey, `${action}:` + this.localOwnerId);

      const response = await window.fetch(
          ((window.location.href || "").match(/^([^#]+)/) || [])[1], //clear hash
          {
            method: "POST",
            body: bodyParams,
          }
      );

      if (!response.ok) {
        this.showWarning(gwDisplayKey.get("Web.Client.MultiTab.Warning.SyncFail"));
        return;
      }

      const data: { remoteOwnerTabId?: string | null, totalSessions?: number | null, showLoggedOutWarning: boolean } = await response.json();

      if (data.showLoggedOutWarning) {
        window.alert(gwDisplayKey.get("Web.Client.MultiTab.Warning.IsLoggedOut"));
        return;
      } else {
        const remoteOwnerTabId = data.remoteOwnerTabId;
        if (action !== "release" && remoteOwnerTabId && remoteOwnerTabId !== this.localOwnerId) {
          this.warnOnMismatchedOwnerFromPartialReload();
        }
      }

      this.setMultiTabButtonToOnDemand(data.totalSessions);
    } catch (e) {
      this.showWarning(gwDisplayKey.get("Web.Client.MultiTab.Warning.SyncFail"));
    }
  }

  private showWarning(msg: string): void {
    const center = document.getElementById("gw-center-panel");
    if (!center) {
      return;
    }

    const iconDiv = gwUtil.createDiv("gw-icon");
    const textDiv = gwUtil.createDiv("gw-text", {"role": "alert"}, undefined, msg);
    const existingOuterDiv = document.getElementById("gwMultiTabDialogue");
    if (existingOuterDiv) {
      existingOuterDiv.remove();
    }
    const outerDiv = gwUtil.createDivWithId("gwMultiTabDialogue", [iconDiv, textDiv]);
    center.appendChild(outerDiv);
    outerDiv.addEventListener("click", () => outerDiv.remove());
    if (this.MESSAGE_TIME_BEFORE_FADE > 0) {
      setTimeout(() => {
        outerDiv.classList.add("removed");
        setTimeout(() => {
          outerDiv.remove();
        }, 1000);
      }, this.MESSAGE_TIME_BEFORE_FADE);
    }

  }

  openInNewTab(node: GwDomNode, args: { index: string }): void {
    const url = new URL(window.location.href);
    url.searchParams.set(this.sessionTabParamKey, args.index);
    const existingWindow = window.open("", this.getWindowNameForTabId(args.index));
    gwMenus.closeAllMenus();
    if (existingWindow?.document.getElementById("gw-root-form")) {
      existingWindow.focus();
    } else {
      window.open(url, "gw_tab_" + args.index);
    }
  }

  newContextInNewTab(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete(this.sessionTabParamKey);
    url.searchParams.set(this.sessionTabParamKey, "new");
    gwMenus.closeAllMenus();
    window.open(url, "_blank");

  }

  isMultiTabEnabled(): boolean {
    if (this.multiTabEnabled === null) {
      try {
        this.multiTabEnabled = gwUtil.getMultiTabInfo().allowsMultiTab;
      } catch (e) {
        this.multiTabEnabled = false;
      }
    }

    return this.multiTabEnabled;
  }

  doFormSubmitStep(): { key: string; value: string } | null {
    if (!this.isMultiTabEnabled()) {
      return null;
    }

    if (!this.sendLocalOwnerIdOnNextRequest) {
      return null;
    }

    this.sendLocalOwnerIdOnNextRequest = false;

    return { key: this.ownerParamKey, value: this.localOwnerId };
  }

  getSessionIndexFromUrl(): string | null {
    if (!this.isMultiTabEnabled()) {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get(this.sessionTabParamKey) || null;
  }

  appendOrReplaceContextParamToUrlUsingLocationUrl(url: URL): URL {
    if (!this.isMultiTabEnabled()) {
      return url;
    }

    const currentContextIndex = this.getSessionIndexFromUrl();
    const urlCopy = new URL(url);
    urlCopy.searchParams.set(this.sessionTabParamKey, currentContextIndex || "1");
    return urlCopy;
  }

  getSessionParamKeyValIfMultiTab(): {key: string, value: string} | null {
    if (!this.isMultiTabEnabled()) {
      return null;
    }

    return {key: this.sessionTabParamKey, value: this.getSessionIndexFromUrl() || "1"}
  }
}

export const gwMultiTab = new GwMultiTab();
