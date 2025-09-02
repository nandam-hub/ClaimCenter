import {
  GwDomNode, GwEventType, GwMap, GwValueWidgetElement,
  HTMLTextInputElement
} from "../../types/gwTypes";
import {gwPrefPanel} from "../../core/gwPrefPanel";
import {gwDatePickerHelper} from "./gwDatePickerHelper";
import {GwInitializableSystem} from "../../core/util/GwInitializableSystem";
import {gwUtil} from "../../core/util/gwUtil";
import {gwLocale} from "../../core/gwLocale";
import {gwInputSystems} from "../../core/inputs/gwInputSystems";
import {gwInputs} from "../../core/inputs/gwInputs";
import {gwConfirm} from "../../core/gwConfirm";
import {gwForm} from "../../core/gwForm";
import {gwAria} from "../../core/aria/GwAria";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * DatePicker (DateValue)
 *
 * # OVERVIEW #
 * The DatePicker a client only widget, (the server knows nothing about it, and it knows nothing of the server), largely cribbed from the jQuery.datePicker.widget
 * We've cleaned out all unneeded code, added some features, and put in custom styling and layout. There is a lot of code
 * in this widget that doesn't conform to how we (gw) have been standardizing our js, but I've left it as a cleanup task.
 *
 *
 * # ENTRY POINT #
 * The entry point, currently, for the datePicker functionality finds any inputs marked with gw-DateValueWidget--input
 * and attaches listeners to those inputs, and any default properties. On focus, the datePicker becomes a child of the input's parent, and positions
 * itself absolutely below the input.
 *
 * The date picker then takes over various key events fired on the input, and manipulates its own UI accordingly.
 *
 *
 * # DEFAULTS & OVERRIDING PER INSTANCE #
 * It has dozens of defaults listed in gwDate._defaults. THESE ARE NEW AND OLD AND CHANGED from jquery, do NOT rely on their
 * documentation. Any input can override any of these defaults by passing an object to the .datePicker init method.
 * ie: $(".myInput").datePicker({hidePickerOnSelect: false});
 *
 * Every input has a property instance (referred to as inst in code), that holds that input's information, and custom properties.
 * Therefore, anywhere the code needs to get a property, it needs to use gwDate._get(inst, "property name") to be able to use the default
 * values if the property is not defined on the input itself.
 *
 *
 * # CLICK & KEY EVENTS #
 * Click-events are now handled by gw global events, and constantly punt focus back to the input element. See  _keyDown method.
 */
export class GwDateValue extends GwInitializableSystem {
  private twoDigitYearInfo: GwMap = {};

  // private dateShortcuts: GwMap = {};
  private _amPmStringCache: string[] | null = null;

  getSystemName (): string {
    return "gwDateValue";
  }

  /**
   * Needs to be fired on page loads.
   * @param isFullPageReload
   */
  init (isFullPageReload: boolean): void {
    this._amPmStringCache = null;

    // this.dateShortcuts = {
    //     "Ctrl/Cmd + →": gwDisplayKey.get("Web.Client.DatePicker.DayPlus"),
    //     "Ctrl/Cmd + ←": gwDisplayKey.get("Web.Client.DatePicker.DayMinus"),
    //     "Ctrl/Cmd + ↓": gwDisplayKey.get("Web.Client.DatePicker.WeekPlus"),
    //     "Ctrl/Cmd + ↑": gwDisplayKey.get("Web.Client.DatePicker.WeekMinus"),
    //     "Ctrl/Cmd + ENTER": gwDisplayKey.get("Web.Client.DatePicker.SelectDay"),
    //     "Alt + →": gwDisplayKey.get("Web.Client.DatePicker.MonthPlus"),
    //     "Alt + ←": gwDisplayKey.get("Web.Client.DatePicker.MonthMinus"),
    //     "Alt + ↓": gwDisplayKey.get("Web.Client.DatePicker.YearPlus"),
    //     "Alt + ↑": gwDisplayKey.get("Web.Client.DatePicker.YearMinus"),
    //     "Ctrl/Cmd + END": gwDisplayKey.get("Web.Client.DatePicker.Close"),
    //     "Ctrl/Cmd + HOME": gwDisplayKey.get("Web.Client.DatePicker.GoToToday")
    // };

    if (isFullPageReload) {
      this.twoDigitYearInfo = {
        threshold: parseInt(gwUtil.getUtilityInfo("gw-twoDigitYearThreshold")),
        late: parseInt(gwUtil.getUtilityInfo("gw-twoDigitYearLate")),
        early: parseInt(gwUtil.getUtilityInfo("gw-twoDigitYearEarly"))
      };

    }

  }

