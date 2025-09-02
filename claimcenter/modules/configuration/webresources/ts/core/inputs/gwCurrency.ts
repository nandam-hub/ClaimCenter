import {gwUtil} from "../util/gwUtil";
import {GwMap, GwValueWidgetElement, HTMLTextInputElement} from "../../types/gwTypes";
import {gwDisplayKey} from "../gwDisplayKey";
import {GwNumberFormatInfo} from "./GwNumberFormatInfo";
import {GwInitializableSystem} from "../util/GwInitializableSystem";
import {gwPrefPanel} from "../gwPrefPanel";
import {gwInputSystems} from "./gwInputSystems";
import {gwInputs} from "./gwInputs";
import {GwCharReplacer} from "./GwCharReplacer";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwCurrency extends GwInitializableSystem {
  macros: GwMap = {};
  macroChars: string[] = [];

  /**
   * Currency Macros
   * Currently only single chars are supported. Macro characters are NOT case sensitive.
   * Examples:
   * 107b => 107,000,000,000
   * 1.9m => 1,900,000
   * These are not multipliers, so changing the values to anything other than 0s will not have the effect you expect
   * display.properties defines the single keys for each amount, per language
   */
  macroZeroMap: GwMap = {
    thousand: "000",
    million: "000000",
    billion: "000000000",
    trillion: "000000000000"
  };

  getSystemName (): string {
    return "gwCurrency";
  }

  init (isFullPageReload: boolean): void {
    this.setupCurrencyMacroCharacters();
  }

  private setupCurrencyMacroCharacters (): void {
    const macrosArr = gwUtil.getUtilityJson("gw-currencyMacros") || ["k", "m", "b", "t"];

    const finalObj: GwMap = {};
    finalObj[macrosArr[0]] = gwCurrency.macroZeroMap.thousand;
    finalObj[macrosArr[1]] = gwCurrency.macroZeroMap.million;
    finalObj[macrosArr[2]] = gwCurrency.macroZeroMap.billion;
    finalObj[macrosArr[3]] = gwCurrency.macroZeroMap.trillion;
    Object.freeze(finalObj);

    this.macros = finalObj;
    this.macroChars = Object.keys(finalObj);
  }

  private escapeCurrencySymb (cSymb: string): string {
    // $ is the only char we need to escape
    let escapedSymb = cSymb.replace("$", "\\\$");
    if (cSymb.length > 1) {
      escapedSymb = "(" + escapedSymb + ")";
    }

    return escapedSymb;
  }

  private getCurrencyFormatRegEx (currencyInfo: GwNumberFormatInfo): RegExp {
    const escapedCurrSymb = this.escapeCurrencySymb(currencyInfo.symb || "$");

    let regStr = "^-?" + escapedCurrSymb + "?(([1-9]\\d{0,2}(" + currencyInfo.grouping + "\\d{3})*)|\\d+)?";
    if (currencyInfo.maxDecimalDigits && currencyInfo.maxDecimalDigits > 0) {
      regStr += "(\\" + currencyInfo.radix + "\\d{1," + currencyInfo.maxDecimalDigits + "})?"; // Radix followed by up to digits
    }
    regStr += escapedCurrSymb + "?";
    regStr += "$"; // end of string NOT currency symbol
    return new RegExp(regStr, "igm");
  }

  private stripFirstAndLastCharsIfParens (pastedValue: string): string {
    if (pastedValue && pastedValue[0] === "(" && pastedValue[pastedValue.length - 1] === ")") {
      return pastedValue.substring(1, pastedValue.length - 1);
    }

    return pastedValue;
  }

  /**
   * Method called when paste is triggered on a currency input.
   * 1. Does extra logic to determine whether we need to throw up an alert if the pasted value is formatted correctly.
   * @param el
   * @param args
   * @param e
   */
  pasteOnCurrencyInput (valueWidget: GwValueWidgetElement, args: GwMap, e: ClipboardEvent): boolean {
    const clipboardData = e.clipboardData || (window as any).clipboardData;
    const pastedData = clipboardData.getData("Text");

    const el = e.target as HTMLInputElement;

    const cInfo = GwNumberFormatInfo.getNumberFormatInfo(el, valueWidget);
    if (!cInfo) {
      return true;
    }

    // Trim leading/trailing white space.  The trimmed pasted data can be surrounded by parentheses to denote a
    // negative number (no need to add a negative sign to the testValue as the testValue is only used for validation)
    const testValue = this.stripFirstAndLastCharsIfParens(pastedData.trim());

    const regEx = this.getCurrencyFormatRegEx(cInfo);
    if (!regEx.test(testValue)) {
      alert(gwDisplayKey.get("Web.Client.ConfirmPasteBadCurrency", pastedData));
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Method called when copy or cut is triggered on a currency input.
   * 1. Does extra logic to determine whether it should affix the prefix and suffix to the clipboard value.
   * 2. If the value is determined to be negative, then moves the prefix or suffix currency symbols inside of the
   *    negative symbol. ie: -$500.98 or ($500.98)
   * @param el
   * @param args
   * @param e
   */
  copyOnCurrencyInput (el: HTMLTextInputElement, args: GwMap, e: ClipboardEvent): void {
    const val = el.value;
    const selectionStart = el.selectionStart || 0;
    const selectionEnd = el.selectionEnd || 0;

    const name = el.getAttribute("name");
    const prefixEl = document.getElementById(name + "_prefix");
    const suffixEl = document.getElementById(name + "_suffix");
    let prefixVal = prefixEl ? prefixEl.innerHTML : "";
    let suffixVal = suffixEl ? suffixEl.innerHTML : "";

    if (!gwPrefPanel.getPrefValueByPrefName("copyAndCutGrabSymbol")) {
      prefixVal = "";
      suffixVal = "";
    }

    let finalVal = val;
    const selectAll = selectionEnd === selectionStart;
    // If they have selected a specific selection range, then only give them that
    if (!selectAll) {
      finalVal = val.substring(selectionStart, selectionEnd);
    }

    if (selectAll || selectionStart === 0) {
      const firstChar = finalVal[0];
      if (firstChar === "-" || firstChar === "(") {
        finalVal = firstChar + prefixVal + finalVal.substring(1);
      } else {
        finalVal = prefixVal + finalVal;
      }
    }

    if (selectAll || selectionEnd >= val.length) {
      if (finalVal[finalVal.length - 1] === ")") {
        finalVal = finalVal.substring(0, finalVal.length - 2) + suffixVal + ")";
      } else {
        finalVal += suffixVal;
      }
    }

    if (e.clipboardData || (window as any).clipboardData) {
      (e.clipboardData || (window as any).clipboardData).setData("text", finalVal);
    } else {
      gwUtil.devlog("clipboardData object not present on event or window");
    }

    // If this is a cut, then we need to manually delete the selected area since we'll be preventingDefault
    if (e.type === "cut") {
      gwInputs.setValueOnTextInputElement(el, val.substring(0, selectionStart) + val.substring(selectionEnd, val.length), selectionStart, false, "currency");
    }
  }

  valueChangedSoProcessCurrencyInfo (valueWidget: GwValueWidgetElement, el: HTMLTextInputElement): void {
    const valAndCursorPos = gwInputSystems.handleGroupingDecimalsAndMacros(valueWidget, el);
    gwInputs.setValueOnTextInputElement(el, valAndCursorPos.value, valAndCursorPos.cursorPos, false, "currency");
  }
}

export const gwCurrency = new GwCurrency();
