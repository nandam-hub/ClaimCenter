import {gwUtil} from "./util/gwUtil";
import {GwOrderDependentInitializableSystem} from "./util/GwOrderDependentInitializableSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwLocale extends GwOrderDependentInitializableSystem {
  getSystemName (): string {
    return "gwLocale";
  }

  private localeCode: string | null = null;
  languageCode: string | null = null;

  orderSpecificInit (isFullReload: boolean): void {
    this.updateLocaleCode();
    this.updateLanguageCode();
  }

  updateLocaleCode (): void {
    const previous = this.localeCode;
    const next = gwUtil.getUtilityInfo("gw-locale");
    if (!next) {
      return;
    }

    this.localeCode = next;
    if (previous && previous !== this.localeCode) {
      gwUtil.fireCustomEvent("localeChanged", {locale: this.localeCode});
    }
  }

  updateLanguageCode (): void {
    const previous = this.languageCode;
    const languageCode = gwUtil.getUtilityInfo("gw-language");
    if (!languageCode) {
      throw new Error("Missing language configuration element");
    }

    this.languageCode = languageCode;

    if (previous && previous !== this.languageCode) {
      this.onLanguageChange();
      gwUtil.fireCustomEvent("languageChange", {language: this.languageCode});
    }
  }

  onLanguageChange (): void {
    if (this.languageCode) {
      // getting the first two or three digits from language (ignore the region - for example only get `en` for language - `en_US_CA`)
      const shortLangCodeEnd = this.languageCode.indexOf("_");
      const languageCode = (shortLangCodeEnd > 0) ? this.languageCode.slice(0, shortLangCodeEnd) : this.languageCode;
      const htmlElement = gwUtil.getDomNode("html");
      if (htmlElement && languageCode && htmlElement.getAttribute("lang") !== languageCode) {
        htmlElement.setAttribute("lang", languageCode);
      }
    }
  }

  getDecimalSymbol (): string {
    return gwUtil.getUtilityInfo("gw-decimal-symbol") || ".";
  }

  getThousandsSymbol (): string {
    return gwUtil.getUtilityInfo("gw-thousands-symbol") || ",";
  }

  getMinWeekdays (): string[] {
    return gwUtil.getUtilityInfo("gw-minDays").split("++").filter(val => gwUtil.hasValue(val)) || ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  }

  getShortWeekdays (): string[] {
    return gwUtil.getUtilityInfo("gw-shortDays").split("++").filter(val => gwUtil.hasValue(val)) || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  }

  getWeekdays (): string[] {
    return gwUtil.getUtilityInfo("gw-days").split("++").filter(val => gwUtil.hasValue(val)) || ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  }

  getShortMonths (): string[] {
    return gwUtil.getUtilityInfo("gw-shortMonths").split("++").filter(val => gwUtil.hasValue(val)) || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  }

  getMonths (): string[] {
    return gwUtil.getUtilityInfo("gw-months").split("++").filter(val => gwUtil.hasValue(val)) || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  }

  getPeriods (): string[] {
    return gwUtil.getUtilityInfo("gw-amPmInfo").split("++").filter(val => gwUtil.hasValue(val)) || ["AM", "PM"];
  }

  getFirstDayOfWeek (): number {
    const firstDay = gwUtil.getUtilityInfo("gw-firstDayOfWeek");
    return firstDay ? parseInt(firstDay) : 0;
  }
}

export const gwLocale = new GwLocale();
