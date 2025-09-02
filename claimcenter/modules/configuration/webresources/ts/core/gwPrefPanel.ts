/**
 * The PrefPanel handles user preferences that are not set automatically by the user taking action, as in components like listview column hiding.
 * When the user presses the "save" button. If there are any dirty preferences, then it persists them to the preference system, and then
 * forces a refresh to update them on the server.
 *
 * On partial page reloads, checkAndHandleIfTopLevelWidgetIsOutOfDate is called to determine files need to be downloaded
 * and then finishes the page load once the files are done downloading. Currently, this is only for theme files.
 * @type {{}}
 */
import {GwDomNode, GwDomNodeList, GwValueWidgetElement, HTMLCheckboxElement} from "../types/gwTypes";
import {gwUtil} from "./util/gwUtil";
import {gwPreferences} from "./gwPreferences";
import {gwMenus} from "./gwMenus";
import {gwForm} from "./gwForm";
import {gwDisplayKey} from "./gwDisplayKey";
import {gwInputs} from "./inputs/gwInputs";
import {GwOrderDependentInitializableSystem} from "./util/GwOrderDependentInitializableSystem";
import {gwApp} from "../plApp";
import {gwResizer} from "./gwResizer";
import {gwConfig} from "./gwConfig";
import {gwEvents} from "./events/gwEvents";
import {GwSet} from "./util/GwSet";
import {gwFocus} from "./gwFocus";

type GwPrefPanelInput = HTMLCheckboxElement | HTMLSelectElement;

export class GwPrefPanel extends GwOrderDependentInitializableSystem {

  getSystemName (): string {
    return "gwPrefPanel";
  }

  // ========== Init ===================
  /** Id of the preferences panel in the DOM */
  private readonly PREF_PANEL_ID: string = "gw-PrefPanel";
  /** Key under which to store the pref panel values in the preferences system */
  private readonly PREFERENCES_KEY: string = "gw-PrefPanel";
  /** Ids of any preference inputs whose values don't match the values in the preferences system */
  private readonly _dirtyPrefs: GwSet = new GwSet();
  /** Was the main form dirty when the preference panel was opened? */
  private _formWasDirtyWhenPanelOpened: boolean = false;
  /** Inputs that correspond to preference values that currently differ from the server defaults */
  private readonly _inputsThatDifferFromDefaults: GwSet = new GwSet();

  private _underlyingPageFocus: GwDomNode | null = null;

  // ========== initializer methods ===================

  /**
   * @param isFullPageRefresh
   */
  orderSpecificInit (isFullPageRefresh: boolean): void {
    this.preferencesLoaded();
  }

  /**
   * Updates one-off preferences not handled directly by other systems
   */
  preferencesLoaded (): void {
    gwUtil.conditionalAddRemoveClass(this.getPrefValueByPrefName("disableFocusOutline"), "#gw-body", ".gw-disableFocusOutline");
    this.setDebugPrefs();
    this.setFontSize(this.getPrefValueByPrefName("fontSize") as string);
    this.setGlobalSpacing(this.getPrefValueByPrefName("globalSpacingModifier") as string);
    this.setAlternateActionsIcon(gwUtil.convertIfString(this.getPrefValueByPrefName("alternateActionsIcon")));
    this.setDatePrefs();
    this.setGeneralPrefs();
    this.setToolbarPrefs();
    this.setTextShadowPref();
  }

  // ========== public methods ===================
  /**
   * Helper method so other systems can read data from the preferences system with only an id.
   * Handles all conversion of values, and also uses default values from the config system if
   * no preferences are found.
   * @param id
   * @returns {*}
   */
  getPrefValueByPrefName (prefName: string): string | boolean | null | undefined {
    // Implementation warning; this method is called very early during the processing of
    // a partial page reload, to find the currently configured theme. It can rely on
    // gwPreferences and gwConfig both being initialized (and gwUtil does not need any
    // special initialization). But be careful if you change this method to depend on
    // other systems
    const val = gwPreferences.getPreference(this.PREFERENCES_KEY, prefName);
    if (gwUtil.hasValue(val)) {
      return gwUtil.convertIfString(val);
    }

    //Otherwise, get the default that came down with the configuration
    const defaultValue = gwConfig.prefPanelDefaults()[prefName];
    return gwUtil.convertIfString(defaultValue);
  }

