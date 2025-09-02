import {gwLogIfPolyfill} from "./core/gwPolyfills";
import * as d3 from "d3";
import $ from "jquery";
import { gwEvents } from "./core/events/gwEvents";
import { gwPerfAnalyzer } from "./core/events/gwPerfAnalyzer";
import { gwServerEvents } from "./core/events/gwServerEvents";
import { gwConfig } from "./core/gwConfig";
import { gwCrossOriginInternal } from "./core/GwCrossOriginInternal";
import { gwFocus } from "./core/gwFocus";
import { gwLocale } from "./core/gwLocale";
import { gwMenus } from "./core/gwMenus";
import { gwOps } from "./core/gwOps";
import { gwPreferences } from "./core/gwPreferences";
import { gwPrefPanel } from "./core/gwPrefPanel";
import { gwResizer } from "./core/gwResizer";
import { gwScroll } from "./core/gwScroll";
import { gwStorage } from "./core/gwStorage";
import { gwInputSystems } from "./core/inputs/gwInputSystems";
import { gwReflection } from "./core/reflection/gwReflection";
import { gwSumReflection } from "./core/reflection/gwSumReflection";
import { GwInitializableSystem } from "./core/util/GwInitializableSystem";
import { GwOrderDependentInitializableSystem } from "./core/util/GwOrderDependentInitializableSystem";
import { GwRegisteredSystem } from "./core/util/GwRegisteredSystem";
import { gwUtil } from "./core/util/gwUtil";
import { GwDomNode, GwMap, GwPartialReloadDetails, GwPartialReloadReason } from "./types/gwTypes";

(window as any).$ = $;

(window as any).d3 = d3;

import ErrorTextStatus = JQuery.Ajax.ErrorTextStatus;

export class GwApp extends GwRegisteredSystem {
  /** Timeout in milliseconds, longest time we're prepared to wait for a new theme file to load */
  readonly MAX_WAIT_FOR_THEME: number = 3000;

  maxElementsToReplacePerFrame: number = 1000;
  shouldFlash: boolean = false;
  showDevLogs: boolean = false;
  showEventLogs: boolean = false;
  showTraceInLogs: boolean = false;
  newSession: boolean = false; //TODO: this appears to be a NOOP
  enableWebsocket: boolean = false;
  // If set to a positive non null value, will enable server request throttling
  EVENT_THROTTLE_MAX_REQUESTS_PER_SECOND: number | null = null;
  THEME_NAME_SEARCH_PARAM: string = "initialTheme";

  getSystemName(): string {
    return "gwApp";
  }

  fireAfterFullPageReload(): void {
    this.abstractReload(true);
  }

  fireAfterPartialPageReload(details: GwPartialReloadDetails): void {
    this.abstractReload(false, details);
    gwPerfAnalyzer.responseProcessed();
  }

  fireAfterGwBodyReplace(): void {
    this.hideBody();
    this.fireAfterPartialPageReload({ reason: GwPartialReloadReason.REPLACE_BODY });
  }

  showBody(): void {
    const body: HTMLBodyElement | null = document.querySelector("body");
    if (!body) {
      throw new Error("Unable to find a body element");
    }

    body.style.visibility = "visible";
    body.style.opacity = "1";
  }

  hideBody(): void {
    const body: HTMLBodyElement | null = document.querySelector("body");
    if (!body) {
      throw new Error("Unable to find a body element");
    }

    body.style.visibility = null as any;
    body.style.opacity = null as any;
  }

  //TODO: remove: this method appears to no longer serve a purpose
  private resetInitOnlyValues(): void {
    this.newSession = false;
  }

  _dev_showBodyAfterReloadChunk(): void {
    this.showBody();
  }

  popupAboutWindow(): Window | null {
    /* Window sizing matches hard coded values in Ferrite */
    const features = "width=620, height=330";
    return window.open(gwUtil.getCurrentUrlWithNewHandlerName("about"), "gwAboutPopupWindow", features);
  }

  /**
   * Used to store and later re-focus on whatever the user was working on before they opened the shortcut help popup.
   * See {@link #gwPrefPanel.restoreUnderlyingPageFocus} for a similar implementation.
   * Right now there are only two modal elements in Pebbles. If we ever create a third,
   * care should be taken to consolidate the three components into one system.
   */
  private _shortcutHelpFocusRestore: GwDomNode | null = null;

