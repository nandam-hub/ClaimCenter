import { gwDateValue } from "../../comp/dates/gwDateValue";
import { gwJic } from "../../comp/dates/gwJic";
import { gwJicHelper } from "../../comp/dates/gwJicHelper";
import {
  GwDomNode,
  GwEventType,
  GwInputElement,
  GwMap,
  GwValueAndCursorPos,
  GwValueWidgetElement,
  GW_BREAKER,
  HTMLTextInputElement,
} from "../../types/gwTypes";
import { gwAria } from "../aria/GwAria";
import { gwEvents } from "../events/gwEvents";
import { gwForm } from "../gwForm";
import { gwHelpText } from "../gwHelpText";
import { gwPrefPanel } from "../gwPrefPanel";
import { gwResizer } from "../gwResizer";
import { GwRegisteredSystem } from "../util/GwRegisteredSystem";
import { gwUtil } from "../util/gwUtil";
import { gwAutocomplete } from "./gwAutocomplete";
import { gwClientValidation, GwUserInputRestriction } from "./gwClientValidation";
import { gwCurrency } from "./gwCurrency";
import { gwInputs } from "./gwInputs";
import { GwNumberFormatInfo } from "./GwNumberFormatInfo";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwInputSystems extends GwRegisteredSystem {
  getSystemName(): string {
    return "gwInputSystems";
  }

  // This needs to match the default placeholder character in TextValueInputMask.java
  private readonly DEFAULT_INPUT_MASK_PLACEHOLDER_CHAR: string = "#";
  private readonly clearTrailingMaskCharacters: boolean = true;
  private readonly DATE_COMPLETION_CHARS: GwMap = { " ": true, ".": true, ",": true, ":": true, "\\": true, "/": true, "-": true };
  private readonly maxIllegalCharsBeforePunting: number = 3;

  getCursorPos(el: HTMLTextInputElement | HTMLTextAreaElement): number {
    return el.selectionStart ?? 0;
  }

  setCursorPos(el: HTMLTextInputElement | HTMLTextAreaElement, cursorPos: number): void {
    return this.setSelectionRange(el, cursorPos, cursorPos);
  }

  setCursorPosToEnd(el: HTMLTextInputElement | HTMLTextAreaElement): void {
    return this.setCursorPos(el, this.getValueWithMaskTrimmed(el).length);
  }

  setSelectionRange(el: HTMLTextInputElement | HTMLTextAreaElement, start: number, end: number): void {
    el.selectionStart = start;
    el.selectionEnd = end;
  }

  forcePickerIntoVerticalAlignment(
    parent: GwDomNode,
    input: GwInputElement,
    addonDiv: GwDomNode,
    putAbove: boolean,
    alignRight: boolean = false
  ): void {
    this.preventFloatingElementFromBeingOffscreen(parent, input, addonDiv, alignRight, undefined, putAbove ? "above" : "below");
  }

  // specific logic used by currency and date to figure out the index of first modified character.
  getFirstModifiedIndex(previous: string, current: string, cursorPos: number): number {
    const addedChars = Math.max(0, current.length - previous.length);
    const limit = cursorPos - addedChars;
    let i = 0;
    for (; i < limit; i++) {
      const prevChar = previous[i];
      const currChar = current[i];

      if (prevChar === undefined && currChar === undefined) {
        break;
      }

      if (prevChar === currChar) {
        continue;
      }

      break;
    }

    return i;
  }
  /**
   * Takes a floating element div and attempts to to align it left | right | above | below
   * inside of a parent div, using an input div as it's alignment
   * Has an option to "force" the position above or below, regardless of space, this is for the situations in which more than 1 picker is on an input
   * By default, it will also limit the height and width of the picker div, and set it to scroll, if there isn't enough screen space
   * This behavior can be disabled via restrictToViewableScreen = false
   *
   * NOTE: passing a pickerDiv to this function will remove inline style widths and overflows from it.
   * If you DO NOT want this to happen, then you need to set restrictViewableScreen to false and handle height and width management yourself
   * @param {GwDomNode} parent
   * @param {GwInputElement} input
   * @param {GwDomNode} floatingDiv
   * @param {boolean} alignRight
   * @param {boolean} placeAbove
   * @param {"above" | "below" | null} forceVPos
   * @param {boolean} restrictToViewableScreen
   * @returns {boolean} true if widget was renderered above
   */
  preventFloatingElementFromBeingOffscreen(
    parent: GwDomNode,
    input: GwInputElement,
    floatingDiv: GwDomNode,
    alignRight: boolean = false,
    placeAbove: boolean = false,
    forceVPos: null | "above" | "below" = null,
    restrictToViewableScreen: boolean = true
  ): boolean {
    const boundaries = {
      top: 0,
      bottom: window.innerHeight,
      left: 0,
      right: window.innerWidth,
    };

    // Clear out inline styles for any picker that might be restricted lower down
    if (restrictToViewableScreen) {
      floatingDiv.style.width = null as any;
      floatingDiv.style.height = null as any;
      floatingDiv.style.overflowX = null as any;
      floatingDiv.style.overflowY = null as any;
    }

    const inputRect = input.getBoundingClientRect();
    const floatingRect = floatingDiv.getBoundingClientRect();

    // -------- Setup ------------
    const floatingWidth = floatingRect.width;
    const bodyWidth = gwResizer.windowWidth;
    const leftPosWhenAlignedLeft = inputRect.left + "px";
    const leftPosWhenAlignedRight = inputRect.right - floatingWidth + "px";

    const floatingHeight = floatingRect.height;
    const bodyHeight = gwResizer.windowHeight;
    const bottomPosWhenAboveInput = bodyHeight - inputRect.top + "px";
    const topPosWhenBelowInput = inputRect.bottom + "px";

    // ------- Horizontal Alignment --------

    const fitsWhenLeft = inputRect.left + floatingWidth <= bodyWidth && inputRect.left >= boundaries.left;
    const fitsWhenRight = inputRect.right - floatingWidth >= 0 && inputRect.right <= boundaries.right;
    const linesUpHorizontally = (alignRight && fitsWhenRight) || (!alignRight && fitsWhenLeft);
    const neitherSideOnScreen = !fitsWhenLeft && !fitsWhenRight;

    if (restrictToViewableScreen && neitherSideOnScreen) {
      floatingDiv.style.width = boundaries.right + "px";
      floatingDiv.style.overflowX = "auto";
    }

    // If both left and right are off the screen, then set the left edge to 0;
    if (neitherSideOnScreen) {
      floatingDiv.style.left = "0px";
    } else if (linesUpHorizontally) {
      floatingDiv.style.left = alignRight ? leftPosWhenAlignedRight : leftPosWhenAlignedLeft;
    } else {
      floatingDiv.style.left = fitsWhenLeft ? leftPosWhenAlignedLeft : leftPosWhenAlignedRight;
    }
    floatingDiv.style.right = "auto";

    // --------- Vertical Alignment ---------

    const fitsWhenAbove = inputRect.top - floatingHeight >= 0 && inputRect.top <= bodyHeight;
    const fitsWhenBelow = inputRect.bottom + floatingHeight <= bodyHeight && inputRect.bottom >= 0;
    const linesUpVertically = (placeAbove && fitsWhenAbove) || (!placeAbove && fitsWhenBelow);
    const neitherEdgeOnScreen = !fitsWhenAbove && !fitsWhenBelow;

    if (restrictToViewableScreen && neitherEdgeOnScreen) {
      floatingDiv.style.overflowY = "auto";
      if (forceVPos === "above" || placeAbove) {
        floatingDiv.style.height = bottomPosWhenAboveInput;
      } else {
        floatingDiv.style.height = boundaries.bottom - inputRect.bottom + "px";
      }
    }

    if (forceVPos === "above") {
      this.renderAddOnDiv(floatingDiv, true, topPosWhenBelowInput, bottomPosWhenAboveInput);
      return true;
    } else if (forceVPos === "below") {
      this.renderAddOnDiv(floatingDiv, false, topPosWhenBelowInput, bottomPosWhenAboveInput);
      return false;
    }

    // If the default alignment works, or both edges of the input are off the screen, use default alignment
    if (linesUpVertically || neitherEdgeOnScreen) {
      this.renderAddOnDiv(floatingDiv, placeAbove, topPosWhenBelowInput, bottomPosWhenAboveInput);
      return placeAbove;
    } else {
      this.renderAddOnDiv(floatingDiv, fitsWhenAbove, topPosWhenBelowInput, bottomPosWhenAboveInput);
      return fitsWhenAbove;
    }
  }

  private renderAddOnDiv(targetDiv: GwDomNode, renderAbove: boolean, topPosWhenBelow: string, bottomPosWhenAbove: string): void {
    if (renderAbove) {
      targetDiv.style.top = "auto";
      targetDiv.style.bottom = bottomPosWhenAbove;
    } else {
      targetDiv.style.top = topPosWhenBelow;
      targetDiv.style.bottom = "auto";
    }
  }

  /**
   * Clears the invalid value status from the ValueWidget parent of the given Node
   */
  clearInvalidValueStatus(node: GwDomNode): void {
    $(node).closest("div.gw-ValueWidget").removeClass("gw-invalid");
  }

  /**
   * Adds an invalid value status from the Valuewidget parent of the given Node
   */
  addInvalidValueStatus(node: GwDomNode): void {
    $(node).closest("div.gw-ValueWidget").addClass("gw-invalid");
  }

  inputEventNotifySystems(valueWidget: GwValueWidgetElement, args: GwMap, e: GwEventType): void {
    this.notifySystemsOfInputValueChange(e.target as HTMLTextInputElement, null, args, e);
  }

  pasteEventNotifySystems(valueWidget: GwValueWidgetElement, args: GwMap, e: GwEventType): void {
    if (valueWidget.hasAttribute("data-gw-currency")) {
      gwCurrency.pasteOnCurrencyInput(valueWidget, args, e as ClipboardEvent);
    }
  }

  copyEventNotifySystems(
    valueWidget: GwValueWidgetElement,
    args: GwMap,
    e: GwEventType
  ): void | { forceCurrentEventDefaultBehaviorAndPropagation: boolean } {
    // Don't do anything special if it's a readonly value widget, as it will just be a single chunk of text
    if (gwInputs.isReadOnlyValueWidget(valueWidget)) {
      return { forceCurrentEventDefaultBehaviorAndPropagation: true };
    }

    if (valueWidget.hasAttribute("data-gw-input-mask")) {
      this.copyOnInputMask(e.target as HTMLTextInputElement, args, e as ClipboardEvent);
    } else if (valueWidget.hasAttribute("data-gw-currency")) {
      gwCurrency.copyOnCurrencyInput(e.target as HTMLTextInputElement, args, e as ClipboardEvent);
    } else if (gwDateValue.isDateTimeElement(valueWidget)) {
      this.copyOnDateValue(e.target as HTMLTextInputElement, args, e as ClipboardEvent);
    }
  }

  notifySystemsOfInputValueChange(inputEl: HTMLTextInputElement, ignoreSystem?: GwInputSystemType, args?: GwMap, e?: GwEventType): void {
    const valueWidget = gwForm.findEnclosingValueWidget(inputEl);
    if (!valueWidget) {
      return;
    }

    if (ignoreSystem !== "autocomplete" && valueWidget.hasAttribute("data-gw-autocomplete")) {
      gwAutocomplete.autocomplete(inputEl);
    }

    if (valueWidget.hasAttribute("data-gw-currency")) {
      if (ignoreSystem !== "currency") {
        gwCurrency.valueChangedSoProcessCurrencyInfo(valueWidget, inputEl);
      }
    } else if (valueWidget.hasAttribute("data-gw-datetime")) {
      if (ignoreSystem !== "date") {
        this.valueChangedSoProcessDateInfo(valueWidget, inputEl);
      }
    } else if (
      ignoreSystem !== "inputmask" &&
      (valueWidget.hasAttribute("data-gw-input-mask") ||
        valueWidget.hasAttribute("data-gw-restricted-input") ||
        valueWidget.hasAttribute("data-gw-email"))
    ) {
      this.valueChangedSoProcessInputMask(valueWidget, inputEl);
    }

    if (ignoreSystem !== "picker" && ignoreSystem !== "datepicker") {
      gwDateValue.notifyPickerOfInputChange(valueWidget, inputEl);
    }

    gwUtil.eventLog("notifySystemsOfInputValueChange: setPendingChangesOnValueWidget: ", valueWidget);
    gwEvents.setPendingChangesOnValueWidget(valueWidget);

    gwForm.inputElementChanged(valueWidget);
  }

  /**
   * We use this to handle the times where a placeholder has been translated in a way that renders it an illegal mask value.
   * We only return the ph if it's the same length as the mask, otherwise, we return the mask
   * @param {GwInputElement} el
   * @param {string} mask
   * @returns {string}
   */
  private getPlaceholderValueOrMaskIfPlaceholderIsIncorrectLength(el: GwInputElement, mask: string): string {
    const ph = el.hasAttribute("placeholder") ? el.getAttribute("placeholder") : mask;
    return ph && ph.length === mask.length ? ph : mask;
  }

  /**
   * For elements that track previous value via data-gw-prev, when that element has not been edited
   * Then the original attribute "value" needs to be used. (Note: this is not the same as el.value).
   * El.value returns the current value of the element in the DOM, el.getAttribute("value") returns
   * the value the element had when it last came down from the server.
   *
   * BUT! If the event is a paste event, and there's no previous value, then we just want to return an empty string
   * So that the pasted value, when compared to the empty string, doesn't cause last position and input mask problems
   * @param el
   * @private
   */
  private getPreviousInputValueForKeyOrPasteEvent(el: GwInputElement): string {
    if (el.hasAttribute("data-gw-prev")) {
      return el.getAttribute("data-gw-prev") || "";
    } else if (gwEvents.pasteCausedCurrentInputEvent) {
      return "";
    } else {
      return el.getAttribute("value") || "";
    }
  }

  /**
   * This method is only called by valueChangedSoProcessInputMask if the input has userRestrictedInput but NOT an input mask
   * It takes the userRestrictedInput and filters the element's value using the associated regex
   * while adjusting the cursor position accordingly.
   *
   * For some restrictedInput types it also adds grouping separators
   * @param {GwInputElement} el
   * @param {string} userRestrictedInput
   */
  private handleUserInputRestrictionForInputsWithoutMasks(
    valueWidget: GwValueWidgetElement,
    el: HTMLTextInputElement,
    restrictedInput: string
  ): void {
    if (!restrictedInput || restrictedInput === "all") {
      // No work needed.
      return;
    }

    const val = el.value;

    if (val === null || val.length === 0) {
      return;
    }

    const userRestrictedInput: GwUserInputRestriction = gwClientValidation.getRestrictionTypeFromString(restrictedInput);

    if (gwClientValidation.userRestrictionTypeUsesGroupingFormatting(userRestrictedInput)) {
      const valueAndCursorPos = this.handleGroupingDecimalsAndMacros(valueWidget, el);
      gwInputs.setValueOnTextInputElement(el, valueAndCursorPos.value, valueAndCursorPos.cursorPos, false, "inputmask");
      return;
    }

    const regExp = gwClientValidation.getRegexForRestrictionTypeFromString(userRestrictedInput);
    const cursorPos = this.getCursorPos(el);

    let finalVal = "";

    const prevVal = this.getPreviousInputValueForKeyOrPasteEvent(el);
    const diffSize = val.length - prevVal.length;
    const charBeforeCursor = val[cursorPos - 1];

    let finalCursorPos = cursorPos;
    // =====================================
    // == REMOVE ALL INVALID CHARS
    // =====================================
    let illegalChars = "";
    for (let i = 0; i < val.length; i++) {
      const char = val[i];
      if (char.match(regExp)) {
        finalVal += char;
      } else if (i <= cursorPos) {
        finalCursorPos--;
        illegalChars += char;
      }
    }

    if (diffSize === 1 && !this.isValidChar(charBeforeCursor, regExp)) {
      gwClientValidation.userInputRejectedSingleCharacter(el, charBeforeCursor);
    } else if (illegalChars.length > 0) {
      gwClientValidation.userInputRejectedOnPaste(el, illegalChars);
    }

    gwInputs.setValueOnTextInputElement(el, finalVal, finalCursorPos, false, "inputmask");
  }

  private isValidChar(char: string, regex: RegExp): boolean {
    if (char.length !== 1) {
      throw new Error("Attempting to pass string to a method that expects a single char.");
    }

    const matchArray = char.match(regex);
    return matchArray !== null && matchArray.length > 0;
  }

  private valueChangedSoProcessInputMask(valueWidget: GwValueWidgetElement, el: HTMLTextInputElement): void {
    if (!el) {
      return;
    }

    if (el.type === "password") {
      return;
    }

    const nonLocalizedInputMask = valueWidget.getAttribute("data-gw-input-mask");
    const userRestrictedInput = valueWidget.getAttribute("data-gw-restricted-input");

    if (!nonLocalizedInputMask) {
      if (userRestrictedInput) {
        this.handleUserInputRestrictionForInputsWithoutMasks(valueWidget, el, userRestrictedInput);
      } else if (valueWidget.hasAttribute("data-gw-email")) {
        gwClientValidation.handleValidationForEmailType(el);
      }
      return;
    }

    const mask = nonLocalizedInputMask;
    let hasDisplayedClientValidationMessage = false;

    const placeholderCharacter = valueWidget.getAttribute("data-gw-input-mask-placeholder") || this.DEFAULT_INPUT_MASK_PLACEHOLDER_CHAR;

    let currentFullInputValue = el.value;
    const originalValue = "" + currentFullInputValue;
    if (!gwUtil.hasValue(currentFullInputValue) || currentFullInputValue.length === 0) {
      //Let the placeholder handle it
      gwInputs.setValueOnTextInputElement(el, null, 0, false, "inputmask");
      return;
    }

    let cursorPos = this.getCursorPos(el);

    currentFullInputValue = gwUtil.convertAllWhitespaceToStandard(currentFullInputValue);

    const previousFullInputValue = this.getPreviousInputValueForKeyOrPasteEvent(el);
    const diffSize = currentFullInputValue.length - previousFullInputValue.length;
    const userAddedACharacter = diffSize >= 0;
    const userRemovedAChar = !userAddedACharacter;

    if (diffSize > mask.length * 3) {
      // This cannot be what the user intended to paste;
      gwInputs.setValueOnTextInputElement(el, previousFullInputValue, 999, false, "inputmask");
      gwClientValidation.userInputRejectedOnPaste(el, originalValue);
      return;
    }

    const placeholderCharMatcher: RegExp = new RegExp(gwUtil.escapeForRegExp(placeholderCharacter), "g");
    const validInputCharRegex: RegExp = gwClientValidation.getRegexForRestrictionTypeFromString(userRestrictedInput);

    const placeholderMaskChars: GwMap = {}; // by default is #, if mask isDateTimeMask, then it's also any letters
    const staticMaskChars: GwMap = {}; // Anything in the input mask that is not a phChar
    // Build sets of placeholder characters and special character based on the inputMask and isDateTimeMask flag
    gwUtil.forEach(mask, (c) => {
      if (c.match(placeholderCharMatcher)) {
        placeholderMaskChars[c] = true;
      } else {
        staticMaskChars[c] = true;
      }
    });

    const isValidNonPlaceholderChar = (char: string): boolean => {
      if (placeholderMaskChars[char]) {
        return false;
      }

      return this.isValidChar(char, validInputCharRegex);
    };

    const containsValidNonPlaceholderChar = (str: string): boolean => {
      for (const char of str) {
        if (isValidNonPlaceholderChar(char)) {
          return true;
        }
      }

      return false;
    };

    const possiblyFillOutWithMask = (val: string) => {
      if (val.length < mask.length) {
        return val + mask.slice(val.length);
      }

      return val;
    };

    if (!mask) {
      return;
    }

    const singleTypedCharMatchesNextStaticMask = (): boolean => {
      if (!userAddedACharacter || cursorPos <= 0) {
        return false;
      }

      const addedChar = currentFullInputValue[cursorPos - 1];
      const nextCharInMask = mask[cursorPos - 1];

      if (addedChar === undefined) {
        return false;
      }

      return addedChar === nextCharInMask;
    };

    // =====================================
    // == CHECK FOR SINGLE CHAR MATCHING MASK AND POSSIBLY EXIT
    // =====================================
    if (singleTypedCharMatchesNextStaticMask()) {
      const withSlicedOutChar = currentFullInputValue.slice(0, cursorPos) + currentFullInputValue.slice(cursorPos + 1);
      gwInputs.setValueOnTextInputElement(el, possiblyFillOutWithMask(withSlicedOutChar), cursorPos, false, "inputmask");
      return;
    }

    // =====================================
    // == FIGURE DIFF & STORE OFF ADDED CHARS
    // =====================================
    const modifiedStartIndex = this.getFirstModifiedIndex(
      gwUtil.hasValue(previousFullInputValue) ? previousFullInputValue : mask,
      currentFullInputValue,
      cursorPos
    );

    let addedChars: string[] = currentFullInputValue.slice(modifiedStartIndex, cursorPos).split("");
    if (!hasDisplayedClientValidationMessage && addedChars.length > mask.length + 1) {
      gwClientValidation.warnAboutUserInput(el, addedChars.join(""));
      hasDisplayedClientValidationMessage = true;
    }

    const illegalUserChars: string[] = [];
    let cursorOffset = 0;
    // =====================================
    // == CLEAN INVALID CHARS FROM ADDED
    // =====================================
    // NOTE: this is a bit of a design decision here. If someone has pasted invalid characters, we clean them out
    //
    if (addedChars.length > 0) {
      const tempAddedChars = [];
      for (let i = 0; i < addedChars.length; i++) {
        const addedChar = addedChars[i];
        const maskChar = mask[modifiedStartIndex + i];
        if (addedChar !== maskChar && isValidNonPlaceholderChar(addedChar)) {
          tempAddedChars.push(addedChar);
        } else if (addedChar !== maskChar) {
          illegalUserChars.push(addedChar);
          if (modifiedStartIndex + i <= cursorPos) {
            cursorOffset--;
          }
        }
      }
      addedChars = tempAddedChars;
    }

    // =====================================
    // == REBUILD VALUE WITH ADDED CHARS REMOVED OR DELETED CHAR FILLED WITH MASK
    // =====================================
    const firstPart = currentFullInputValue.slice(0, modifiedStartIndex);
    const replaceFill = diffSize < 0 ? mask.substr(modifiedStartIndex, -1 * diffSize) : "";
    const finalPart = currentFullInputValue.slice(cursorPos);

    cursorPos += cursorOffset;

    currentFullInputValue = firstPart + replaceFill + finalPart;

    if (currentFullInputValue.length < mask.length) {
      currentFullInputValue = currentFullInputValue.concat(mask.slice(currentFullInputValue.length));
    }

    let finalValueForElement = firstPart;

    // =====================================
    // == WALK THE MASK FOR DIFFED SECTION OF VALUE & FILL ADDED CHARS BACK IN
    // =====================================
    for (let iMask = finalValueForElement.length; iMask < mask.length; iMask++) {
      const maskChar = mask[iMask];
      const valChar = currentFullInputValue[iMask];

      if (valChar === undefined || valChar === null) {
        throw new Error("Reached unexpected end of value for input. The value at this point should be the same length as the mask.");
      }

      const currentMaskCharIsPlaceholder = !!placeholderMaskChars[maskChar];
      const currentValCharIsValidInput = isValidNonPlaceholderChar(valChar);

      // =====================================
      // == INSERT ONE OF THE VALID ADDED CHARS INTO THE PH SLOT
      // =====================================
      if (currentMaskCharIsPlaceholder && addedChars.length > 0) {
        finalValueForElement += addedChars.shift();
        cursorPos = iMask + 1;
        continue;
      }

      // =====================================
      // == VAL CHAR IS VALID AND MASK IS PH SO USE VAL
      // =====================================
      if (currentMaskCharIsPlaceholder && currentValCharIsValidInput) {
        finalValueForElement += valChar;
        continue;
      }

      // =====================================
      // == NOTHING ELSE WORKED JUST USE THE MASK
      // =====================================
      finalValueForElement += maskChar;
    }

    // If all that's left in the input is the mask, then blank it, and let the PH kick in.
    if ((userRemovedAChar || illegalUserChars.length > 0) && finalValueForElement === mask) {
      finalValueForElement = "";
    }

    gwInputs.setValueOnTextInputElement(el, finalValueForElement, cursorPos, false, "inputmask");

    // =====================================
    // == NOTIFY USER OF ILLEGAL CHARACTERS FOUND
    // =====================================
    if (!hasDisplayedClientValidationMessage) {
      if (illegalUserChars.length === 1) {
        gwClientValidation.userInputRejectedSingleCharacter(el, illegalUserChars[0]);
      } else if (illegalUserChars.length > 1) {
        gwClientValidation.userInputRejectedOnPaste(el, illegalUserChars.join(" "));
      } else if (addedChars.length > 0) {
        gwClientValidation.warnAboutUserInput(el, addedChars.join(" "));
      } else if (currentFullInputValue.length > mask.length) {
        const overflowLost = currentFullInputValue.slice(mask.length);
        if (containsValidNonPlaceholderChar(overflowLost)) {
          gwClientValidation.warnAboutUserInput(el, overflowLost);
        }
      }
    }
  }

  /**
   * This is a duplicate of valueChangedSoProcessInputMask, but with a bunch of extra date logic.
   * One day, would be great to simplify the date logic, or abstract it out into function calls
   * @param {GwValueWidgetElement} valueWidget
   * @param {HTMLTextInputElement} el
   */
  valueChangedSoProcessDateInfo(valueWidget: GwValueWidgetElement, el: HTMLTextInputElement): void {
    if (!el) {
      return;
    }

    if (!gwPrefPanel.getPrefValueByPrefName("enableNumericAutoFormatting")) {
      return;
    }

    const addPaddingZeroToSingleDigit = (str: string): string => {
      if (!str) {
        return "";
      }
      // replace any digit preceded by a non digit or string start and followed by a non digit or string end by 0 plus that digit
      return str.replace(/(^|\D)(\d)(?=$|\D)/g, "$10$2");
    };

    function getYearLead(dateTwoDigit: number): number {
      let yearLead = gwDateValue.getTwoDigitYearEarly() || 19;
      // If two digit date is above a certain value, then assume one century, if it's below, assume another
      if (dateTwoDigit < (gwDateValue.getTwoDigitYearThreshold() || 50)) {
        yearLead = gwDateValue.getTwoDigitYearLate() || 20;
      }

      return yearLead;
    }

    const isDateInput = gwDateValue.isDateInputElement(el);
    const isTimeInput = !isDateInput;

    const timeMask = valueWidget.getAttribute("data-gw-time-mask");
    const dateMask = valueWidget.getAttribute("data-gw-date-mask");

    const nonLocalizedMask = isDateInput ? dateMask : timeMask;

    if (!nonLocalizedMask) {
      return;
    }

    let mask = nonLocalizedMask;

    let hasDisplayedClientValidationMessage = false;
    let dateHandledOverflowCharacters: boolean = false;

    let currentFullInputValue = el.value;
    let originalValue = "" + currentFullInputValue;
    if (!gwUtil.hasValue(currentFullInputValue) || currentFullInputValue.length === 0) {
      //Let the placeholder handle it
      const eraInputValue = gwUtil._isSimulatedDOM() ? "" : gwJicHelper.getEraInputValue(el);
      if (eraInputValue !== "") {
        gwJicHelper.resetEraInputValue(el);
      }
      gwInputs.setValueOnTextInputElement(el, null, 0, false, "date");
      return;
    }

    let cursorPos = this.getCursorPos(el);

    currentFullInputValue = gwUtil.convertAllWhitespaceToStandard(currentFullInputValue);

    const previousFullInputValue = this.getPreviousInputValueForKeyOrPasteEvent(el);
    const diffSize = currentFullInputValue.length - previousFullInputValue.length;
    let userAddedACharacter = diffSize >= 0;
    const userRemovedAChar = !userAddedACharacter;

    if (diffSize > mask.length * 3) {
      // This cannot be what the user intended to paste;
      gwInputs.setValueOnTextInputElement(el, previousFullInputValue, 999, false, "date");
      gwClientValidation.userInputRejectedOnPaste(el, originalValue);
      return;
    }

    const relatedTimeInput = gwDateValue.getTimeInputChildOrSibling(el);
    const relatedAmPmInput = gwDateValue.getAmPmHiddenInputChildOrSibling(el);
    const relatedAmPmButton = gwDateValue.getAmPmButtonChildOrSibling(el);

    if ((relatedAmPmInput && !relatedAmPmButton) || (!relatedAmPmInput && relatedAmPmButton)) {
      throw new Error("AM/PM button should always exist if the hidden form input exists and vice versa");
    }

    const willOverflowPastedValuesToNextInput: boolean = !!(isDateInput ? relatedTimeInput : relatedAmPmInput);

    const processPastedInputStr = (inputStr: string) => {
      if (!gwEvents.pasteCausedCurrentInputEvent) {
        return null;
      }

      const DATE_SEPARATOR = "/";
      const TIME_SEPARATOR = ":";
      const DATE_FORMAT_SEPARATOR_REGEX: RegExp = /[-.]/g;

      if (isDateInput && dateMask) {
        const tokenizedDateTimeStr = inputStr.split(" ");

        // Use mask to infer date format for pasted value
        const tokenizedDateMask = dateMask.replace(DATE_FORMAT_SEPARATOR_REGEX, DATE_SEPARATOR).split(DATE_SEPARATOR);
        const tokenizedDateInput = tokenizedDateTimeStr[0].replace(DATE_FORMAT_SEPARATOR_REGEX, DATE_SEPARATOR).split(DATE_SEPARATOR);

        let year;
        let month;
        let day;
        for (let idx = 0; idx < tokenizedDateMask.length; idx++) {
          if (tokenizedDateMask[idx].indexOf("y") >= 0) {
            const yearStr = tokenizedDateInput[idx];
            if (yearStr === undefined) {
              return;
            }
            const paddedYearStr = addPaddingZeroToSingleDigit(yearStr);
            year = parseInt(paddedYearStr);
            if (Number.isNaN(year)) {
              return;
            }
            if (paddedYearStr.length === 2) {
              year = parseInt(`${getYearLead(year)}${paddedYearStr}`);
            }
            if (year.toString(10).length !== 4) {
              return;
            }
          } else if (tokenizedDateMask[idx].indexOf("M") >= 0) {
            month = parseInt(tokenizedDateInput[idx]) - 1; // new Date month starts at 0 for Jan
            if (Number.isNaN(month) || month < 0 || month > 11) {
              return;
            }
          } else if (tokenizedDateMask[idx].indexOf("d") >= 0) {
            day = parseInt(tokenizedDateInput[idx]);
            if (Number.isNaN(day) || day < 1 || day > 31) {
              return;
            }
          }
        }

        // Only parse date if we find year, month and day
        if (gwUtil.hasValue(year) && gwUtil.hasValue(month) && gwUtil.hasValue(day)) {
          cursorPos = 99;
          const timeStr = tokenizedDateTimeStr[1];
          if (timeStr) {
            const tokenizedTime = timeStr.split(TIME_SEPARATOR);
            let hours = tokenizedTime[0] ? parseInt(tokenizedTime[0]) : null;
            const minutes = tokenizedTime[1] ? parseInt(tokenizedTime[1]) : null;
            const seconds = tokenizedTime[2] ? parseInt(tokenizedTime[2]) : null;
            if (hours && minutes) {
              const timePeriod = tokenizedDateTimeStr[2];
              if (timePeriod === gwDateValue.getPmString()) {
                hours = hours + 12;
              }
              return new Date(year, month, day, hours, minutes, seconds || 0);
            }
          }
          return new Date(year, month, day);
        }
      }
      return null;
    };

    const processedPastedFormattedDate = processPastedInputStr(currentFullInputValue);

    // If this is a date input, and there is a matching time input, then we do extra logic to support pasting full date-times into the date input
    const updateTimeElement = (fullDateTimeValue: string) => {
      if (fullDateTimeValue.length > mask.length + 1) {
        if (isDateInput) {
          if (relatedTimeInput) {
            const overflow = fullDateTimeValue.substring(mask.length).trim();
            if (overflow.length >= 5 && overflow.length <= 8 && overflow.indexOf(":") > -1) {
              // Take the overflow, since it's more than a single character, and set it as the value in the timeInput
              relatedTimeInput.value = overflow;
              dateHandledOverflowCharacters = true;
              this.notifySystemsOfInputValueChange(relatedTimeInput);
            }
          }
        } else if (isTimeInput) {
          // If the originally input value contains one of the localized am/pm then the user could have pasted the value in, so set the select to it.
          if (relatedAmPmInput && relatedAmPmButton) {
            const option1 = gwDateValue.getAmString();
            const option2 = gwDateValue.getPmString();
            if (option1 && option2) {
              const option1Tester = new RegExp("((" + option1.toUpperCase() + ")|(" + option1.toLowerCase() + "))");
              if (option1Tester.test(fullDateTimeValue.toLowerCase())) {
                dateHandledOverflowCharacters = true;
                relatedAmPmInput.value = option1;
                relatedAmPmButton.value = option1;
                gwAria.setAriaPropertyForElement("label", option1, relatedAmPmButton);
              } else {
                const option2Tester = new RegExp("((" + option2.toUpperCase() + ")|(" + option2.toLowerCase() + "))");
                if (option2Tester.test(fullDateTimeValue.toLowerCase())) {
                  dateHandledOverflowCharacters = true;
                  relatedAmPmInput.value = option2;
                  relatedAmPmButton.value = option2;
                  gwAria.setAriaPropertyForElement("label", option2, relatedAmPmButton);
                }
              }
            }
          }
        }
      } else if (fullDateTimeValue.length === mask.length + 1) {
        if (willOverflowPastedValuesToNextInput) {
          if (relatedTimeInput) {
            if (relatedAmPmInput && relatedAmPmButton) {
              // If the single overflow character equals the first letter of one of the meridian options, we'll select it
              // basically allowing the user a shortcut way to toggle AMPM without having to tab out to it.
              const option1 = gwDateValue.getAmString();
              const option2 = gwDateValue.getPmString();
              const option1FirstChar = option1[0].toLowerCase();
              const option2FirstChar = option2[0].toLowerCase();
              const overflowChar = fullDateTimeValue[fullDateTimeValue.length - 1].toLowerCase();
              if (overflowChar === option1FirstChar) {
                dateHandledOverflowCharacters = true;
                relatedAmPmInput.value = option1;
                relatedAmPmButton.value = option1;
                gwAria.setAriaPropertyForElement("label", option1, relatedAmPmButton);
              } else if (overflowChar === option2FirstChar) {
                dateHandledOverflowCharacters = true;
                relatedAmPmInput.value = option2;
                relatedAmPmButton.value = option2;
                gwAria.setAriaPropertyForElement("label", option2, relatedAmPmButton);
              }
            }
          }
        }
      }
    };

    // If this could be a fully formatted date or date time string, then we'll attempt to build a date object out of it, then format it as the input mask
    // Essentially allowing formatted strings to be pasted into input fields that have different masks
    if (isDateInput && gwEvents.pasteCausedCurrentInputEvent && processedPastedFormattedDate && currentFullInputValue.length >= 5) {
      hasDisplayedClientValidationMessage = true; //Disable any later attempts to display client validation
      const fieldContainedTimeValue = currentFullInputValue.indexOf(":") > -1;
      currentFullInputValue = mask
        .slice(0)
        .replace("yyyy", "" + processedPastedFormattedDate.getFullYear())
        .replace("yy", "" + processedPastedFormattedDate.getFullYear())
        .replace("MM", ("0" + (processedPastedFormattedDate.getMonth() + 1)).slice(-2))
        .replace("dd", ("0" + processedPastedFormattedDate.getDate()).slice(-2));

      if (gwJic.isJIC(el)) {
        // Convert the date if the pasted value is clearly a formatted western date string with a 4 digit year
        const splitDate = currentFullInputValue.split("/");
        // If the first or last chunk has 4 digits, then get it
        const possible4DigitYear: string | null =
          splitDate[0] && splitDate[0].length === 4 ? splitDate[0] : splitDate[2] && splitDate[2].length === 4 ? splitDate[2] : null;
        if (possible4DigitYear) {
          const parsedYear: number = parseInt(possible4DigitYear);
          if (!isNaN(parsedYear) && parsedYear > 999 && parsedYear < 9999) {
            const eraInfo = gwJicHelper.gregYearToEraYear(processedPastedFormattedDate);
            currentFullInputValue = `${eraInfo.era} ${currentFullInputValue.replace(possible4DigitYear, eraInfo.year)}`;
          }
        }
      }

      if (fieldContainedTimeValue && relatedTimeInput && timeMask) {
        const options: Intl.DateTimeFormatOptions = {
          hour: "2-digit",
          minute: "2-digit",
          hour12: gwUtil.hasClass(relatedTimeInput, "gw-is12Hour"),
        };
        if (timeMask.indexOf("ss") > -1) {
          options.second = "2-digit";
        }
        const _formattedTime = processedPastedFormattedDate.toLocaleTimeString([], options);
        // (add 0 padding) work around the issue that hour: "2-digit" in options doesn't really return two digits if hours is < 10
        const currentFullInputValueWithTime = `${currentFullInputValue} ${addPaddingZeroToSingleDigit(_formattedTime)}`;
        updateTimeElement(currentFullInputValueWithTime.slice(0));
      }
      // the userInput value is correct. Set the value and return
      gwInputs.setValueOnTextInputElement(el, currentFullInputValue, cursorPos, false, "date");
      return;
    }

    if (isDateInput && gwJic.isJIC(el)) {
      const valueRemainingAfterEraRemoved = gwJic.possiblyHandleEraValue(currentFullInputValue, el);
      if (valueRemainingAfterEraRemoved.length === 0) {
        gwInputs.setValueOnTextInputElement(el, null, 0, false, "date");
        return;
      }

      cursorPos += valueRemainingAfterEraRemoved.length - currentFullInputValue.length;

      if (valueRemainingAfterEraRemoved.length < currentFullInputValue.length) {
        userAddedACharacter = false;
      }

      currentFullInputValue = valueRemainingAfterEraRemoved;
      originalValue = currentFullInputValue.slice(0);
    }

    // when time is pasted in. add the padding "0" for hour, minute and second if it is missing before further process
    if (isTimeInput && gwEvents.pasteCausedCurrentInputEvent) {
      currentFullInputValue = addPaddingZeroToSingleDigit(currentFullInputValue);
    }

    const placeholderCharMatcher = new RegExp("([A-Za-z\\p{L}])", "g");
    const validInputCharRegex = /\d/g; // Match all digits
    mask = this.getPlaceholderValueOrMaskIfPlaceholderIsIncorrectLength(el, mask);

    const placeholderMaskChars: GwMap = {}; // by default is #, if mask isDateTimeMask, then it's also any letters
    const staticMaskChars: GwMap = {}; // Anything in the input mask that is not a phChar
    // Build sets of placeholder characters and special character based on the inputMask and isDateTimeMask flag
    gwUtil.forEach(mask, (c) => {
      if (c.match(placeholderCharMatcher)) {
        placeholderMaskChars[c] = true;
      } else {
        staticMaskChars[c] = true;
      }
    });

    const isValidNonPlaceholderChar = (char: string): boolean => {
      if (placeholderMaskChars[char]) {
        return false;
      }

      return this.isValidChar(char, validInputCharRegex);
    };

    const containsValidNonPlaceholderChar = (str: string): boolean => {
      for (const char of str) {
        if (isValidNonPlaceholderChar(char)) {
          return true;
        }
      }

      return false;
    };

    const testDateValueCapping = (valueIndexAtCursorPos: number): boolean => {
      if (!gwDateValue.shouldCapDateTimeUserInput()) {
        return false;
      }

      const dateMaskChar = nonLocalizedMask[valueIndexAtCursorPos];
      // If the character the user just typed replaces the second of matching 2 masks, then we'll try to run some date or month capping
      if (nonLocalizedMask[valueIndexAtCursorPos - 1] !== dateMaskChar) {
        return false;
      }

      let capValue;
      let lowCapValue = 0;

      if (dateMaskChar === "M") {
        capValue = 12;
        lowCapValue = 1;
      } else if (dateMaskChar === "d") {
        capValue = 31; //NOTE: to make this logic real, as in days in months, we'd have to always have the full date input by the user, which we don't, and run leap year logic
        lowCapValue = 1;
      } else if (dateMaskChar === "m" || dateMaskChar === "s") {
        capValue = 59;
      } else if (dateMaskChar === "h") {
        capValue = 23;
        if (gwUtil.hasClass(el, "gw-is12Hour")) {
          capValue = 12;
          lowCapValue = 1;
        }
      } else {
        return false;
      }

      const pairStringValue = currentFullInputValue.substring(valueIndexAtCursorPos - 1, valueIndexAtCursorPos + 1);
      const pairIntValue = parseInt(pairStringValue);
      if (pairIntValue > capValue) {
        currentFullInputValue =
          currentFullInputValue.substring(0, valueIndexAtCursorPos - 1) +
          capValue +
          currentFullInputValue.substring(valueIndexAtCursorPos + 2);
        return true;
      } else if (pairIntValue < lowCapValue) {
        currentFullInputValue =
          currentFullInputValue.substring(0, valueIndexAtCursorPos - 1) +
          ("0" + lowCapValue) +
          currentFullInputValue.substring(valueIndexAtCursorPos + 2);
        return true;
      }

      return false;
    };

    const runDateTimeSpecificLogic = (): boolean => {
      if (!userAddedACharacter) {
        return false;
      }

      // allows a user to type various symbols or a space to change single digit days and months to be 0 leading, or to change a 2 digit year into a 4 digit one
      const staticMaskCharsPlusCompleters = gwUtil.mapMerge(this.DATE_COMPLETION_CHARS, staticMaskChars);

      let valueIndexAtCursorPos = cursorPos - 1;
      const characterJustTyped = diffSize === 1 ? currentFullInputValue[valueIndexAtCursorPos] : null;

      if (characterJustTyped === null || characterJustTyped === undefined) {
        return false;
      }

      // If the typed character isn't special, then we'll just check on day month capping
      if (!staticMaskCharsPlusCompleters[characterJustTyped]) {
        return testDateValueCapping(valueIndexAtCursorPos);
      }

      // In order to account for situations where the mask character is at the end of string
      // Instead of special casing the logic to account for an undefined index,
      // we'll add a values separator to the end of the string, so the logic is the same no matter where its parsed,
      // And then remove the extra character from the end of the string when we're done.
      currentFullInputValue += characterJustTyped;

      // At this point, the user has typed a staticMask char or a completer char
      const char2Ahead = currentFullInputValue[valueIndexAtCursorPos + 2];
      const nonLocalizedLowercaseCharacter2Ahead = (nonLocalizedMask[valueIndexAtCursorPos + 1] || "").toLowerCase();

      const possiblyFillInSingleDigitDateTimeValues = (): boolean => {
        if (!char2Ahead) {
          return false;
        }

        // Check if the input mask, not the input value, has a y in it
        // This will be handled in possiblyFillOut2DigitYear
        if (nonLocalizedLowercaseCharacter2Ahead === "y") {
          return false;
        }

        // Test if the next character in the value matches the mask, and the character after that is a special character
        if (!placeholderMaskChars[currentFullInputValue[valueIndexAtCursorPos + 1]] || !staticMaskChars[char2Ahead]) {
          return false;
        }

        // At this point, the value looks something like 7/d/mm/yyyy with the user's cursor between the / and the d
        // So now we see if we should convert a single digit value into a zero leading value
        const intCharVal = parseInt(currentFullInputValue[valueIndexAtCursorPos - 1]);
        if (isNaN(intCharVal)) {
          return false;
        }
        currentFullInputValue =
          currentFullInputValue.substring(0, valueIndexAtCursorPos - 1) +
          "0" +
          intCharVal +
          currentFullInputValue.substring(valueIndexAtCursorPos + 2);

        // Now jump the cursor past the mask special character, and let the logic loop do the rest
        cursorPos++;
        return true;
      };

      const possiblyFillOut2DigitYear = (): boolean => {
        if (!char2Ahead) {
          return false;
        }

        // Check if the input mask, not the input value, has a y in it
        //
        if (nonLocalizedLowercaseCharacter2Ahead !== "y") {
          return false;
        }

        // Test if the next 2 characters in the value match the mask and are ph
        if (!placeholderMaskChars[currentFullInputValue[valueIndexAtCursorPos + 1]] || !placeholderMaskChars[char2Ahead]) {
          return false;
        }

        //At this point the val looks like 7yyy or 77yy

        //if the 3rd one matches, then the user has only typed 1 of the 4 year characters, then we'll fill the 0
        if (placeholderMaskChars[currentFullInputValue[valueIndexAtCursorPos + 3]]) {
          currentFullInputValue =
            currentFullInputValue.substring(0, valueIndexAtCursorPos - 1) + // String before the added 0
            "0" +
            currentFullInputValue.substring(valueIndexAtCursorPos - 1, valueIndexAtCursorPos + 1) + // String from the single digit incl the special character to the first y of 3
            currentFullInputValue.substring(valueIndexAtCursorPos + 2); // String that jumps over one of the "y"s, since the new 0 replaced it

          // Bump the index and the cursor, so the remaining logic can run as though the user had typed the 2nd year char
          valueIndexAtCursorPos++;
          cursorPos++;
        }

        const dateTwoString = currentFullInputValue.substring(valueIndexAtCursorPos - 2, valueIndexAtCursorPos);
        //At this point the val looks only like 07yy or 45yy, etc
        const dateTwoDigit = parseInt(dateTwoString);
        if (isNaN(dateTwoDigit)) {
          return false;
        }

        const yearLead = getYearLead(dateTwoDigit);

        if (isNaN(yearLead)) {
          return false;
        }

        const finalYear = yearLead + dateTwoString;
        // Now the finalYear looks like 1987 or 2009 etc
        // And the currentFullInputValue looks like 15/^yy/MM/dd or 14/11/07/^yy

        const beginningChunk = currentFullInputValue.slice(0, valueIndexAtCursorPos - 2);
        const endingChunk = currentFullInputValue.slice(valueIndexAtCursorPos + 3);

        currentFullInputValue = beginningChunk + finalYear + endingChunk;

        cursorPos += 2;
        return true;
      };

      // If the Fill in single digit datetime values returns false, then we'll check for logic we can run on the year
      let didModifyCurrentFullInputValue = possiblyFillInSingleDigitDateTimeValues();

      // Remove the character we added before running the Fill methods
      currentFullInputValue = currentFullInputValue.slice(0, -1);

      if (!didModifyCurrentFullInputValue) {
        didModifyCurrentFullInputValue = possiblyFillOut2DigitYear();
      }

      return didModifyCurrentFullInputValue;
    };

    const dateLogicMadeModifications = runDateTimeSpecificLogic();

    const possiblyFillOutWithMask = (val: string) => {
      if (val.length < mask.length) {
        return val + mask.slice(val.length);
      }

      return val;
    };

    // =====================================
    // == EXIT IF THE DATE LOGIC MADE MODIFICATIONS
    // =====================================
    if (dateLogicMadeModifications) {
      gwInputs.setValueOnTextInputElement(el, possiblyFillOutWithMask(currentFullInputValue), cursorPos, false, "date");

      return;
    }

    if (!mask) {
      return;
    }

    const singleTypedCharMatchesNextStaticMask = (): boolean => {
      if (!userAddedACharacter || cursorPos <= 0) {
        return false;
      }

      const addedChar = currentFullInputValue[cursorPos - 1];
      const nextCharInMask = mask[cursorPos - 1];

      if (addedChar === undefined) {
        return false;
      }

      return addedChar === nextCharInMask;
    };

    // =====================================
    // == CHECK FOR SINGLE CHAR MATCHING MASK AND POSSIBLY EXIT
    // =====================================
    if (singleTypedCharMatchesNextStaticMask()) {
      const withSlicedOutChar = currentFullInputValue.slice(0, cursorPos) + currentFullInputValue.slice(cursorPos + 1);
      gwInputs.setValueOnTextInputElement(el, possiblyFillOutWithMask(withSlicedOutChar), cursorPos, false, "date");
      return;
    }

    // =====================================
    // == FIGURE DIFF & STORE OFF ADDED CHARS
    // =====================================

    const modifiedStartIndex = this.getFirstModifiedIndex(
      gwUtil.hasValue(previousFullInputValue) ? previousFullInputValue : mask,
      currentFullInputValue,
      cursorPos
    );

    let addedChars: string[] = currentFullInputValue.slice(modifiedStartIndex, cursorPos).split("");
    if (!willOverflowPastedValuesToNextInput && !hasDisplayedClientValidationMessage && addedChars.length > mask.length + 1) {
      gwClientValidation.warnAboutUserInput(el, addedChars.join(""));
      hasDisplayedClientValidationMessage = true;
    }

    const illegalUserChars: string[] = [];
    let cursorOffset = 0;
    // =====================================
    // == CLEAN INVALID CHARS FROM ADDED
    // =====================================
    // NOTE: this is a bit of a design decision here. If someone has pasted invalid characters, we clean them out
    //
    if (addedChars.length > 0) {
      const tempAddedChars = [];
      for (let i = 0; i < addedChars.length; i++) {
        const addedChar = addedChars[i];
        const maskChar = mask[modifiedStartIndex + i];
        if (addedChar !== maskChar && isValidNonPlaceholderChar(addedChar)) {
          tempAddedChars.push(addedChar);
        } else if (addedChar !== maskChar) {
          illegalUserChars.push(addedChar);
          if (modifiedStartIndex + i <= cursorPos) {
            cursorOffset--;
          }
        }
      }
      addedChars = tempAddedChars;
    }

    // =====================================
    // == REBUILD VALUE WITH ADDED CHARS REMOVED OR DELETED CHAR FILLED WITH MASK
    // =====================================
    const firstPart = currentFullInputValue.slice(0, modifiedStartIndex);
    const replaceFill = diffSize < 0 ? mask.substr(modifiedStartIndex, -1 * diffSize) : "";
    const finalPart = currentFullInputValue.slice(cursorPos);

    cursorPos += cursorOffset;

    currentFullInputValue = firstPart + replaceFill + finalPart;

    // if there are missing digits in the inputValue. try to fill it in the mask digits starting from the beginning of final part
    if (currentFullInputValue.length < mask.length) {
      const missingDigitsCount = mask.length - currentFullInputValue.length;
      const missingStartPos = modifiedStartIndex + replaceFill.length;
      currentFullInputValue =
        currentFullInputValue.substr(0, missingStartPos) +
        mask.substr(missingStartPos, missingDigitsCount) +
        currentFullInputValue.slice(missingStartPos);
    }

    let finalValueForElement = firstPart;

    // =====================================
    // == WALK THE MASK FOR DIFFED SECTION OF VALUE & FILL ADDED CHARS BACK IN
    // =====================================
    for (let iMask = finalValueForElement.length; iMask < mask.length; iMask++) {
      const maskChar = mask[iMask];
      const valChar = currentFullInputValue[iMask];

      if (valChar === undefined || valChar === null) {
        // no more value to fill in
        break;
      }

      const currentMaskCharIsPlaceholder = !!placeholderMaskChars[maskChar];
      const currentValCharIsValidInput = isValidNonPlaceholderChar(valChar);

      // =====================================
      // == INSERT ONE OF THE VALID ADDED CHARS INTO THE PH SLOT
      // =====================================
      if (currentMaskCharIsPlaceholder && addedChars.length > 0) {
        finalValueForElement += addedChars.shift();
        cursorPos = iMask + 1;
        continue;
      }

      // =====================================
      // == VAL CHAR IS VALID AND MASK IS PH SO USE VAL
      // =====================================
      if (currentMaskCharIsPlaceholder && currentValCharIsValidInput) {
        finalValueForElement += valChar;
        continue;
      }

      // =====================================
      // == NOTHING ELSE WORKED JUST USE THE MASK
      // =====================================
      finalValueForElement += maskChar;
    }

    // If all that's left in the input is the mask, then blank it, and let the PH kick in.
    if ((userRemovedAChar || illegalUserChars.length > 0) && finalValueForElement === mask) {
      finalValueForElement = "";
    }

    gwInputs.setValueOnTextInputElement(el, finalValueForElement, cursorPos, false, "date");
    originalValue = originalValue.trim();

    updateTimeElement(originalValue);

    // =====================================
    // == NOTIFY USER OF ILLEGAL CHARACTERS FOUND
    // =====================================
    if (!hasDisplayedClientValidationMessage && !dateHandledOverflowCharacters) {
      if (illegalUserChars.length === 1) {
        gwClientValidation.userInputRejectedSingleCharacter(el, illegalUserChars[0]);
      } else if (illegalUserChars.length > 1) {
        gwClientValidation.userInputRejectedOnPaste(el, illegalUserChars.join(" "));
      } else if (addedChars.length > 0) {
        gwClientValidation.warnAboutUserInput(el, addedChars.join(" "));
      } else if (currentFullInputValue.length > mask.length) {
        const overflowLost = currentFullInputValue.slice(mask.length);
        if (containsValidNonPlaceholderChar(overflowLost)) {
          gwClientValidation.warnAboutUserInput(el, overflowLost);
        }
      }
    }
  }

  /**
   * Called by the copy/cut event on inputs with input masks.
   * If the element has a select for am/pm, then copy/cut appends the value of the select to the clipboardData
   * only if the right hand side of the input selection extends to the end of the input.
   *
   * @param el
   * @param args
   * @param e
   */
  copyOnInputMask(el: HTMLTextInputElement, args: GwMap, e: ClipboardEvent): void {
    const val = el.value;
    const selectionStart = el.selectionStart ?? 0;
    const selectionEnd = el.selectionEnd ?? el.value.length - 1;

    let finalVal = val;
    // If they have nothing selected, give them the whole value
    // Otherwise, just get the selected data.
    if (selectionStart !== null && selectionEnd !== null && selectionEnd !== selectionStart) {
      finalVal = finalVal.substring(selectionStart, selectionEnd);
    }

    const clipboardData: DataTransfer = e.clipboardData || (window as any).clipboardData;

    if (clipboardData !== undefined && clipboardData !== null) {
      clipboardData.setData("text", finalVal);
    } else {
      gwUtil.devlog("clipboardData object not present on event or window");
    }

    // If this is a cut, then we need to manually delete the selected area since we'll be preventingDefault
    if (e.type === "cut") {
      el.value = val.substring(0, selectionStart) + val.substring(selectionEnd, val.length);
      this.setSelectionRange(el, selectionStart, selectionEnd);
      this.notifySystemsOfInputValueChange(el, "inputmask");
    }
  }

  copyOnDateValue(el: HTMLTextInputElement, args: GwMap, e: ClipboardEvent): void {
    const val = el.value;
    const selectionStart = el.selectionStart ?? 0;
    const selectionEnd = el.selectionEnd ?? val.length - 1;

    let timeEl;
    let appendTime = false;
    let eraJIC = null;
    if (gwDateValue.isDateInputElement(el)) {
      if (selectionEnd === selectionStart || (selectionStart <= 0 && selectionEnd >= val.length)) {
        appendTime = true;
        eraJIC = gwJicHelper.getEraInputValue(el);
      }
      timeEl = gwDateValue.getTimeInputChildOrSibling(el);
    } else if (gwDateValue.isTimeInputElement(el)) {
      timeEl = el;
    }

    let finalVal = val;
    // If they have nothing selected, give them the whole value
    // Otherwise, just get the selected data.
    if (selectionEnd !== selectionStart) {
      finalVal = finalVal.substring(selectionStart, selectionEnd);
    }

    if (timeEl) {
      if (appendTime) {
        finalVal = finalVal + " " + timeEl.value;
      }
      const ampm = gwDateValue.getAmPmHiddenInputChildOrSibling(timeEl);
      if (ampm) {
        // Test if we have selected to the end of the text in the time input, or if the date input has told us to appendTime
        // If we have, then add the select.value localized am/pm to it
        if (appendTime || selectionEnd === selectionStart || (selectionStart <= 0 && selectionEnd >= val.length)) {
          finalVal = finalVal + " " + ampm.value;
        }
      }
    }

    if (eraJIC) {
      finalVal = eraJIC + " " + finalVal;
    }
    const clipboardData: DataTransfer = e.clipboardData || (window as any).clipboardData;

    if (clipboardData !== undefined && clipboardData !== null) {
      clipboardData.setData("text", finalVal);
    } else {
      gwUtil.devlog("clipboardData object not present on event or window");
    }

    // If this is a cut, then we need to manually delete the selected area since we'll be preventingDefault
    if (e.type === "cut") {
      el.value = val.substring(0, selectionStart) + val.substring(selectionEnd, val.length);
      this.setSelectionRange(el, selectionStart, selectionEnd);
      this.notifySystemsOfInputValueChange(el, "date");
    }
  }

  /**
   * Runs before server event is fired.
   * if clearTrailingMaskCharacters is true then:
   * - Trim off any trailing characters in the input's value that match the input mask.
   */
  beforeFireEvent(): void {
    if (this.clearTrailingMaskCharacters) {
      gwUtil.forEach($("[data-gw-input-mask] input"), (input) => (input.value = this.getValueWithMaskTrimmed(input)));
      //TODO: should really ask gwDateValue to handle this
      gwUtil.forEach(
        $("[data-gw-datetime] .gw-DateValueWidget--dateInput"),
        (dateInput) => (dateInput.value = this.getValueWithMaskTrimmed(dateInput))
      );
      gwUtil.forEach(
        $("[data-gw-datetime] .gw-DateValueWidget--timeInput"),
        (timeInput) => (timeInput.value = this.getValueWithMaskTrimmed(timeInput))
      );
    }
  }

  /**
   * Returns either the value of the element, or if it has an input mask, the value with any trailing input masks chars removed
   * @param el
   * @returns {*}
   */
  getValueWithMaskTrimmed(el: HTMLTextInputElement | HTMLTextAreaElement): string {
    const valueWidget = gwForm.findEnclosingValueWidget(el);
    if (!valueWidget) {
      return "";
    }

    const inputMask = valueWidget.getAttribute("data-gw-input-mask") || "";
    const dateMask = valueWidget.getAttribute("data-gw-date-mask") || "";
    const timeMask = valueWidget.getAttribute("data-gw-time-mask") || "";

    let mask = inputMask || dateMask || timeMask;
    if (!mask) {
      return el.value;
    }

    const val = el.value;
    if (!gwUtil.hasValue(val)) {
      return "";
    }

    if (valueWidget.hasAttribute("data-gw-datetime")) {
      // Digits only masks with placeholders fill in the placeholder values, not the input mask
      // So we need to trim off the placeholder here instead of the input mask
      mask = this.getPlaceholderValueOrMaskIfPlaceholderIsIncorrectLength(
        el,
        gwUtil.hasClass(el, "gw-DateValueWidget--dateInput") ? dateMask : timeMask
      );
    }

    if (!mask) {
      return "";
    }

    let lastIndexInValToInclude = val.length;
    gwUtil.forEachReverse(val, (ch: string, key, coll, i) => {
      if (ch !== mask[i]) {
        return GW_BREAKER;
      }
      lastIndexInValToInclude--;
      return;
    });

    return val.substring(0, lastIndexInValToInclude);
  }

  /**
   *
   * @param {string} value
   * @param {number} cursorIndex
   * @param {boolean} userDeletedChar - if the user deleted a character, then we aren't going to clear out the leading zeroes
   * @param {GwNumberFormatInfo} formatInfo - format details, specifying grouping and radix symbols
   * @returns {GwValueAndCursorPos}
   */
  addGroupingSeparators(value: string, cursorIndex: number, userDeletedChar: boolean, formatInfo: GwNumberFormatInfo): GwValueAndCursorPos {
    let tempLeft = "";
    let inLeadZeroChain = true;
    let foundLeadZero = false;
    let cursorOffset = 0;
    const radix = formatInfo.radix;
    const grouping = formatInfo.grouping;
    // Remove all grouping and radix from left string, tallying the ones left of the cursorIndex
    // And remove all leading zeroes
    for (let i = 0; i < value.length; i++) {
      const ch = value[i];
      // If the user has added characters, then we'll clear out leading zeroes
      if (!userDeletedChar && ch === "0" && inLeadZeroChain) {
        // If we've already found a leading zero, then start decrementing indexes
        if (foundLeadZero) {
          if (i <= cursorIndex - 1) {
            cursorOffset--;
          }
        }
        foundLeadZero = true;
        continue;
      }

      if (inLeadZeroChain && ch === grouping) {
        // This is a strange case where the user has pasted or typed a value that's ended up like "0," or "0,000,000"
        if (i <= cursorIndex - 1) {
          cursorOffset--;
        }
        continue;
      }

      // Found a non zero digit, so break the chain
      inLeadZeroChain = false;

      if (ch === radix || ch === grouping) {
        if (i <= cursorIndex - 1) {
          cursorOffset--;
        }
        continue;
      }

      // Was not a leading zero, nor a radix or a grouping, so add it
      tempLeft = tempLeft + ch;
    }

    cursorIndex = cursorIndex + cursorOffset;
    cursorOffset = 0;
    if (foundLeadZero && tempLeft.length === 0) {
      tempLeft = "0";
    }

    value = tempLeft;

    // ###################################################
    // ### Add group separators back to left string ###
    // ###################################################
    const tempLeftArr = [];
    // Now walk from right to left in left hand string, and add any needed grouping chars
    let groupingCounter = 0;
    const leftLength = value.length;
    for (let i = leftLength - 1; i >= 0; i--) {
      const ch = value[i];
      tempLeftArr.push(ch);
      groupingCounter++;
      // Every 3 digits add a grouping char
      if (groupingCounter === 3 && i !== 0) {
        groupingCounter = 0;
        tempLeftArr.push(grouping);
        if (i <= cursorIndex - 1) {
          cursorOffset++;
        }
      }
    }

    const finalCursorPos = cursorIndex + cursorOffset;
    const finalString = tempLeftArr.reverse().join("");

    return { value: finalString, cursorPos: finalCursorPos };
  }

  /**
   * Checks if the given input mask is "active" - that is will it actually guide user input? Some input masks
   * have no placeholder characters are just intended as a hint to the user.
   *
   * This function only works for explicitly specified PCF input masks, which always use the default input mask
   * placeholder character.
   * @param {string} inputMask the input mask
   * @returns {boolean} true if it is an active mask
   */
  isActiveInputMask(inputMask: string): boolean {
    return gwUtil.hasValue(inputMask) && inputMask.indexOf(this.DEFAULT_INPUT_MASK_PLACEHOLDER_CHAR) >= 0;
  }

  closeOpenInputs(event?: GwEventType): void {
    gwDateValue.hideDatePicker();
    gwAutocomplete.closeAutocomplete(event && event.target ? (event.target as GwDomNode) : undefined);
    gwHelpText.closeHelpText();
    gwClientValidation.dismissAll();
  }

  /**
   * All non-digit characters will be stripped out.
   *
   * @param {HTMLInputElement} inputElement
   * @param {GwMap} args
   */
  clearNonDigitCharactersFromInput(inputElement: HTMLInputElement, args: GwMap): void {
    if (inputElement.value) {
      inputElement.value = inputElement.value.replace(/\D/g, "");
    }
  }

  /**
   * return true if an input has postOnChange configured.
   * @param el
   */
  hasPostOnChange(valueWidget: GwValueWidgetElement): boolean {
    return valueWidget && valueWidget.getAttribute("data-gw-change") === "refresh";
  }

  /**
   * Runs on data-gw-currency-info elements to do inline automatic locale specific currency formatting.
   * requires: 'data-gw-currency-info="USD;$;,;.;2" where the semi-colon separated values are:
   * 1. International Currency Code: ex USD
   * 2. Currency Symbol: ex $
   * 3. Thousands Grouping Separator: ex ,
   * 4. Radix Separator: ex .
   * 5. Maximum Allowed Decimal Places: ex 2
   *
   * Features:
   * a. automatically adds grouping separators on the fly
   * b. restricts any invalid input
   * c. typing a matching radix or grouping symbol will move the cursor past the existing one
   * d. caps major digits to maxCurrencyDigits
   * e. Parses the macros in gw.currency.macros to convert things like 1.5m into 1,500,000 if enableMacroChars == true
   * f. adds and removes leading 0s when needed
   * g. delete key when to the right of a grouping symbol will move the cursor to the left of the symbol
   * h. typing or pasting a value with () for negative will convert them to a leading -
   */
  handleGroupingDecimalsAndMacros(
    valueWidget: GwValueWidgetElement,
    el: HTMLTextInputElement,
    valueOtherThanCurrent?: string,
    cursorPosOtherThanCurrent?: number
  ): GwValueAndCursorPos {
    let originalValue = valueOtherThanCurrent === undefined ? el.value : valueOtherThanCurrent;
    const cursorPos = cursorPosOtherThanCurrent === undefined ? this.getCursorPos(el) : cursorPosOtherThanCurrent;

    const formatInfo = GwNumberFormatInfo.getNumberFormatInfo(el, valueWidget);
    if (!formatInfo) {
      return { value: originalValue, cursorPos };
    }

    if (!gwUtil.hasValue(originalValue) || originalValue.length === 0) {
      //Let the placeholder handle it
      originalValue = "";
      return { value: originalValue, cursorPos };
    }

    if (!gwPrefPanel.getPrefValueByPrefName("enableNumericAutoFormatting")) {
      return { value: originalValue, cursorPos };
    }

    // ###################################################
    // ### 2. Setup All the Variables                  ###
    // ###################################################
    const prevVal = this.getPreviousInputValueForKeyOrPasteEvent(el);
    const diffLengthFromLast = originalValue.length - prevVal.length;
    const addedChar = diffLengthFromLast === 1;

    //get the cursor position, convert it to a 0 index to play nice with string indexes, we'll undo it at the end
    let cursorIndex = cursorPos - 1;

    let charAtCursor = originalValue[cursorIndex] || "";
    let lastValCharAtCursor = prevVal[cursorIndex + 1] || "";
    let userTypedRadix = addedChar && charAtCursor === formatInfo.radix;
    let userTypedGrouping = addedChar && charAtCursor === formatInfo.grouping;

    // ###################################################
    // ### 2a. Process Pasted Curr and Symbol          ###
    // ###################################################
    // Walk that list, see if the value is present, then change the currency of this field's selector to it
    // For now, we'll just pull the single currency code and symbol
    const currencyCode = formatInfo.code || "USD";
    const currencySymb = formatInfo.symb || "$";
    const cCodeIndex = originalValue.indexOf(currencyCode);
    if (cCodeIndex > -1) {
      originalValue = originalValue.replace(currencyCode || "USD", "");
      // Any amount of the currency code located before the cursorIndex needs to decrement the cursorIndex
      cursorIndex -= Math.min(currencyCode.length, cursorIndex - cCodeIndex);
    }

    const cSymbIndex = originalValue.indexOf(currencySymb);
    if (cSymbIndex > -1) {
      originalValue = originalValue.replace(currencySymb, "");
      // Any amount of the currency sy located before the cursorIndex needs to decrement the cursorIndex
      cursorIndex -= Math.min(currencySymb.length, cursorIndex - cSymbIndex);
    }

    // ###################################################
    // ### 2b. Clean Invalid, exit if nothing remains  ###
    // ###################################################
    let isNegative = false;
    let bumpForCursorPositionAfterNegative = 0;
    if (originalValue[0] === "-" || originalValue[0] === "(") {
      isNegative = true;
      // The - or ( symbol will be peeled off by the next legal characters regex
      if (cursorIndex > 0) {
        bumpForCursorPositionAfterNegative = 1;
        cursorIndex--;
      }

      const closingBracketPos = originalValue.indexOf(")");
      // If we found a closing bracket, and it was before the cursor position, then decrement cursorIndex
      // The character itself will be peeled off by the legal char regex
      if (closingBracketPos > -1 && closingBracketPos <= cursorIndex) {
        cursorIndex--;
      }
    }

    // Legal characters are 0-9, the grouping separator, and the radix (but only if allowed digits is greater than 0
    let regStr = "[0-9\\" + formatInfo.grouping;
    // Plus any defined macro characters
    const macroCharsEnabled = gwPrefPanel.getPrefValueByPrefName("enableMacroChars") as boolean;

    // If the max digits are greater than 0, or macros are enabled and the user just typed a radix, then allow it in the regex
    const radixRegexPiece =
      (formatInfo.maxDecimalDigits && formatInfo.maxDecimalDigits > 0) || macroCharsEnabled ? "\\" + formatInfo.radix : "";

    regStr = regStr + radixRegexPiece;
    if (macroCharsEnabled) {
      regStr += gwCurrency.macroChars.join("");
    }

    regStr += "]";

    const legalChars = new RegExp(regStr, "g");
    const arrOfChars = originalValue.match(legalChars) || [];

    // Now, if there was a large number of illegal characters trimmed, we will decide not to format this value
    if (originalValue.length - arrOfChars.length > this.maxIllegalCharsBeforePunting) {
      gwClientValidation.userInputRejectedOnPaste(el, originalValue);
      return { value: prevVal, cursorPos: cursorIndex + 1 + bumpForCursorPositionAfterNegative };
    } else if (addedChar && charAtCursor !== "-" && !this.isValidChar(charAtCursor, legalChars)) {
      gwClientValidation.userInputRejectedSingleCharacter(el, charAtCursor);
      return { value: prevVal, cursorPos: cursorIndex + bumpForCursorPositionAfterNegative };
    }

    // No valid characters were matched, so just set the vals and bail
    if (arrOfChars === null || arrOfChars.length === 0) {
      return { value: isNegative ? "-" : "", cursorPos: 1 };
    }

    let finalVal = arrOfChars.join("");

    // ###################################################
    // ### 3. Check for and Do Macros                  ###
    // ###################################################
    // We only process the first macro found here, leaving any trailing ones in string for the user to see as an error state
    let macroFired = false;

    if (macroCharsEnabled) {
      let runningMacroValue = "";

      for (let i = 0; i < finalVal.length; i++) {
        const ch = finalVal[i];
        const macro = gwCurrency.macros[ch.toLowerCase()] || gwCurrency.macros[ch.toUpperCase()];
        if (!macroFired && macro) {
          macroFired = true;
          const lead = finalVal.substring(0, i);
          // ie: 1.7b
          if (lead.indexOf(formatInfo.radix) > -1) {
            const split = lead.split(formatInfo.radix);
            const leftSide = split[0];
            const rightSide = split[1];
            // ie: 1 + 7 + (number of zeroes in macro - the length of right)
            runningMacroValue = leftSide + rightSide + macro.substring(rightSide.length, macro.length);
          } else {
            runningMacroValue = lead + macro;
          }

          cursorIndex = runningMacroValue.length; //Maybe - 1 here
        } else {
          runningMacroValue += ch;
        }
      }

      finalVal = runningMacroValue;
    }

    // We will throw out much of the logic we use after user input, since the macro changes that logic
    if (macroFired) {
      charAtCursor = "";
      lastValCharAtCursor = "";
      userTypedRadix = false;
      userTypedGrouping = false;
    } else if (addedChar) {
      // ###################################################
      // ### 4. Adjust Cursor based on user action       ###
      // ###################################################
      //user typed an illegal character, so we will offset the cursor back
      if (!charAtCursor.match(legalChars)) {
        gwClientValidation.userInputRejectedSingleCharacter(el, charAtCursor);
        cursorIndex--;
      } else if (userTypedGrouping) {
        cursorIndex++;
        if (originalValue[cursorIndex + 1] === formatInfo.grouping) {
          cursorIndex++;
        }
      } else if (userTypedRadix) {
        cursorIndex++;
        if (originalValue[cursorIndex + 1] === formatInfo.radix) {
          cursorIndex++;
        }
      }
    }

    // ###################################################
    // ### 5. Split on Radix into Left and Right       ###
    // ###################################################
    let left = "";
    let right = "";
    let foundRadix = true;
    if (userTypedRadix) {
      //split left and right on cursorIndex
      right = finalVal.substring(cursorIndex);
      left = finalVal.substring(0, cursorIndex);
    } else {
      //split on the right most radix to preserve the most digits in case there are multiple radix
      const finalValSplit = finalVal.split(formatInfo.radix);
      if (finalValSplit.length === 1) {
        // There was no radix, so it all goes into the left
        left = finalValSplit[0];
        foundRadix = false;
      } else {
        right = finalValSplit.pop()!;
        left = finalValSplit.join("");
      }
    }

    // We don't do much special voodoo on the right hand side, just trim and clean invalid
    right = right.replace(/[^0-9]/g, "").substring(0, formatInfo.maxDecimalDigits || (macroCharsEnabled ? 3 : 0));

    // ###################################################
    // ### 6. Process Left String                      ###
    // ###################################################

    const finalValueAndCursorPos = this.addGroupingSeparators(left, cursorIndex + 1, diffLengthFromLast === -1, formatInfo);
    cursorIndex = finalValueAndCursorPos.cursorPos - 1;
    left = finalValueAndCursorPos.value;

    // ###################################################
    // ### 8. Done - Set Values, negative, cursorIndex   ###
    // ###################################################
    finalVal = left;
    if (foundRadix) {
      finalVal = finalVal + formatInfo.radix + right;
    }

    // If the final value is empty, meaning we trimmed all the 0s, then add one back, or
    // If the final value starts with a radix, then we add a zero, unless the user deleted the zero previously
    if (finalVal.length === 0 || (finalVal[0] === formatInfo.radix && lastValCharAtCursor !== "0")) {
      cursorIndex++;
      finalVal = "0" + finalVal;
    }

    if (isNegative) {
      finalVal = "-" + finalVal;
    }

    //At the start we subtracted 1 from the cursor position to convert it to a 0 index, now we add that 1 back
    return { value: finalVal, cursorPos: cursorIndex + 1 + bumpForCursorPositionAfterNegative };
  }
}

export const gwInputSystems = new GwInputSystems();

export type GwInputSystemType = "autocomplete" | "inputmask" | "currency" | "date" | "picker" | "datepicker" | null;