  getTopNavCollapseLevel (): "none" | "topnav" | "all" {
    const val = this.getPrefValueByPrefName("topNavCollapseLevelOptions");
    return (val || "none") as any;
  }

  /**
   * Opens the preferences panel, closes all open menus, and sets the UI state.
   */
  open (): void {
    gwMenus.closeAllMenus();
    gwApp.closeShortcutHelp(); // Modal elements do not play well together. As this is the only other modal element which exists at the moment, we can just close it explicitly.
    gwUtil.showOnDemandElement(this.PREF_PANEL_ID, () => this.onOpen());
  }

  /**
   * Returns true if the preferences panel has any unsaved data.
   * @returns {boolean}
   */
  isDirty (): boolean {
    return this._dirtyPrefs.size() > 0;
  }

  /**
   * Called by data-gw-change handler. Compare the new value to the original value of the input to determine if
   * the data is dirty.
   * @param el
   */
  change (el: GwValueWidgetElement): void {
    const prefPanelInput: GwPrefPanelInput = el.querySelector("input, select") as GwPrefPanelInput;

    const wasDirty = this.isDirty();

    if (gwInputs.getDefaultValueForInputElement(prefPanelInput) !== gwInputs.getValueById(el.id)) {
      this._dirtyPrefs.add(el.id);
      gwUtil.addClass(el, "gw-changed");
    } else {
      this._dirtyPrefs.remove(el.id);
      gwUtil.removeClass(el, "gw-changed");
    }

    if (wasDirty !== this.isDirty()) {
      gwEvents.possiblyAddOnBeforeUnloadHandler();
    }

    if (this.differsFromDefaultValue(el, prefPanelInput)) {
      this._inputsThatDifferFromDefaults.add(el.id);
    } else {
      this._inputsThatDifferFromDefaults.remove(el.id);
    }
    this.enableOrDisableRestoreDefaultsButton();
  }

  immediatelySetNewThemeAndRefresh (themeName: string): void {
    gwPreferences.storePreference(this.PREFERENCES_KEY, "theme", themeName, this.PREFERENCES_KEY);

    gwResizer.forceRecalcOnNextPartialPageLoad();
    gwUtil.refresh();
  }

  immediatelyToggleShowInlineValueTypesAndRefresh(): void {
    const showInlineValueTypes: boolean = this.normalizeBooleanDefaultValue(this.getPrefValueByPrefName("showInlineValueTypes") || undefined);
    gwPreferences.storePreference(this.PREFERENCES_KEY, "showInlineValueTypes", !showInlineValueTypes, this.PREFERENCES_KEY);

    gwResizer.forceRecalcOnNextPartialPageLoad();
    gwUtil.refresh();
  }

  /**
   * Saves all settings. If there is preference data to save then calls refresh to store the data on the server,
   * otherwise just closes the window. If there is preference data to save but the page already contained unsaved data
   * in the main form then check with the user before doing the server refresh.
   */
  save (): void {
    if (!this.isDirty()) {
      this.close();
      return;
    }

    if (this._formWasDirtyWhenPanelOpened && !window.confirm(gwDisplayKey.get("Web.Client.ConfirmPrefPanelWithDirtyForm"))) {
      return;
    }

    this._dirtyPrefs.forEach((name) => {
      gwPreferences.storePreference(this.PREFERENCES_KEY, this.getPrefNameFromDomIdOrName(name), gwInputs.getValueById(name), this.PREFERENCES_KEY);
    });

    this.close();
    gwResizer.forceRecalcOnNextPartialPageLoad();
    gwUtil.refresh();
  }

  /**
   * If there is dirty data, then reverts any changes made in the UI to whatever is stored in the preferences system.
   * Closes
   */
  cancel (): void {
    if (this.isDirty()) {
      if (!window.confirm(gwDisplayKey.get("Web.Client.PrefPanelConfirmCancel"))) {
        return;
      }

      gwUtil.forEach(this.getAllPrefValueWidgets(), (valWidget) => {
        gwInputs.setValueById(valWidget, gwInputs.getDefaultValueForInputElement(valWidget));
      });
    }
    this.close();
  }