  openShortcutHelp(): void {
    gwPrefPanel.cancel(); // Modal elements do not play well together. As this is the only other modal element which exists at the moment, we can just close it explicitly.
    gwUtil.showOnDemandElement("gw-ShortcutPopupHelp", () => this.onOpenShortcutHelp());
  }

  onOpenShortcutHelp(): void {
    this._shortcutHelpFocusRestore = gwFocus.getCurrentFocus();
    const closeButton: HTMLDivElement | null = document.getElementById("gw-ShortcutPopupHelp--close") as HTMLDivElement;
    if (!closeButton) {
      return;
    }
    gwFocus.forceFocus(closeButton, true);
  }

  closeShortcutHelp(): void {
    gwUtil.hideOnDemandElement("gw-ShortcutPopupHelp");
    if (this._shortcutHelpFocusRestore) {
      gwFocus.forceFocus(this._shortcutHelpFocusRestore, true);
    }
  }

  private isNavigating: boolean = false;

  /**
   * Prepares the app for Nav, which cancels all remaining initialization. If navigating within the Cluster,
   * the onbeforeunload is cleared. Otherwise, we only stop initialization if there is no
   * onbeforeunload registered.
   */
  prepareForExitPointNavigation(preventUnloadAlert: boolean = false): void {
    if (preventUnloadAlert) {
      gwEvents.clearBeforeUnload();
      this.isNavigating = true;
    } else {
      gwEvents.possiblyAddOnBeforeUnloadHandler();
      if (!gwEvents.isBeforeUnloadRegistered()) {
        this.isNavigating = true;
      }
    }
  }

  private getPreInitializationOrderSpecificSystems(): GwOrderDependentInitializableSystem[] {
    return [gwLocale, gwConfig, gwStorage, gwPrefPanel, gwServerEvents, gwOps];
  }

  private getPostInitializationOrderSpecificSystems(): GwOrderDependentInitializableSystem[] {
    return [gwCrossOriginInternal, gwEvents, gwResizer, gwScroll];
  }

  /**
   * @private
   * method used by both fullPage and partialPage reload. Passes the isFullPageReload
   * parameter in to any init method it calls, so the system or widget can do different things
   * based on whether it's a full or partial page reload.
   * @param isFullPageReload
   * @param partialReloadDetails an object containing a reason field and, if the reason is REPLACE_ITEMS,
   *        and ids field containing the ids of the items that were replaced
   */
  private abstractReload(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    // Preferences have to be initialized before anything else, as they may affect how other systems work
    gwPreferences.init();

    if (gwUtil.isInIframe()) {
      this.handleReloadWhileInIframe(isFullPageReload, partialReloadDetails);
    } else {
      this.handleReloadNotInIframe(isFullPageReload, partialReloadDetails);
    }
  }

  /**
   *
   * @param isFullPageReload
   * @param partialReloadDetails
   * @return {boolean} true if initialized system as begun navigating
   */
  private initializeAllSystemsReturnTrueIfNavigating(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): boolean {
    for (const systemObj of this.getPreInitializationOrderSpecificSystems()) {
      systemObj.orderSpecificInit(isFullPageReload, partialReloadDetails);
    }

    if (this.isNavigating) {
      //If an init method has begun navigating, cut short.
      this.isNavigating = false;
      return true;
    }

    // =================
    GwInitializableSystem.initializeSystems(isFullPageReload, partialReloadDetails);

    // =================
    for (const systemObj of this.getPostInitializationOrderSpecificSystems()) {
      systemObj.orderSpecificInit(isFullPageReload, partialReloadDetails);
    }

    return false;
  }

  private finalizeReloading(isFullPageReload: boolean): void {
    document.title = gwUtil.getUtilityInfo("gw-title");
    this.showBody();
    gwFocus.restoreFocus(isFullPageReload);
    gwEvents.enableEvents();
    this.resetInitOnlyValues(); // Needs to be last
    gwUtil.runAfterPageLoad();
  }

  private handleReloadNotInIframe(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    // If theme has changed then bail out for now; we'll re-enter initialization once the theme is loaded
    if (!isFullPageReload && this.checkForThemeChange(isFullPageReload, partialReloadDetails)) {
      return;
    }

    if (this.initializeAllSystemsReturnTrueIfNavigating(isFullPageReload, partialReloadDetails)) {
      return;
    }

    this.finalizeReloading(isFullPageReload);
  }