  /**
   * Returns true if the first value widget ancestor is a date value widget
   * @param el
   * @returns {boolean}
   */
  isDateTimeElement (el: GwDomNode | null): boolean {
    if (!el) {
      return false;
    }

    const widget = gwForm.findEnclosingValueWidget(el);
    return !!(widget && widget.hasAttribute("data-gw-datetime"));
  }

  getTwoDigitYearThreshold (): number {
    return this.twoDigitYearInfo.threshold;
  }

  getTwoDigitYearLate (): number {
    return this.twoDigitYearInfo.late;
  }

  getTwoDigitYearEarly (): number {
    return this.twoDigitYearInfo.early;
  }

  shouldCapDateTimeUserInput (): boolean {
    return gwPrefPanel.getPrefValueByPrefName("capDateTimeUserInput") as boolean;
  }

  getAmString (): string {
    const amPmStrings = this.getAmPmStrings();
    if (!amPmStrings) {
      return "";
    }
    return amPmStrings[0];
  }

  getPmString (): string {
    const amPmStrings = this.getAmPmStrings();
    if (!amPmStrings) {
      return "";
    }
    return amPmStrings[1];
  }

  private getAmPmStrings (): string[] {
    if (!this._amPmStringCache) {
      this._amPmStringCache = gwLocale.getPeriods();
    }
    return this._amPmStringCache;
  }

  // =============== PUBLIC METHODS FOR EVENTS ==================

  /**
   * @public
   */
  hideDatePicker (): void {
    gwDatePickerHelper.hideDatePicker();
  }

  /**
   * Opens the date picker if focusOpenDatePicker is true
   */
  showDatePickerOnFocus (el: HTMLTextInputElement, args: GwMap, event: GwEventType): void {
    if (gwPrefPanel.getPrefValueByPrefName("focusOpenDatePicker")) {
      gwDatePickerHelper.showDatePicker(el);
    }
  }

  /**
   * Clicking the icon will punt focus into the date input.
   * It will also act as a toggle for the date picker showing.
   *
   * NOTE: this method should NOT put focus into the input element
   * as focus will force a touch device's keyboard open, which is likely to obscure the date picker
   * @param el
   * @param args
   * @param event
   */
  dateIconClicked (el: GwDomNode, args: GwMap, event: GwEventType): void {
    const dateWidget = document.getElementById(args.id);
    if (!dateWidget) {
      return;
    }

    const inCurrentDatePicker = gwUtil.hasClass(el, "gw-inDatePicker");

    if (gwDatePickerHelper.isDatePickerShowing()) {
      this.hideDatePicker();
    }

    if (!inCurrentDatePicker) {
      const dateInput = this.getDateInputChildOrSibling(dateWidget);
      if (dateInput) {
        gwDatePickerHelper.showDatePicker(dateInput);
      }
    }
  }

  clickedOnAmPmInput (el: HTMLInputElement, args: GwMap): void {
    const dateWidget = gwForm.findEnclosingValueWidget(el);
    if (!dateWidget) {
      return;
    }

    const timeInput = this.getTimeInputChildOrSibling(dateWidget);
    if (!timeInput) {
      return;
    }

    const currVal = el.value;
    const am = this.getAmString();
    const pm = this.getPmString();
    const finalVal = (currVal === am) ? pm : am;

    el.value = finalVal;
    gwAria.setAriaPropertyForElement("label", finalVal, el);
    if (el.hasAttribute("data-gw-confirm")) {
      gwConfirm.saveConfirmedValue(dateWidget);
    }

    const formInput = this.getAmPmHiddenInputChildOrSibling(dateWidget);
    if (formInput) {
      formInput.value = finalVal;
      gwDatePickerHelper.markDateValueInputModified(formInput, "date", el);
    }
  }

  /**
   * @public
   * @param el
   * @param args
   * @param event
   */
  notifyPickerOfInputChange (valueWidget: GwValueWidgetElement, el: HTMLTextInputElement): void {
    gwDatePickerHelper.updateDatePickerFromDateInputField();
    gwDatePickerHelper.updateDatePicker();
  }

  getPostToServerValue (dateValueWidget: GwDomNode): string {
    return this.getFourPartEditableValue(dateValueWidget).join(" ").trim()
  }

  getFourPartEditableValue (dateValueWidget: GwDomNode): [string, string, string, string] {
    const parts: [string, string, string, string] = ["", "", "", ""];

    const eraSelect = this.getEraInputChildOrSibling(dateValueWidget);
    if (eraSelect) {
      parts[0] = eraSelect.value.trim();
    }

    const dateInput = this.getDateInputChildOrSibling(dateValueWidget);
    if (dateInput) {
      parts[1] = dateInput.value.trim();
    }

    const timeInput = this.getTimeInputChildOrSibling(dateValueWidget);
    if (timeInput) {
      parts[2] = timeInput.value.trim();
    }

    const ampmInput = this.getAmPmHiddenInputChildOrSibling(dateValueWidget);
    if (ampmInput && timeInput && timeInput.value) {
      parts[3] = ampmInput.value.trim();
    }

    return parts;
  }