  /**
   * Reverts all values to original defaults
   */
  reset (): void {
    if (!window.confirm(gwDisplayKey.get("Web.Client.PrefPanelConfirmReset"))) {
      return;
    }

    const idsToBeReset = this._inputsThatDifferFromDefaults.copy();
    idsToBeReset.forEach((id) => {
      const valueWidget = gwUtil.getDomNodeOrThrow("#" + id);
      const inputEl = valueWidget.querySelector("input, select") as GwPrefPanelInput;
      const defaultValue = this.getDefaultValue(valueWidget.id);
      if (gwInputs.isCheckbox(inputEl)) {
        inputEl.checked = this.normalizeBooleanDefaultValue(defaultValue);
      } else {
        gwInputs.setValueOnSelect(inputEl, this.normalizeStringDefaultValue(defaultValue));
      }
      this.change(valueWidget);
    });
  }

  // =====================================
  // == HELPERS
  // =====================================

  private onOpen (): void {
    this._formWasDirtyWhenPanelOpened = gwForm.isDirty();
    this.findInputsThatDifferFromDefaults();
    this.enableOrDisableRestoreDefaultsButton();
    this.storeUnderlyingPageFocus();

    this.setupFocusLock();
  }

  private setupFocusLock (): void {
    const bottomSection: HTMLDivElement | null = document.getElementById("gw-PrefPanel--bottom") as HTMLDivElement;
    if (!bottomSection) {
      return;
    }

    const allPrefs = bottomSection.querySelectorAll(".gw-Pref--val");
    const lastPref = allPrefs[allPrefs.length - 1];

    if (lastPref) {
      lastPref.setAttribute("data-gw-focus-lock-bottom", "");
    }

    gwFocus.forceFocus(bottomSection, true);
  }

  private getPrefNameFromDomIdOrName (domIdOrName: string): string {
    return domIdOrName.replace("GwPreference_", "");
  }

  private close (): void {
    gwUtil.hideOnDemandElement(this.PREF_PANEL_ID);
    this._dirtyPrefs.clear();
    this._inputsThatDifferFromDefaults.clear();
    this.restoreUnderlyingPageFocus();
  }

  /**
   * Store the currently focused page element
   * Mark all panels with -1 tabindex, and aria-hidden
   */
  private storeUnderlyingPageFocus (): void {
    this._underlyingPageFocus = gwFocus.getCurrentFocus();

    this.getPrimaryPanels().forEach(el => {
      el.setAttribute("tabindex", "-1");
      el.setAttribute("aria-hidden", "true");
    });
  }

  /**
   * Remove tabindex -1, and aria-hidden from all panels
   * forceFocus onto _underlyingPageFocus
   */
  private restoreUnderlyingPageFocus (): void {
    this.getPrimaryPanels().forEach(el => {
      el.removeAttribute("tabindex");
      el.removeAttribute("aria-hidden");
    });
    if (this._underlyingPageFocus) {
      gwFocus.forceFocus(this._underlyingPageFocus, true);
    }
  }

  private getPrimaryPanels (): HTMLDivElement[] {
    const panels: HTMLDivElement[] = [];

    panels.push(document.getElementById("gw-north-panel") as HTMLDivElement);
    panels.push(document.getElementById("gw-west-panel") as HTMLDivElement);
    panels.push(document.getElementById("gw-center-panel") as HTMLDivElement);
    panels.push(document.getElementById("gw-south-panel") as HTMLDivElement);

    return panels.filter(Boolean);
  }

  private getAllPrefValueWidgets (): GwDomNodeList {
    return gwUtil.getDomNodes(".gw-Pref");
  }

  // =====================================
  // == ENACT PREFERENCES
  // =====================================

  /**
   * @param true if use alternate icon for the MenuActionsWidget
   */
  private setAlternateActionsIcon (bool: boolean): void {
    gwUtil.conditionalAddRemoveClass(bool, ".gw-MenuActionsWidget", ".gw-alternate-actions-icon");
  }

