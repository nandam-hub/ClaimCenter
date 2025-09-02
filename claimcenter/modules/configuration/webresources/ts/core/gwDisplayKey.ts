/**
 * Handles the localization of strings via "display keys" - string identifiers that map to localized string
 * values sent from the server. The display key values are loaded via a separate request to a special request
 * handler, which will create a gw.displaykeyvalues object which has a key for each available language code.
 * The values are objects whose keys are display key strings (for example Web.Client.XXX) and whose values are
 * the localized strings. A localized string may contain argument substitutions of the form {0}, {1} etc. These
 * are replaced by the extra arguments to the "get" function e.g. calling get("Web.Client.XXX", "Y"), where
 * Web.Client.XXX maps to "Problem with {0}" would return "Problem with Y".
 */
import { gw } from "./gw";
import { gwLocale } from "./gwLocale";
import { GwRegisteredSystem } from "./util/GwRegisteredSystem";
import { gwUtil } from "./util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwDisplayKey extends GwRegisteredSystem {
  getSystemName(): string {
    return "gwDisplayKey";
  }

  get(key: string, ...varArgs: any[]): string {
    // If this is empty, then it hasn't loaded yet.
    if (!gw.displaykeyvalues) {
      gwUtil.devlog(
        "No displaykeyvalues loaded. This is due to a missing displaykeyvalues file. Possibly due to server error, or checksum failure."
      );
      return "[Missing]";
    }
    const defaultLanguageCode = gw.displaykeyvalues.defaultLanguageCode;
    const code = gwLocale.languageCode || defaultLanguageCode;
    let formatString = gw.displaykeyvalues[code][key];
    // eslint-disable-next-line prefer-rest-params
    const formatStringArguments = Array.prototype.slice.call(arguments, 1);
    const substitutionRegex = /\{(\d+)\}/g;

    if (formatString === undefined && code !== defaultLanguageCode) {
      formatString = gw.displaykeyvalues[defaultLanguageCode][key];
    }
    if (formatString === undefined) {
      return "Missing translation for " + key;
    }
    return formatString.replace(substitutionRegex, (match: string, p1: string) => formatStringArguments[parseInt(p1)]);
  }
}

export const gwDisplayKey = new GwDisplayKey();