  getValue (dateWidgetNode: GwDomNode): string {
    const widget = gwUtil.getDomNodeOrThrow(dateWidgetNode);

    if (!widget) {
      return "";
    }

    if (gwInputs.isReadOnlyValueWidget(widget)) {
      const readonlyWrapper = widget.querySelector(".gw-value-readonly-wrapper") as HTMLDivElement;
      if (readonlyWrapper) {
        return readonlyWrapper.innerText;
      }
    }

    return this.getFourPartEditableValue(widget).join(" ");
  }

  setValue (dateWidgetNode: GwValueWidgetElement, dateValue: string): boolean {

    const dateInput = this.getDateInputChildOrSibling(dateWidgetNode);
    if (dateInput) {
      dateInput.value = dateValue;
      gwInputSystems.valueChangedSoProcessDateInfo(dateWidgetNode, dateInput);
      return true;
    } else {
      //maybe timeInput
      const timeInput = this.getTimeInputChildOrSibling(dateWidgetNode);
      if (timeInput) {
        timeInput.value = dateValue;
        gwInputSystems.valueChangedSoProcessDateInfo(dateWidgetNode, timeInput);
        return true;
      }
    }
    return false;
  }

  deferredChangeOnFocusInMethod (): void {
    // In case the date or time picker is open and we move away,
    // make sure date and time pickers are closed.
    this.hideDatePicker();
  }

  getEraInputChildOrSibling (el: GwDomNode): HTMLTextInputElement | null {
    const valueWidget = gwForm.findEnclosingValueWidget(el);
    if (!valueWidget) {
      return null;
    }

    return valueWidget.querySelector(".gw-DateValueWidget--era");
  }

  getDateInputChildOrSibling (el: GwDomNode): HTMLTextInputElement | null {
    const valueWidget = gwForm.findEnclosingValueWidget(el);
    if (!valueWidget) {
      return null;
    }

    return valueWidget.querySelector(".gw-DateValueWidget--dateInput");
  }

  getTimeInputChildOrSibling (el: GwDomNode): HTMLTextInputElement | null {
    const valueWidget = gwForm.findEnclosingValueWidget(el);
    if (!valueWidget) {
      return null;
    }

    return valueWidget.querySelector(".gw-DateValueWidget--timeInput");
  }

  getAmPmHiddenInputChildOrSibling (el: GwDomNode): HTMLTextInputElement | null {
    const valueWidget = gwForm.findEnclosingValueWidget(el);
    if (!valueWidget) {
      return null;
    }

    return valueWidget.querySelector(".gw-DateValueWidget--ampm");
  }

  getAmPmButtonChildOrSibling (el: GwDomNode): HTMLButtonElement | null {
    const valueWidget = gwForm.findEnclosingValueWidget(el);
    if (!valueWidget) {
      return null;
    }

    return valueWidget.querySelector(".gw-DateValueWidget--ampm-button");
  }

  getDateIconChildOrSibling (el: GwDomNode): HTMLDivElement | null {
    const valueWidget = gwForm.findEnclosingValueWidget(el);
    if (!valueWidget) {
      return null;
    }

    return valueWidget.querySelector(".gw-date-icon");
  }

  isDateInputElement (el: GwDomNode): boolean {
    return gwUtil.hasClass(el, "gw-DateValueWidget--dateInput");
  }

  isTimeInputElement (el: GwDomNode): boolean {
    return gwUtil.hasClass(el, "gw-DateValueWidget--timeInput");
  }

  enable (widget: GwDomNode, enabled: boolean = false): void {

    const eraInput = this.getEraInputChildOrSibling(widget);
    if (eraInput) {
      eraInput.disabled = !enabled;
    }

    const dateInput = this.getDateInputChildOrSibling(widget);
    if (dateInput) {
      dateInput.disabled = !enabled;
    }

    const timeInput = this.getTimeInputChildOrSibling(widget);
    if (timeInput) {
      timeInput.disabled = !enabled;
    }

    const ampmInput = this.getAmPmHiddenInputChildOrSibling(widget);
    const ampmInputButton = this.getAmPmButtonChildOrSibling(widget);
    if (ampmInput && ampmInputButton) {
      ampmInput.disabled = !enabled;
      ampmInputButton.disabled = !enabled;
    }

    const dateIcon = this.getDateIconChildOrSibling(widget);
    if (dateIcon) {
      dateIcon.setAttribute("aria-disabled", (!enabled).toString());
    }
  }

}

export const gwDateValue = new GwDateValue();