  private handleReloadWhileInIframe(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    // If theme has changed then bail out for now; we'll re-enter initialization once the theme is loaded
    const injectedPLThemeNameFromConfigManager = checkForConfigManagerThemeChangeAndGetPLThemeToChangeTo();

    const isBodyReplace = partialReloadDetails && partialReloadDetails.reason === GwPartialReloadReason.REPLACE_BODY;
    //const isThemeChange = partialReloadDetails && partialReloadDetails.reason === GwPartialReloadReason.THEME_CHANGE;
    const isPartialReplace = partialReloadDetails && partialReloadDetails.reason === GwPartialReloadReason.REPLACE_ITEMS;

    if (isPartialReplace && this.checkForThemeChange(isFullPageReload, partialReloadDetails)) {
      return;
    }

    if (this.initializeAllSystemsReturnTrueIfNavigating(isFullPageReload, partialReloadDetails)) {
      return;
    }

    if (gwPrefPanel.getPrefValueByPrefName("loadInMockLauncher")) {
      this.possiblyLoadInMockLauncher();
    }

    // ====================================================
    // === IFRAME THEME INJECTION ON INITIAL LOAD
    // ====================================================

    if (injectedPLThemeNameFromConfigManager) {
      //This entire block is solely used to handle theme from iframe on full page reloads
      //Any theme changes that occur in config manager while an IS app is framed in config manager
      //Will be handled by window messaging

      if (isFullPageReload || isBodyReplace) {
        if (gwUtil.onLoginPage()) {
          //If we are on the login page, then we don't know who the user is, so we can't set the preferences
          //Instead we just manually force the theme on
          //Then wait for the body replace to handle the pref update
          handleNewThemeFromPartialOrIframe(injectedPLThemeNameFromConfigManager);
        } else {
          //Here we rely on setting the preference to handle the update to the theme from the iframe
          //But there's an error state that happens where we get the json body response from the preference refresh
          //Before we've fully loaded the page, and the browser tries to load it as html
          //So we punt this into a setTimeout
          window.setTimeout(() => {
            gwPrefPanel.immediatelySetNewThemeAndRefresh(injectedPLThemeNameFromConfigManager);
          });
        }
      }
    }

    // ----------------------------------------------------------
    this.finalizeReloading(isFullPageReload);
  }

  /**
   * Fires before every server event.
   * Eventually, if many systems begin using this, it should be converted into a
   * "walkAllDomNodesBeforeServerEvent" where each node is passed into the methods defined in it.
   */
  beforeEachFireEventToServer(): void {
    gwMenus.closeAllMenus();
    gwPreferences.beforeServerRequest();
    gwInputSystems.beforeFireEvent();
    gwScroll.saveScrollPositions();
    gwReflection.clearCache();
    gwSumReflection.clearValues();
  }

  private possiblyLoadInMockLauncher(): void {
    const existingMockLauncherEl = gwUtil.getDomNode("#gw-debug-mock-launcher");
    const shouldLoadMockLauncher = gwPrefPanel.getPrefValueByPrefName("loadInMockLauncher");

    if (shouldLoadMockLauncher && !existingMockLauncherEl) {
      const topSectionEl = gwUtil.getDomNodeOrThrow(".gw-NorthPanelWidget--top-section");
      const mockLauncher = $("<div id='gw-debug-mock-launcher'/>");
      $(mockLauncher).append("<div id='gw-debug-mock-launcher--left'/>");
      $(mockLauncher).append(
        "<div id='gw-debug-mock-launcher--right'><div class='icon1'><span/></div><div class='icon2'><span/></div><div class='icon3'><span/></div><div class='icon4'><span/></div></div>"
      );
      $(topSectionEl).prepend(mockLauncher);
    } else if (!shouldLoadMockLauncher && existingMockLauncherEl) {
      gwUtil.removeNode(existingMockLauncherEl);
    }
  }

