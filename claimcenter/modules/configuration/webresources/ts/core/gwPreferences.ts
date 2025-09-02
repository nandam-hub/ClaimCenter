import { GwMap } from "../types/gwTypes";
import { GwRegisteredSystem } from "./util/GwRegisteredSystem";
import { gwUtil } from "./util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwPreferences extends GwRegisteredSystem {
  getSystemName(): string {
    return "gwPreferences";
  }

  private serverPrefs: GwMap = {};
  private alteredPrefs: GwMap = {};
  private readonly PREF_STATE_DIV_ID: string = "gw-preferenceState";
  private readonly PREF_INPUT_ID_SELECTOR: string = "#gw-util--preferences";
  private readonly PREF_DIV_ID: string = "gw-preferences";

  // private applyPreferenceFunctions: GwMap = {};

  // /**
  //  * @public
  //  * Allows widget types to be registered against a function used to apply preferences for that widget
  //  */
  // registerApplyPreferenceFunction (widgetType: string, applyPreferenceFunc: string): void {
  //     this.applyPreferenceFunctions[widgetType] = applyPreferenceFunc;
  // }

  /**
   * Stores the given key/value preference under the supplied renderId.
   * These settings are not sent to the server until the next full request.
   */
  storePreference(renderId: string, key: string, value: any, preferenceType: string): void {
    if (!Object.prototype.hasOwnProperty.call(this.alteredPrefs, renderId)) {
      this.alteredPrefs[renderId] = {};
    }
    this.alteredPrefs[renderId].prefType = preferenceType;
    this.alteredPrefs[renderId][key] = value;
  }

  getPreference(renderId: string, key: string): any {
    if (
      Object.prototype.hasOwnProperty.call(this.alteredPrefs, renderId) &&
      Object.prototype.hasOwnProperty.call(this.alteredPrefs[renderId], key)
    ) {
      return gwUtil.convertIfString(this.alteredPrefs[renderId][key]);
    }
    if (
      Object.prototype.hasOwnProperty.call(this.serverPrefs, renderId) &&
      Object.prototype.hasOwnProperty.call(this.serverPrefs[renderId], key)
    ) {
      return gwUtil.convertIfString(this.serverPrefs[renderId][key]);
    }

    return null;
  }

  getPreferences(renderId: string): GwMap {
    const prefs: GwMap = {};

    if (Object.prototype.hasOwnProperty.call(this.serverPrefs, renderId)) {
      gwUtil.forEach(this.serverPrefs[renderId], (val, key) => {
        prefs[renderId][key] = val;
      });
    }

    if (Object.prototype.hasOwnProperty.call(this.alteredPrefs, renderId)) {
      gwUtil.forEach(this.alteredPrefs[renderId], (val, key) => {
        prefs[renderId][key] = val;
      });
    }

    return prefs;
  }

  forcePersistPreferencesToServer(): void {
    gwUtil.refresh();
  }

  hasPreferencesOfType(prefTypeKey: string): boolean {
    for (const renderId in this.alteredPrefs) {
      if (this.alteredPrefs[renderId].prefType === prefTypeKey) {
        return true;
      }
    }

    for (const renderId in this.serverPrefs) {
      if (this.serverPrefs[renderId].prefType === prefTypeKey) {
        return true;
      }
    }

    return false;
  }

  /**
   * Called before a request is sent to the server, adding a hidden input
   * to send the changed preferences to the server, if necessary.
   */
  beforeServerRequest(): void {
    if (Object.keys(this.alteredPrefs).length > 0) {
      gwUtil.getInputElement(this.PREF_INPUT_ID_SELECTOR)!.value = JSON.stringify(this.alteredPrefs);
    }
  }

  /**
   * Called after a request to the server is complete, flushing the preferences if necessary.
   * The preferences system is initialized before all the other systems as the state of the
   * preferences may affect how they work
   */
  init(): void {
    gwUtil.getInputElement(this.PREF_INPUT_ID_SELECTOR)!.value = "";
    if (gwUtil.getUtilityFlag(this.PREF_STATE_DIV_ID)) {
      //Only clear the preferences if the dom node is there and its value is true
      this.clearPrefs();
    }

    //refresh the server preferences
    const preferences = gwUtil.getUtilityJson(this.PREF_DIV_ID);
    if (preferences) {
      this.serverPrefs = preferences;
    } else {
      this.serverPrefs = {};
    }
  }

  // applyPreferences (): void {
  //      gwUtil.forEach(Object.keys(this.applyPreferenceFunctions), (prefKeyType) => {
  //         if (this.hasPreferencesOfType(prefKeyType)) {
  //             this.applyPreferenceFunctions[prefKeyType]();
  //         }
  //     });
  // }

  /**
   * Clears the altered preferences object
   */
  clearPrefs(): void {
    this.alteredPrefs = {};
  }

  resetPreferencesForId(id: string): void {
    this.clearPrefs();
    gwUtil.setEventParam("resetPreferences", id);
    gwUtil.fireEvent("_refresh_");
  }
}

export const gwPreferences = new GwPreferences();
