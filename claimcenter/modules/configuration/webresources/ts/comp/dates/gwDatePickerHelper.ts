import { gwAria } from "../../core/aria/GwAria";
import { gwEvents } from "../../core/events/gwEvents";
import { gwKeys } from "../../core/events/gwKeys";
import { gwDisplayKey } from "../../core/gwDisplayKey";
import { gwFocus } from "../../core/gwFocus";
import { gwForm } from "../../core/gwForm";
import { gwHelpText } from "../../core/gwHelpText";
import { gwLocale } from "../../core/gwLocale";
import { gwInputSystems, GwInputSystemType } from "../../core/inputs/gwInputSystems";
import { GwInitializableSystem } from "../../core/util/GwInitializableSystem";
import { gwUtil } from "../../core/util/gwUtil";
import { GwDomNode, GwMap, HTMLTextInputElement } from "../../types/gwTypes";
import { GwDateInfo } from "./GwDateInfo";
import { gwDateValue } from "./gwDateValue";
import { gwJic } from "./gwJic";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwDatePickerHelper extends GwInitializableSystem {
  private readonly _mainDivId: string = "gw-datePicker"; // The ID of the main datePicker division
  private readonly _unselectableClass: string = " gw-datePicker--unselectable"; // The name of the unselectable cell marker class
  private readonly _otherMonthDayClass: string = " gw-datePicker--other-month";
  private readonly _inputtedValueDayClass: string = " gw-datePicker--inputted-value-day"; // The name of the current day marker class
  private readonly _todayDayClass: string = " gw-datePicker--today-cell";
  private readonly _keyEventCurrentDayClass: string = " gw-datePicker--keyEventDay";
  private readonly minRows: number = 6;

  private _datePickerShowing: boolean = false;
  private _lastEventWasKey: boolean = false; // If the last event was a key event

  private _$datePickerDiv: JQuery | null = null;

  private _currDateInfo: GwDateInfo | null = null;
  private _lastInput: HTMLInputElement | null = null;

  readonly settings: GwMap = {
    // Global defaults for all the date picker instances
    dateFormat: "mm/dd/yyyy", //this is just a default, if we don't find one on the input
    firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
    showMonthAfterYear: true, // True if the year select precedes month, false for month then year
    yearSuffix: "", // Additional text to append to the year in the month headers

    defaultDate: null, // Used when field is blank: actual date,
    // +/-number for offset from today, null for today
    changeMonth: true, // True if month can be selected directly, false if only prev/next
    changeYear: true, // True if year can be selected directly, false if only prev/next
    yearRange: "c-100:c+10", // Range of years to display in drop-down,
    // either relative to today's year (-nn:+nn), relative to currently displayed year
    // (c-nn:c+nn), absolute (nnnn:nnnn), or a combination of the above (nnnn:-n)
    showOtherMonths: true, // True to show dates in other months, false to leave blank
    selectOtherMonths: true, // True to allow selection of dates in other months, false for unselectable
    // takes a Date and returns the number of the week for it
    shortYearCutoff: "49", // Short year values < this are in the current century, //TODO: we could pull this from the server config
    // > this are in the previous century,
    minDate: null, // The earliest selectable date, or null for no limit
    maxDate: null, // The latest selectable date, or null for no limit
    numberOfMonths: 1, // Number of months to show at a time //TODO: numbers larger than one are not currently supported, needs more complex styling.
    stepMonths: 1, // Number of months to step back/forward
    stepBigMonths: 12, // Number of months to step back/forward for the big links
    hidePickerOnSelect: true, // Fire hidePicker if the user selects a new date
  };

  protected availableToGlobal(): boolean {
    return false;
  }

  getSystemName(): string {
    return "gwDatePicker";
  }

  init(isFullPageReload: boolean): void {
    this.settings.monthNamesShort = gwLocale.getShortMonths();
    this.settings.dayNamesMin = gwLocale.getMinWeekdays();
    this.settings.firstDay = gwLocale.getFirstDayOfWeek();

    if (isFullPageReload) {
      this._currDateInfo = null;
    }

    gwUtil.forEach(gwUtil.getDomNodes(".gw-DateValueWidget--dateInput"), (el) => this.setupDateInput(el as HTMLTextInputElement));
  }

  get datePickerDiv(): HTMLDivElement {
    return this.$datePickerDiv[0] as HTMLDivElement;
  }

  get $datePickerDiv(): JQuery {
    if (!this._$datePickerDiv || !this._$datePickerDiv[0]) {
      this._$datePickerDiv = $(gwUtil.createDiv(["gw-min-visible", "gw-inDatePicker", "gw-hidden"], { id: this._mainDivId }));
    }

    return this._$datePickerDiv;
  }

  isDatePickerShowing(): boolean {
    return this._datePickerShowing;
  }

  setupDateInput(inputEl: HTMLTextInputElement): void {
    if (inputEl.nodeName.toLowerCase() !== "input") {
      throw new Error("Trying to add date picker to non input");
    }

    inputEl.setAttribute("data-gw-focus", "gwDateValue.showDatePickerOnFocus");
  }

  get currDateInfo(): GwDateInfo | null {
    return this._currDateInfo;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!gwUtil.hasClass(event.target as GwDomNode, "gw-inDatePicker") || !this._currDateInfo) {
      return;
    }

    const key = gwKeys.getKeyCode(event);

    if (key !== null && key !== undefined) {
      if (gwKeys.ignoredKeyCodes[key]) {
        return;
      }
    }

    let handled = true;

    const checkCtrlMetaAndHandled = (): boolean => {
      handled = event.ctrlKey || event.metaKey;
      return handled;
    };

    const checkAltAndHandled = (): boolean => {
      handled = event.altKey;
      return handled;
    };

    this._lastEventWasKey = true;

    if (this._datePickerShowing) {
      switch (event.keyCode) {
        case gwKeys.shortcutKeyWordToKeyCodeMap.TAB:
          this.hideDatePicker();
          handled = false;
          break; // hide on tab out
        case gwKeys.shortcutKeyWordToKeyCodeMap.ENTER:
          handled = this.selectCurrentlyKeySelectedDay();
          break; //select current day on ctrl enter
        case gwKeys.shortcutKeyWordToKeyCodeMap.END:
          if (checkCtrlMetaAndHandled()) {
            this.clearDate();
          }
          break; // clear on ctrl or command +end
        case gwKeys.shortcutKeyWordToKeyCodeMap.HOME:
          if (checkCtrlMetaAndHandled()) {
            this.adjustDatePickerToShowToday();
          }
          break; // current on ctrl or command +home
        case gwKeys.shortcutKeyWordToKeyCodeMap.LEFT:
          // Move month left
          if (checkAltAndHandled()) {
            this.adjustDate(-this.getSetting("stepMonths"), "M");
            // Move day left
          } else if (checkCtrlMetaAndHandled()) {
            this.adjustDate(-1, "D");
          }
          break;
        case gwKeys.shortcutKeyWordToKeyCodeMap.UP:
          //Move year up
          if (checkAltAndHandled()) {
            this.adjustDate(-this.getSetting("stepBigMonths"), "M");
            // Move day up
          } else if (checkCtrlMetaAndHandled()) {
            this.adjustDate(-7, "D");
          }
          break;
        case gwKeys.shortcutKeyWordToKeyCodeMap.RIGHT:
          // Move month up
          if (checkAltAndHandled()) {
            this.adjustDate(+this.getSetting("stepMonths"), "M");
            // move day up
          } else if (checkCtrlMetaAndHandled()) {
            this.adjustDate(+1, "D");
          }
          break;
        case gwKeys.shortcutKeyWordToKeyCodeMap.DOWN:
          // Move year down
          if (checkAltAndHandled()) {
            this.adjustDate(+this.getSetting("stepBigMonths"), "M");
            // Move day down
          } else if (checkCtrlMetaAndHandled()) {
            this.adjustDate(+7, "D");
          }
          break;
        default:
          handled = false;
      }
    } else if (event.keyCode === gwKeys.shortcutKeyWordToKeyCodeMap.HOME && event.ctrlKey) {
      // display the date picker on ctrl+home
      this.showDatePicker(event.target as HTMLTextInputElement);
    } else {
      handled = false;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /** Pop-up the date picker for a given input field.
   * @param  inputEl - the input field attached to the date picker or
   *                    event - if triggered by focus
   */
  showDatePicker(inputEl: HTMLTextInputElement): void {
    if (this._datePickerShowing && this._lastInput === inputEl) {
      return;
    }

    const dateInfo = (this._currDateInfo = new GwDateInfo(inputEl));
    this._lastInput = inputEl;

    if (dateInfo.isJIC) {
      gwJic.datePickerCalledShow(inputEl);
    }

    gwUtil.addClass(dateInfo.inputEl, "gw-inDatePicker");
    dateInfo.inputEl.addEventListener("keydown", this.handleKeyDown.bind(this));
    dateInfo.dateIconEl.addEventListener("keydown", this.handleKeyDown.bind(this));
    gwUtil.addClass(dateInfo.dateIconEl, "gw-inDatePicker");
    gwAria.setAriaPropertyForElement("expanded", true, dateInfo.dateIconEl);
    gwUtil.removeClass(this.$datePickerDiv, "gw-hidden");
    gwAria.setAriaPropertyForElement("hidden", false, this.datePickerDiv);
    gwUtil.appendEl(dateInfo.$inputParent[0], this.$datePickerDiv[0]);

    this.updateDatePickerFromDateInputField();
    this._datePickerShowing = true;
    this.updateDatePicker();

    const inputParent = dateInfo.$inputParent[0];
    const datePickerRenderedAbove = gwInputSystems.preventFloatingElementFromBeingOffscreen(
      inputParent,
      dateInfo.inputEl,
      this.$datePickerDiv[0]
    );
    const valueWidget = gwForm.findEnclosingValueWidget(dateInfo.inputEl);

    if (valueWidget) {
      valueWidget.setAttribute("data-gw-date-picker-v-pos", datePickerRenderedAbove ? "above" : "below");
      gwHelpText.possiblyForceHelptextVAlign(valueWidget, dateInfo.inputEl);
    }

    dateInfo.lastVal = null;
  }

  putFocusBackOnInput(): void {
    const dateInfo = this.currDateInfo;
    if (!dateInfo) {
      return;
    }

    if (dateInfo.$input && dateInfo.$input.is(":visible") && !dateInfo.$input.is(":disabled") && !dateInfo.$input.is(":focus")) {
      gwFocus.forceFocus(dateInfo.$input[0]);
    }
  }

  /* Generate the date picker content. */
  updateDatePicker(): void {
    if (!this._datePickerShowing) {
      return;
    }

    const dateInfo = this.currDateInfo;
    if (!dateInfo) {
      return;
    }

    if (dateInfo.isJIC) {
      gwJic.datePickerCalledUpdate(dateInfo);
    }

    const datePickerHtml = this.generateHTML(dateInfo);
    this.$datePickerDiv.empty().append(datePickerHtml);
    // This code updates an invisible "live region" in a sub-div of the date icon.
    // Changes to this are read aloud to anyone using a screen reader or other assistive technology.
    // Since a user is not deposited into the calendar widget to make a selection,
    // and is instead expected to use CTRL + arrow keys or ALT + arrow keys for navigation,
    // changes to the "focused" date are not recognized by assistive technologies.
    // This change ensures that, upon changing the day, month, or year, a blind user is read aloud the new date.
    // TODO: Investigate. On NVDA at least, the label is read aloud twice when navigating. Considered low priority.
    const liveRegion: GwDomNode = dateInfo.dateIconEl.querySelector(".gw-date-liveregion") as GwDomNode;
    if (liveRegion) {
      const selectedDate = this.daylightSavingAdjust(new Date(dateInfo.drawYear, dateInfo.drawMonth, dateInfo.selectedDay));
      const todayDay = this.getToday();
      const currentDay = this.getCurrentDay(dateInfo);

      // Construct live region label
      let dateStr = selectedDate.toDateString();
      if (todayDay.getTime() === selectedDate.getTime()) {
        dateStr = gwDisplayKey.get("Web.Client.Calendar.CalendarWidgetTodayAriaKeyword") + " " + dateStr;
      }
      if (currentDay.getTime() === selectedDate.getTime()) {
        dateStr = gwDisplayKey.get("Web.Client.Calendar.CalendarWidgetKeySelectedDayAriaKeyword") + " " + dateStr;
      }
      gwAria.setAriaPropertyForElement("label", dateStr, liveRegion);
    }

    if (dateInfo.isJIC) {
      gwJic.eraMonthOrYearChangedPossiblyRestrictDates();
    }

    this.$datePickerDiv.width("");
  }

  /* Hide the date picker from view.*/
  hideDatePicker(): void {
    if (!this._datePickerShowing) {
      return;
    }

    if (this._currDateInfo && this._currDateInfo.isJIC) {
      gwJic.datePickerCalledHide(null);
    }

    gwUtil.addClass(this.$datePickerDiv, "gw-hidden");
    gwAria.setAriaPropertyForElement("hidden", true, this.datePickerDiv);
    if (this._lastInput) {
      gwUtil.removeClass(this._lastInput, "gw-inDatePicker");
      $(this._lastInput).off("keydown");
      gwForm.findEnclosingValueWidget(this._lastInput)!.removeAttribute("data-gw-date-picker-v-pos");
    }

    if (this._currDateInfo) {
      $(this._currDateInfo.dateIconEl).off("keydown"); //TODO: ARIA
      gwUtil.removeClass(this._currDateInfo.dateIconEl, "gw-inDatePicker");
      gwAria.setAriaPropertyForElement("expanded", false, this._currDateInfo.dateIconEl);
      gwUtil.removeClass(this._currDateInfo.$inputParent[0], "gw-date-picker-below");
    }

    this._lastInput = null;
    this._datePickerShowing = false;
    this._currDateInfo = null;
  }

  /* Adjust one of the date sub-fields. */
  adjustDate(offset: number = 0, period: string = ""): void {
    this.adjustInternalDate(offset, period);
    this.updateDatePicker();
  }

  /**
   * Show the month and year that currently contains today's date.
   * @param inst
   * @private
   */
  adjustDatePickerToShowToday(): void {
    const dateInfo = this.currDateInfo;
    if (!dateInfo) {
      return;
    }

    const date = new Date();
    dateInfo.selectedDay = date.getDate();
    dateInfo.drawMonth = dateInfo.selectedMonth = date.getMonth();
    dateInfo.drawYear = dateInfo.selectedYear = date.getFullYear();
    this.adjustDate();
  }

  selectToday(): void {
    const date = new Date();
    this.selectDay(date.getMonth(), date.getFullYear(), date.getDate());
  }

  /**
   * I don't understand why all of this is really necessary, but I didn't want to just copy-paste
   * from the function generateHTML.
   * @author zfine
   */
  getToday(): Date {
    const tempDate = new Date();
    return this.daylightSavingAdjust(new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()));
  }

  getCurrentDay(inst: GwDateInfo): Date {
    return this.daylightSavingAdjust(
      !inst.currentDay ? new Date(9999, 9, 9) : new Date(inst.currentYear, inst.currentMonth, inst.currentDay)
    );
  }

  /**
   * Show the month and year of the date displayed in the input element
   * @param inst
   * @private
   */
  adjustDatePickerToShowDayFromInputField(): void {
    const dateInfo = this.currDateInfo;
    if (!dateInfo) {
      return;
    }

    if (!dateInfo.currentDay) {
      return;
    }

    dateInfo.selectedDay = dateInfo.currentDay;
    dateInfo.drawMonth = dateInfo.selectedMonth = dateInfo.currentMonth;
    dateInfo.drawYear = dateInfo.selectedYear = dateInfo.currentYear;
    this.adjustDate();
  }

  /* Action for selecting a new month/year. */
  selectMonthYear(select: HTMLSelectElement, period: string): void {
    const dateInfo = this.currDateInfo;
    if (!dateInfo) {
      return;
    }

    (dateInfo as GwMap)["selected" + (period === "M" ? "Month" : "Year")] = (dateInfo as GwMap)[
      "draw" + (period === "M" ? "Month" : "Year")
    ] = parseInt(select.options[select.selectedIndex].value, 10);

    this.adjustDate();
  }

  /* Action for selecting a day. */
  selectDay(month: number, year: number, day: number): void {
    const dateInfo = this.currDateInfo;

    if (!dateInfo || !dateInfo.$input || dateInfo.$input.hasClass(this._unselectableClass)) {
      return;
    }

    dateInfo.selectedDay = dateInfo.currentDay = day;
    dateInfo.selectedMonth = dateInfo.currentMonth = month;
    dateInfo.selectedYear = dateInfo.currentYear = year;

    this.selectDate(this.formatDate(dateInfo.currentDay, dateInfo.currentMonth, dateInfo.currentYear));
  }

  private selectCurrentlyKeySelectedDay(): boolean {
    if (!this.isDatePickerShowing() || !this._currDateInfo) {
      return false;
    }

    const sel = $(".gw-datePicker--keyEventDay", this.$datePickerDiv)[0];
    if (sel) {
      this.selectDay(+sel.getAttribute("data-month")!, +sel.getAttribute("data-year")!, +sel.getAttribute("data-day")!);
      return true;
    }

    return false;
  }

  private clearDate(): void {
    this.selectDate("");
  }

  /* Update the input field with the selected date. */
  private selectDate(dateStr: string): void {
    const dateInfo = this._currDateInfo;

    if (!dateInfo) {
      return;
    }

    dateStr = dateStr != null ? dateStr : this.formatDate(dateInfo);
    if (dateInfo.$input) {
      dateInfo.$input.val(dateStr);
      if (dateInfo.isJIC) {
        gwJic.datePickerCalledSelectDate();
      }
    }

    this.putFocusBackOnInput();

    if (this.getSetting("hidePickerOnSelect")) {
      this.hideDatePicker();
    }

    this.markDateValueInputModified(dateInfo.inputEl, "datepicker");
  }

  private getCurrentDateFormat(): string {
    const inst = this.currDateInfo;
    if (!inst) {
      return this.getSetting("dateFormat");
    }

    const widget = gwForm.findEnclosingValueWidget(inst.inputEl);
    if (!widget) {
      return this.getSetting("dateFormat");
    }
    return (
      (gwDateValue.isDateInputElement(inst.inputEl)
        ? widget.getAttribute("data-gw-date-mask")
        : widget.getAttribute("data-gw-time-mask")) || this.getSetting("dateFormat")
    );
  }

  private parseDateFromDateField(forcedValue?: string | null): Date {
    const inst = this.currDateInfo;
    const format = this.getCurrentDateFormat().toUpperCase();

    let value = gwUtil.hasValue(forcedValue) ? forcedValue : inst && inst.$input ? inst.$input.val() : null;

    if (format === null || value === null) {
      throw new Error("Invalid arguments");
    }

    value = typeof value === "object" ? value.toString() : value + "";

    if (value === "") {
      return new Date();
    }

    const day = parseInt(value.substr(format.indexOf("DD"), 2));

    const month = parseInt(value.substr(format.indexOf("MM"), 2));

    let yIndex = format.indexOf("YYYY");
    let yLength = 4;
    if (yIndex === -1) {
      yIndex = format.indexOf("YY");
      yLength = 2;
    }
    let year = parseInt(value.substr(yIndex, yLength));
    const eraYear = year;

    if (yLength === 2) {
      let fullYear = new Date().getFullYear();
      if (year > this.settings.shortYearCutoff) {
        fullYear -= 100;
      }

      year = parseInt(("" + fullYear).substr(0, 2) + year);
    }

    if (inst && inst.isJIC) {
      year = gwJic.datePickerCalledParseDate(eraYear);
    }

    const date = this.daylightSavingAdjust(new Date(year, month - 1, day));
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
      throw new Error("Invalid date"); // E.g. 31/02/00
    }

    return date;
  }

  /* Get a setting value, defaulting if necessary. */
  getSetting(name: string): any {
    return this.settings[name];
  }

  updateDatePickerFromDateInputField(): void {
    const dateInfo = this.currDateInfo;

    if (!dateInfo) {
      return;
    }

    if (this._datePickerShowing && dateInfo.$input.val() === dateInfo.lastVal) {
      return;
    }

    const dateString = (dateInfo.lastVal = dateInfo.$input ? (dateInfo.$input.val() as string) : null);
    const defaultDate = this.getDefaultDate();
    let date = defaultDate;

    //TODO: I think here we could establish if we thought the date was invalid, and inform the user in some way
    try {
      date = this.parseDateFromDateField(dateString);
      date = date || defaultDate;
    } catch (event) {
      //dateString = dateString;
    }
    dateInfo.selectedDay = date.getDate();
    dateInfo.drawMonth = dateInfo.selectedMonth = date.getMonth();
    dateInfo.drawYear = dateInfo.selectedYear = date.getFullYear();
    dateInfo.currentDay = dateString ? date.getDate() : 0;
    dateInfo.currentMonth = dateString ? date.getMonth() : 0;
    dateInfo.currentYear = dateString ? date.getFullYear() : 0;
    this.adjustInternalDate();
  }

  /* Retrieve the default date shown on opening. */
  private getDefaultDate(): Date {
    const dateInfo = this.currDateInfo;

    if (!dateInfo) {
      return this.getSetting("defaultDate");
    }

    if (dateInfo.isJIC) {
      return gwJic.getDefaultDate();
    }

    const defDate = this.determineDate(this.getSetting("defaultDate"), new Date());
    if (!defDate) {
      throw new Error("Unable to determine a default date.");
    }

    return this.restrictMinMax(defDate);
  }

  /* A date may be specified as an exact value or a relative one. */
  private determineDate(date: Date | number | string | null, defaultDate: Date | null): Date | null {
    const dateInfo = this.currDateInfo;

    if (!dateInfo) {
      return null;
    }

    const offsetNumeric = (offset: number): Date => {
      const dateInner = new Date();
      dateInner.setDate(dateInner.getDate() + offset);
      return dateInner;
    };

    const offsetString = (offset: string): Date => {
      try {
        return this.parseDateFromDateField(offset);
      } catch (e) {
        // Ignore
      }

      const dateInner = (offset.toLowerCase().match(/^c/) ? this.getInternalDateIfValid(dateInfo) : null) || new Date();
      let year = dateInner.getFullYear();
      let month = dateInner.getMonth();
      let day = dateInner.getDate();
      const pattern = /([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g;
      let matches = pattern.exec(offset);

      while (matches) {
        switch (matches[2] || "d") {
          case "d":
          case "D":
            day += parseInt(matches[1], 10);
            break;
          case "w":
          case "W":
            day += parseInt(matches[1], 10) * 7;
            break;
          case "m":
          case "M":
            month += parseInt(matches[1], 10);
            day = Math.min(day, this.getDaysInMonth(year, month));
            break;
          case "y":
          case "Y":
            year += parseInt(matches[1], 10);
            day = Math.min(day, this.getDaysInMonth(year, month));
        }
        matches = pattern.exec(offset);
      }
      return new Date(year, month, day);
    };

    let newDate = defaultDate;

    if (!date) {
      newDate = defaultDate;
    } else if (typeof date === "string") {
      if (date.length === 0) {
        newDate = defaultDate;
      } else {
        newDate = offsetString(date);
      }
    } else if (typeof date === "number") {
      if (isNaN(date)) {
        newDate = defaultDate;
      } else {
        newDate = offsetNumeric(date);
      }
    } else {
      newDate = new Date(date.getTime());
    }

    newDate = newDate && newDate.toString() === "Invalid Date" ? defaultDate : newDate;

    if (!newDate) {
      return null;
    }

    if (newDate) {
      newDate.setHours(0);
      newDate.setMinutes(0);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
    }

    return this.daylightSavingAdjust(newDate);
  }

  /* Handle switch to/from daylight saving.
   * Hours may be non-zero on daylight saving cut-over:
   * > 12 when midnight changeover, but then cannot generate
   * midnight datetime, so jump to 1AM, otherwise reset.
   * @param  date  (Date) the date to check
   * @return  (Date) the corrected date
   */
  private daylightSavingAdjust(date: Date): Date {
    date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
    return date;
  }

  /* Set the date(s) directly. */
  // _setDate (inst: GwDateInfo, date: Date, noChange: boolean = false): void {
  //   const clear = !date;
  //   const origMonth = inst.selectedMonth;
  //   const origYear = inst.selectedYear;
  //   const newDate = this.restrictMinMax(inst, this.determineDate(inst, date, new Date()));
  //
  //   inst.selectedDay = inst.currentDay = newDate.getDate();
  //   inst.drawMonth = inst.selectedMonth = inst.currentMonth = newDate.getMonth();
  //   inst.drawYear = inst.selectedYear = inst.currentYear = newDate.getFullYear();
  //   if ((origMonth !== inst.selectedMonth || origYear !== inst.selectedYear) && !noChange) {
  //     //NOTE: was using onchange notification here, leaving, in case one day we implement something similar
  //   }
  //
  //   this.adjustInternalDate(inst);
  //
  //   if (inst.$input) {
  //     inst.$input.val(clear ? "" : this.formatDate(inst));
  //   }
  // }

  /* Retrieve the date(s) directly. */
  private getInternalDateIfValid(inst: GwDateInfo): Date | null {
    return !inst.currentYear || (inst.$input && inst.$input.val() === "")
      ? null
      : this.daylightSavingAdjust(new Date(inst.currentYear, inst.currentMonth, inst.currentDay));
  }

  disableDaysAfter(lastValidDay: number | string): void {
    lastValidDay = +lastValidDay;
    const inst = this._currDateInfo;
    if (!inst) {
      return;
    }

    if (inst.selectedDay > lastValidDay) {
      this.adjustInternalDate(lastValidDay, "D");
    }

    inst.disableDaysAfter = lastValidDay;
    inst.disableTestFoundDate1 = 0;
  }

  disableDaysBefore(firstValidDay: number | string): void {
    firstValidDay = +firstValidDay;
    const inst = this._currDateInfo;
    if (!inst) {
      return;
    }
    if (inst.selectedDay < firstValidDay) {
      this.adjustInternalDate(firstValidDay, "D");
    }

    inst.disableDaysBefore = firstValidDay;
    inst.disableTestFoundDate1 = 0;
  }

  private shouldDisableCalendarDate(num: string | number, inst: GwDateInfo): boolean {
    num = +num;

    // If no days to disable, then exit.
    if (!inst.disableDaysBefore && !inst.disableDaysAfter) {
      inst.disableTestFoundDate1 = 0;
      return false;
    }

    if (num === 1) {
      inst.disableTestFoundDate1++;
    }

    if (inst.disableDaysBefore) {
      if (num < inst.disableDaysBefore && inst.disableTestFoundDate1 < 2) {
        return true;
      }

      // If we haven't found the first date yet, then these dates are in the previous month
      if (!inst.disableTestFoundDate1) {
        return true;
      }
    } else if (inst.disableDaysAfter) {
      if (inst.disableTestFoundDate1 && num > inst.disableDaysAfter) {
        return true;
      }

      // If we've seen the number 1 twice, then all these dates are in the next month
      if (inst.disableTestFoundDate1 === 2) {
        return true;
      }
    }

    return false;
  }

  private getCurrentButtonText(): string {
    return gwDisplayKey.get("Web.Client.DatePicker.SelectedDay") || "";
  }

  private getTodayButtonText(): string {
    return gwDisplayKey.get("Web.Client.DatePicker.Today") || "";
  }

  /* Generate the HTML for the current state of the date picker. */
  private generateHTML(inst: GwDateInfo): string {
    //TODO: ARIA - many of the controls generated here would benefit from inline localized aria labels.
    const todayDay = this.getToday(),
      currentDay = this.getCurrentDay(inst),
      minDate = this.getMinMaxDate("min"),
      maxDate = this.getMinMaxDate("max");

    let maxDraw,
      firstDay,
      html,
      dow,
      group,
      calender,
      thead,
      day,
      printDate,
      dRow,
      tbody,
      daySettings,
      otherMonth,
      unselectable,
      disabled,
      isToday,
      isSelected,
      drawMonth = inst.drawMonth,
      drawYear = inst.drawYear;

    if (drawMonth < 0) {
      drawMonth += 12;
      drawYear--;
    }

    if (drawMonth > 11) {
      drawMonth = 0;
      drawYear++;
    }

    if (maxDate) {
      maxDraw = this.daylightSavingAdjust(new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));
      maxDraw = minDate && maxDraw < minDate ? minDate : maxDraw;
      while (this.daylightSavingAdjust(new Date(drawYear, drawMonth, 1)) > maxDraw) {
        drawMonth--;
        if (drawMonth < 0) {
          drawMonth = 11;
          drawYear--;
        }
      }
    }
    inst.drawMonth = drawMonth;
    inst.drawYear = drawYear;

    const closeButton =
      "<div class='gw-datePicker--close gw-button' role='button' tabindex='0' data-gw-click='gwDatePicker.hide'><div class='gw-icon gw-min-visible'></div></div>";
    const todayButton =
      "<div class='gw-datePicker--today gw-button-secondary' role='button' tabindex='0' data-gw-click='gwDatePicker.today'><div class='gw-icon gw-min-visible'></div>" +
      this.getTodayButtonText() +
      "</div>";
    const currentButton =
      "<div class='gw-datePicker--inputted-value' role='button' tabindex='0' data-gw-click='gwDatePicker.current'><div class='gw-icon gw-min-visible'></div>" +
      this.getCurrentButtonText() +
      "</div>";
    const infoButton = this.getInfoButtonHTML();

    const footer =
      "<div class='gw-datePicker--footer gw-inDatePicker'>" +
      (this.isDateWithinAcceptableRange(todayDay) ? todayButton : "") +
      (this.isDateWithinAcceptableRange(currentDay) ? currentButton : "") +
      infoButton +
      closeButton +
      "</div>";

    firstDay = parseInt(this.getSetting("firstDay"), 10);
    firstDay = isNaN(firstDay) ? 0 : firstDay;

    const dayNamesMin = this.getSetting("dayNamesMin");
    const monthNamesShort = this.getSetting("monthNamesShort");

    const showOtherMonths = this.getSetting("showOtherMonths");
    const selectOtherMonths = this.getSetting("selectOtherMonths");
    const defaultDate = this.getDefaultDate();
    html = "";

    group = "";
    const selectedDate = this.daylightSavingAdjust(new Date(drawYear, drawMonth, inst.selectedDay));
    calender = "";
    calender +=
      "<div class='gw-datePicker--header gw-inDatePicker'>" +
      this.generateMonthYearHeader(drawMonth, drawYear, minDate, maxDate, monthNamesShort) + // draw month headers
      "</div><table class='gw-datePicker--calendar gw-inDatePicker'><thead>" +
      "<tr>";
    thead = "";
    for (dow = 0; dow < 7; dow++) {
      // days of the week
      day = (dow + firstDay) % 7;
      thead +=
        "<th scope='col'" +
        ((dow + firstDay + 6) % 7 >= 5 ? " class='gw-datePicker--week-end'" : "") +
        ">" +
        "<div title='" +
        dayNamesMin[day] +
        "'>" +
        dayNamesMin[day] +
        "</div></th>";
    }
    calender += thead + "</tr></thead><tbody>";
    const daysInMonth = this.getDaysInMonth(drawYear, drawMonth);
    if (drawYear === inst.selectedYear && drawMonth === inst.selectedMonth) {
      inst.selectedDay = Math.min(inst.selectedDay, daysInMonth);
    }

    const leadDays = (this.getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;
    const numRows = Math.max(this.minRows, Math.ceil((leadDays + daysInMonth) / 7)); // calculate the number of rows to generate

    printDate = this.daylightSavingAdjust(new Date(drawYear, drawMonth, 1 - leadDays));

    for (dRow = 0; dRow < numRows; dRow++) {
      // create date picker rows
      calender += "<tr>";
      tbody = "";
      for (dow = 0; dow < 7; dow++) {
        // create date picker days
        daySettings = [true, ""];
        otherMonth = printDate.getMonth() !== drawMonth;
        unselectable =
          (otherMonth && !selectOtherMonths) || !daySettings[0] || (minDate && printDate < minDate) || (maxDate && printDate > maxDate);
        disabled = this.shouldDisableCalendarDate(printDate.getDate(), inst) ? "gw-disabled-day" : "";
        isToday = printDate.getTime() === todayDay.getTime();
        isSelected = printDate.getTime() === currentDay.getTime();
        tbody +=
          "<td tabindex='0' class='" +
          disabled +
          ((dow + firstDay + 6) % 7 >= 5 ? " gw-datePicker--week-end" : "") + // highlight weekends
          (otherMonth ? this._otherMonthDayClass : "") + // highlight days from other months
          ((printDate.getTime() === selectedDate.getTime() && drawMonth === inst.selectedMonth && this._lastEventWasKey) || // user pressed key
          (defaultDate.getTime() === printDate.getTime() && defaultDate.getTime() === selectedDate.getTime())
            ? this._keyEventCurrentDayClass
            : "") + // highlight selected day
          (unselectable ? this._unselectableClass : "") + // highlight unselectable days
          (otherMonth && !showOtherMonths
            ? ""
            : " " +
              daySettings[1] + // highlight custom dates
              (isSelected ? this._inputtedValueDayClass : "") + // highlight selected day
              (isToday ? this._todayDayClass : "")) + // highlight today (if different)
          "'" + // end class list for <td>
          ((!otherMonth || showOtherMonths) && daySettings[2] ? " title='" + (daySettings[2] as string).replace(/'/g, "&#39;") + "'" : "") + // cell title+
          (unselectable
            ? ""
            : " data-gw-click='gwDatePicker.selectDay' data-day='" +
              printDate.getDate() +
              "' data-month='" +
              printDate.getMonth() +
              "' data-year='" +
              printDate.getFullYear() +
              "'") +
          ">" + // actions
          (otherMonth && !showOtherMonths
            ? "&#xa0;" // display for other months
            : unselectable
            ? "<div>" + printDate.getDate() + "</div>"
            : "<div class='gw-datePicker--day-label" +
              (isToday ? this._todayDayClass : "") +
              (isSelected ? this._inputtedValueDayClass : "") + // highlight selected day
              (otherMonth ? this._otherMonthDayClass : "") + // distinguish dates from other months
              "'" + // end class list for gw-datePicker--day-label
              ">" +
              printDate.getDate() +
              "<div class='gw-datePicker--day-icon'></div></div>") +
          "</td>"; // display selectable date
        printDate.setDate(printDate.getDate() + 1);
        printDate = this.daylightSavingAdjust(printDate);
      }
      calender += tbody + "</tr>";
    }

    calender += "</tbody></table>";
    group += calender;

    html += group;
    html += footer;
    this._lastEventWasKey = false;
    inst.disableDaysBefore = null;
    inst.disableDaysAfter = null;
    return html;
  }

  /* Generate the month and year header. */
  private generateMonthYearHeader(
    drawMonth: number,
    drawYear: number,
    minDate: Date | null,
    maxDate: Date | null,
    monthNamesShort?: any
  ): string {
    const inst = this.currDateInfo;
    if (!inst) {
      throw new Error("Attempting to generate date picker html without current date info");
    }

    let years,
      year,
      endYear,
      html = "",
      monthHtml = "";

    const changeMonth = this.getSetting("changeMonth"),
      changeYear = this.getSetting("changeYear"),
      showMonthAfterYear = this.getSetting("showMonthAfterYear");

    if (inst.isJIC) {
      monthNamesShort = gwJic.getMonthOptionNames();
      html += gwJic.getEraPickerHtml();
      html += gwJic.getEraYearPickerHtml("" + inst.eraYear);
    }

    const prevButton = this.canAdjustMonth(-1, drawYear, drawMonth)
      ? "<div class='gw-datePicker--prev gw-button-secondary' role='button'" +
        " aria-label='" +
        gwDisplayKey.get("Web.Client.Calendar.DateValuePrevMonthButton") +
        "'" +
        " tabindex='0' data-gw-click='gwDatePicker.prev'><div class='gw-icon gw-min-visible'></div></div>"
      : "";
    const nextButton = this.canAdjustMonth(+1, drawYear, drawMonth)
      ? "<div class='gw-datePicker--next gw-button-secondary' role='button'" +
        " aria-label='" +
        gwDisplayKey.get("Web.Client.Calendar.DateValueNextMonthButton") +
        "'" +
        " tabindex='0' data-gw-click='gwDatePicker.next'><div class='gw-icon gw-min-visible'></div></div>"
      : "";

    const inMinYear = minDate && minDate.getFullYear() === drawYear;
    const inMaxYear = maxDate && maxDate.getFullYear() === drawYear;

    monthHtml += prevButton;
    monthHtml +=
      "<div class='gw-datePicker--month gw-select-wrapper'><select id='gw-datePicker--month--select' data-gw-change='gwDatePicker.selectMonth' data-gw-event-barrier>";
    for (let month = 0; month < 12; month++) {
      if ((!inMinYear || month >= minDate!.getMonth()) && (!inMaxYear || month <= maxDate!.getMonth())) {
        monthHtml +=
          "<option value='" +
          month +
          "'" +
          (month === drawMonth ? " selected='selected'" : "") +
          ">" +
          monthNamesShort[month] +
          "</option>";
      }
    }
    monthHtml += "</select><div class='gw-icon gw-min-visible'></div></div>";

    monthHtml += nextButton;

    if (!showMonthAfterYear) {
      html += monthHtml + (!(changeMonth && changeYear) ? "&#xa0;" : "");
    }
    let yearshtml = "";
    if (!changeYear) {
      html += "<div class='gw-datePicker--year'>" + drawYear + "</div>";
    } else {
      // determine range of years to display
      years = this.getSetting("yearRange").split(":");
      const thisYear = new Date().getFullYear();

      const determineYear = (value: string): number => {
        const finalYear = value.match(/c[+\-].*/)
          ? drawYear + parseInt(value.substring(1), 10)
          : value.match(/[+\-].*/)
          ? thisYear + parseInt(value, 10)
          : parseInt(value, 10);
        return isNaN(finalYear) ? thisYear : finalYear;
      };

      year = determineYear(years[0]);
      endYear = Math.max(year, determineYear(years[1] || ""));
      year = minDate ? Math.max(year, minDate.getFullYear()) : year;
      endYear = maxDate ? Math.min(endYear, maxDate.getFullYear()) : endYear;
      yearshtml +=
        "<div class='gw-datePicker--year gw-select-wrapper'><select id='gw-datePicker--year--select' data-gw-change='gwDatePicker.selectYear' data-gw-event-barrier>";
      for (; year <= endYear; year++) {
        yearshtml += "<option value='" + year + "'" + (year === drawYear ? " selected='selected'" : "") + ">" + year + "</option>";
      }
      yearshtml += "</select><div class='gw-icon gw-min-visible'></div></div>";

      html += yearshtml;
    }

    html += this.getSetting("yearSuffix");
    if (showMonthAfterYear) {
      html += (!(changeMonth && changeYear) ? "&#xa0;" : "") + monthHtml;
    }

    return html;
  }

  private getInfoButtonHTML(): string {
    return ""; //TODO: pull out info button completely
  }

  /* Adjust one of the date sub-fields. */
  private adjustInternalDate(offset: number = 0, period: string = ""): void {
    const dateInfo = this.currDateInfo;

    if (!dateInfo) {
      return;
    }

    const year = dateInfo.selectedYear + (period === "Y" ? offset : 0),
      month = dateInfo.selectedMonth + (period === "M" ? offset : 0),
      day = Math.min(dateInfo.selectedDay, this.getDaysInMonth(year, month)) + (period === "D" ? offset : 0),
      date = this.restrictMinMax(this.daylightSavingAdjust(new Date(year, month, day)));

    dateInfo.selectedDay = date.getDate();
    dateInfo.drawMonth = dateInfo.selectedMonth = date.getMonth();
    dateInfo.drawYear = dateInfo.selectedYear = date.getFullYear();
  }

  /* Ensure a date is within any min/max bounds. */
  private restrictMinMax(date: Date | null): Date {
    if (date === null) {
      throw new Error("unable to find min max for a null date");
    }

    const minDate = this.getMinMaxDate("min"),
      maxDate = this.getMinMaxDate("max"),
      newDate = minDate && date < minDate ? minDate : date;
    return maxDate && newDate > maxDate ? maxDate : newDate;
  }

  /* Determine the current maximum date - ensure no time components are set. */
  private getMinMaxDate(minMax: "min" | "max"): Date | null {
    return this.determineDate(this.getSetting(minMax + "Date"), null);
  }

  /* Find the number of days in a given month. */
  private getDaysInMonth(year: number, month: number): number {
    return 32 - this.daylightSavingAdjust(new Date(year, month, 32)).getDate();
  }

  /* Find the day of the week of the first of a month. */
  private getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
  }

  /* Determines if we should allow a "next/prev" month display change. */
  private canAdjustMonth(offset: number, curYear: number, curMonth: number): boolean {
    const numMonths = [1, 1],
      date = this.daylightSavingAdjust(new Date(curYear, curMonth + (offset < 0 ? offset : numMonths[0] * numMonths[1]), 1));

    if (offset < 0) {
      date.setDate(this.getDaysInMonth(date.getFullYear(), date.getMonth()));
    }
    return this.isDateWithinAcceptableRange(date);
  }

  /* Is the given date in the accepted range? */
  isDateWithinAcceptableRange(date: Date): boolean {
    let yearSplit,
      currentYear,
      minYear = null,
      maxYear = null;

    const minDate = this.getMinMaxDate("min"),
      maxDate = this.getMinMaxDate("max"),
      years = this.getSetting("yearRange");

    if (years) {
      yearSplit = years.split(":");
      currentYear = new Date().getFullYear();
      minYear = parseInt(yearSplit[0], 10);
      maxYear = parseInt(yearSplit[1], 10);
      if (yearSplit[0].match(/[+\-].*/)) {
        minYear += currentYear;
      }
      if (yearSplit[1].match(/[+\-].*/)) {
        maxYear += currentYear;
      }
    }

    return (
      (!minDate || date.getTime() >= minDate.getTime()) &&
      (!maxDate || date.getTime() <= maxDate.getTime()) &&
      (!minYear || date.getFullYear() >= minYear) &&
      (!maxYear || date.getFullYear() <= maxYear)
    );
  }

  /* Format the given date for display. */
  private formatDate(day?: any, month?: any, year?: any): string {
    const inst = this.currDateInfo;

    if (!inst) {
      return "";
    }

    if (!day) {
      inst.currentDay = inst.selectedDay;
      inst.currentMonth = inst.selectedMonth;
      inst.currentYear = inst.selectedYear;
    }
    const date = day
      ? typeof day === "object"
        ? day
        : this.daylightSavingAdjust(new Date(year, month, day))
      : this.daylightSavingAdjust(new Date(inst.currentYear, inst.currentMonth, inst.currentDay));

    if (!date) {
      return "";
    }

    let format = this.getCurrentDateFormat();
    let iFormat: number = 0;

    const lookAhead = (match: string): boolean => {
      const matches = format.indexOf(match) > -1;
      if (matches) {
        iFormat += match.length - 1;
      }

      return matches;
    };

    // If there is a match, moving the iFormat pointer and return the formatted number
    const lookAheadAndFormatNumber = (match: string, value: number, len: number): string => {
      return lookAhead(match) ? formatNumber(value, len) : "";
    };

    // Format a number, with leading zero if necessary
    const formatNumber = (value: number, len: number): string => {
      let num = "" + value;
      while (num.length < len) {
        num = "0" + num;
      }
      return num;
    };

    let output = "";
    format = format.toUpperCase();

    if (date) {
      for (iFormat = 0; iFormat < format.length; iFormat++) {
        switch (format.charAt(iFormat)) {
          case "D":
            output += lookAheadAndFormatNumber("DD", date.getDate(), 2);
            break;
          case "M":
            output += lookAheadAndFormatNumber("MM", date.getMonth() + 1, 2);
            break;
          case "Y":
            if (lookAhead("YYYY")) {
              output += date.getFullYear();
            } else if (lookAhead("YY")) {
              if (inst.isJIC) {
                output += formatNumber(gwJic.datePickerCalledFormatDate(date), 2);
              } else {
                output += ("" + date.getFullYear()).slice(-2);
              }
            }
            break;
          default:
            output += format.charAt(iFormat);
        }
      }
    }

    return output;
  }

  markDateValueInputModified(el: HTMLTextInputElement, ignoresystem?: GwInputSystemType, focusElement?: HTMLInputElement): void {
    let forceChangeEvent = false;
    let changeParent = gwUtil.getSelfOrFirstParentWithAttr(el, "data-gw-change");
    if (changeParent) {
      const changeAttrib = changeParent.getAttribute("data-gw-change");
      if (changeAttrib === "refresh") {
        // POC
        forceChangeEvent = true;
      }
    } else {
      changeParent = gwUtil.getSelfOrFirstParentWithAttr(el, "data-gw-reflection-trigger");
    }

    gwInputSystems.notifySystemsOfInputValueChange(el, ignoresystem);
    if (forceChangeEvent) {
      gwEvents.forceGlobalChangeEvent(focusElement ? focusElement : el);
    } else if (changeParent) {
      changeParent.setAttribute("data-gw-pending-change", "gwDateValue");
    }
  }
}

export const gwDatePickerHelper = new GwDatePickerHelper();