  /**
   * The currently displayed theme is determined by the id of the document element,
   * which will be set to the id of one of the themes. For the theme to work the
   * corresponding style sheet must be loaded (each theme has a separately generated
   * style sheet).
   *
   * After a full page reload the server will have already set up the correct id on
   * the document element and added a link to the corresponding style sheet. But
   * after a partial reload the value stored in user preferences may differ from the
   * currently displayed theme, in which case we have to ensure the corresponding
   * style sheet is loaded and then change the document element id.
   *
   * @param {boolean} isFullPageReload is this a full reload or a partial reload?
   * @param {GwMap} partialReloadDetails details of why the partial reload happened
   * @returns {boolean} if the theme is being changed
   */
  private checkForThemeChange(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): boolean {
    if (isFullPageReload || (partialReloadDetails && partialReloadDetails.reason === GwPartialReloadReason.THEME_CHANGE)) {
      return false;
    }

    // This is a bit iffy; it relies on gwPreferences being initialized (which we ensure in
    // abstractReload) but also relies on gwPrefPanel.getPrefValueByPrefName not needing any new
    // information from the response. This is true of the current implementation, which uses
    // gwPreferences (already initialized), gwUtil (doesn't need initialization) and gwConfig
    // (which is only initialized on a full page reload)
    const currentTheme = gwPrefPanel.getPrefValueByPrefName("theme");
    if (!currentTheme || typeof currentTheme !== "string") {
      return false;
    }

    if (document.documentElement.id === currentTheme) {
      return false;
    }

    handleNewThemeFromPartialOrIframe(currentTheme);
    return true;
  }
}

export function handleNewThemeFromPartialOrIframe(newTheme: string): void {
  // If we never find the theme file, or it's taking too long, then just enable the app early,
  // using the theme that's already in place
  const failsafe = window.setTimeout(() => {
    gwApp.fireAfterPartialPageReload({ reason: GwPartialReloadReason.THEME_CHANGE });
  }, gwApp.MAX_WAIT_FOR_THEME);

  // Otherwise, the theme id on the document element is out of date. Load the desired theme
  // CSS file and, once it has successfully loaded, update the id on the document element and
  // continue initialization. Once initialization is done, fire a custom event to let the rest
  // of the application know the theme has changed.
  const themeCssFile = document.createElement("link");
  themeCssFile.rel = "stylesheet";
  themeCssFile.type = "text/css";
  themeCssFile.href = "css/gen/" + newTheme + ".css";
  themeCssFile.onload = () => {
    window.clearTimeout(failsafe);
    document.documentElement.id = newTheme; //This changes the theme over. We specifically don't want a stand alone method to do this, as in every other case, this is handled on the server.
    gwApp.fireAfterPartialPageReload({ reason: GwPartialReloadReason.THEME_CHANGE });
    gwUtil.fireCustomEvent("themeChange", { themeId: newTheme });
  };

  document.getElementsByTagName("head")[0].appendChild(themeCssFile);
}

/**
 * This is a brittle implementation, but there's too much changing to bother with something more solid, like a direct mapping.
 * For now, if the frame passes in a theme name with the word dark in it, then we give em dark
 * If they pass in a theme with the name banff in it, we give em banff
 * else, we give em cloud
 *
 * @param cmTheme
 * @return {string} a valid PL cloud theme name
 */
export function convertConfigManagerThemeNameToPLThemeName(cmTheme: string): string {
  const lowerCasedCmTheme = cmTheme.toLowerCase();

  if (lowerCasedCmTheme.indexOf("dark") > -1) {
    return "gw-theme--darcula"; //These names need to match the file names available in Client_Properties.json
  }

  if (lowerCasedCmTheme.indexOf("banff") > -1) {
    return "gw-theme--cloud-banff";
  }

  return "gw-theme--cloud";
}

/**
 * Look for and injected theme from config manager and return the PL theme name if it is not the currently set theme in the DOM
 * @return {string | null} a valid PL cloud theme name or null
 */
function checkForConfigManagerThemeChangeAndGetPLThemeToChangeTo(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  const possiblyInjectedThemeFromIframe = searchParams.get(gwApp.THEME_NAME_SEARCH_PARAM);

  if (!possiblyInjectedThemeFromIframe) {
    return null;
  }

  const convertedToPlThemeName = convertConfigManagerThemeNameToPLThemeName(possiblyInjectedThemeFromIframe);

  if (document.documentElement.id !== convertedToPlThemeName) {
    return convertedToPlThemeName;
  }

  return null;
}

export const gwApp = new GwApp();

gwLogIfPolyfill();
/**
 * This function executes when the full page is finished loading.
 * All DOM elements and scripts will be available.
 */
if (!(window as any).GwTestEnv) {
  $(() => gwApp.fireAfterFullPageReload());
}