  private setToolbarPrefs (): void {
    gwUtil.conditionalAddRemoveClass(this.getPrefValueByPrefName("leftAlignTopToolbar"), "#gw-center-title-toolbar", ".gw-top-toolbar-left");
  }

  private setTextShadowPref (): void {
    gwUtil.conditionalAddRemoveClass(this.getPrefValueByPrefName("forceTextShadows"), "body", ".gw-force-text-shadows");
  }

  private setDatePrefs (): void {
    gwUtil.conditionalAddRemoveClass(this.getPrefValueByPrefName("smallDatePicker"), "#gw-body", ".gw-small-date-picker");
    gwUtil.conditionalAddRemoveClass(this.getPrefValueByPrefName("complexDatePicker"), "#gw-body", ".gw-complex-date-picker");
  }

  private setDebugPrefs (): void {
    gwApp.shouldFlash = this.getPrefValueByPrefName("showDrawFlash") as boolean;
    gwUtil.conditionalAddRemoveClass(this.getPrefValueByPrefName("showWidgetTypesAsInlineTitles"), "#gw-root-form", "gw-debug-show-widget-types-as-inline-titles");
  }

  private setFontSize (fontSize: string): void {
    if (gwUtil.hasValue(fontSize) && fontSize !== "default") {
      document.body.style.fontSize = fontSize + "px";
    } else {
      document.body.style.fontSize = null as any;
    }
  }

  private setGlobalSpacing (globalSpacingModifier: string): void {
    if (gwUtil.hasValue(globalSpacingModifier) && globalSpacingModifier !== "default") {
      const fontSizeInPx = window.getComputedStyle(document.body, undefined).getPropertyValue("font-size");
      const fontSize = parseFloat(fontSizeInPx);
      document.documentElement.style.fontSize = parseFloat(globalSpacingModifier) * fontSize + "px";
    } else {
      document.documentElement.style.fontSize = null as any;
    }
  }

  private setGeneralPrefs (): void {
    gwUtil.conditionalAddRemoveAttr(this.getPrefValueByPrefName("disableBrowserAutocomplete"), "#gw-root-form", "autocomplete", gwEvents.BREAK_AUTOCOMPLETE_VALUE);
    gwUtil.conditionalAddRemoveClass(this.getPrefValueByPrefName("highlightDirtyData"), "#gw-root-form", "gw-highlight-changed-data");
  }

  private findInputsThatDifferFromDefaults (): void {
    this._inputsThatDifferFromDefaults.clear();
    gwUtil.forEach(this.getAllPrefValueWidgets(), (valueWidget: GwValueWidgetElement) => {
      const inputEl = valueWidget.querySelector("input, select") as GwPrefPanelInput;
      if (this.differsFromDefaultValue(valueWidget, inputEl)) {
        this._inputsThatDifferFromDefaults.add(valueWidget.id);
      }
    });
  }

  private differsFromDefaultValue (valueWidget: GwValueWidgetElement, input: GwPrefPanelInput): boolean {
    const defaultValue = this.getDefaultValue(valueWidget.id);
    return gwInputs.isCheckbox(input)
      ? input.checked !== this.normalizeBooleanDefaultValue(defaultValue)
      : input.value !== this.normalizeStringDefaultValue(defaultValue);
  }

  private normalizeBooleanDefaultValue (defaultValue: string | boolean | undefined): boolean {
    return Boolean(defaultValue);
  }

  private normalizeStringDefaultValue (defaultValue: string | boolean | undefined): string {
    return defaultValue === undefined ? "" : String(defaultValue);
  }

  private getDefaultValue (domIdOrName: string): string | boolean | undefined {
    return gwConfig.prefPanelDefaults()[this.getPrefNameFromDomIdOrName(domIdOrName)];
  }

  private enableOrDisableRestoreDefaultsButton (): void {
    const disabled = this._inputsThatDifferFromDefaults.size() === 0;
    gwUtil.conditionalAddRemoveAttr(disabled, "#gw-PrefPanel--reset", "aria-disabled", "true");
  }

}

export const gwPrefPanel = new GwPrefPanel();
