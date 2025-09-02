import {GwDomNode, GwEventType, GwInputElement, GwMap} from "../../types/gwTypes";
import {gwJicHelper} from "./gwJicHelper";
import {gwFocus} from "../../core/gwFocus";
import {gwDatePickerHelper} from "./gwDatePickerHelper";
import {gwUtil} from "../../core/util/gwUtil";
import {GwDateInfo} from "./GwDateInfo";
import {GwInitializableSystem} from "../../core/util/GwInitializableSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwJic extends GwInitializableSystem {

  private monthOptions: string[] = [];
  private readonly eraRegex: RegExp = /^([^\d\s]+)(.*)/;

  getSystemName (): string {
    return "gwJic";
  }

  // INIT
  init (isFullPageReload: boolean): void {
    if (isFullPageReload) {
      this.initializeEra();
      gwUtil.addCustomEventListener("localeChanged", gwJic.initializeEra.bind(this));
    }
  }

  initializeEra (): boolean {
    gwJicHelper.mapEraDataFromServer();
    this.initializeMonthOptionNames();
    return true;
  }

  isJIC (inputEl: GwInputElement): boolean {
    return inputEl.hasAttribute("data-gw-jic");
  }

  // PUBLIC METHODS
  onEraChange (el: GwDomNode): void {
    const eraYear = +gwJicHelper.getEraYearSelect(el).value;
    const maxYears = gwJicHelper.getTotalYearsForCurrentEraSelect(el);
    // Cap the shown years to the max allowable for the new era
    if (eraYear > maxYears) {
      gwJicHelper.setEraYearSelect(maxYears);
    }

    this.onEraYearChange(el);
  }

  onEraYearChange (el: GwDomNode): void {
    const eraYearSelect = gwJicHelper.getEraYearSelect(el);
    if (!eraYearSelect) {
      return;
    }

    this.eraMonthOrYearChangedPossiblyRestrictDates();

    const eraYear = +gwJicHelper.getEraYearSelect(el).value;
    const gregYear = gwJicHelper.eraYearToGregYear(eraYear, true);
    const inst = gwJicHelper.getCurrDateInfo();
    inst.eraYear = eraYear;
    inst["selectedYear"] = gregYear;
    inst["drawYear"] = gregYear;
    gwDatePickerHelper.adjustDate();

    gwDatePickerHelper.putFocusBackOnInput();
  }

  /**
   * Returns the value with the era stripped out.
   * calls setEraValueFromPaste if a possible era is found
   * @param val
   * @param dateInput
   * @returns {*}
   */
  possiblyHandleEraValue (val: string, dateInput: HTMLInputElement): string {
    if (!this.isJIC(dateInput) || !gwUtil.hasValue(val)) {
      return val;
    }

    const eraInputValue = gwJicHelper.getEraInputValue(dateInput);
    const groups = this.eraRegex.exec(val.trim());
    if (groups && groups.length === 3) {
      const digitsInDate = groups[2].trim();
      if (eraInputValue !== "" && digitsInDate === "") {
        gwJicHelper.resetEraInputValue(dateInput);
      }
      gwJicHelper.setEraInputValue(groups[1], dateInput);
      return digitsInDate;
    } else if (eraInputValue === "") {
      // If era is empty, default to the latest era.  If shortcuts are
      // not enabled, this too will be implicitly disabled.
      gwJicHelper.setEraInputValue(gwJicHelper.highestEraIndex, dateInput);
      return val;
    } else {
      return val;
    }
  }

  datePickerCalledShow (el: GwDomNode): void {
    const eraSelect = gwJicHelper.getEraInput(el);
    gwUtil.addClass(eraSelect!, "gw-inDatePicker");
  }

  datePickerCalledHide (el: GwDomNode | null): void {
    gwUtil.removeClass(gwJicHelper.getEraInput(el)!, "gw-inDatePicker");
  }

  datePickerCalledUpdate (inst: GwDateInfo): void {
    // build date from inst, covert it to
    const gregDate = new Date(inst.drawYear, inst.drawMonth, inst.selectedDay);
    gwJicHelper.gregYearToEraYear(gregDate, true);
  }

  getDefaultDate (): Date {
    //const gregYear = eraYearToGregYear(null);
    //return new Date(gregYear, getInst().drawMonth, 1);
    return new Date();
  }

  datePickerCalledParseDate (eraYear: number): number {
    if (!eraYear) {
      return 0;
    }

    gwJicHelper.setEraYearSelect(eraYear);
    return gwJicHelper.eraYearToGregYear(eraYear);
  }

  datePickerCalledFormatDate (gregDateObj: Date): number {
    return +gwJicHelper.gregYearToEraYear(gregDateObj, true).year;
  }

  datePickerCalledSelectDate (): void {
    gwJicHelper.setEraInputValue(gwJicHelper.getEraSelectValue());
  }

  getEraYearPickerHtml (eraYearStr: string): string {
    const eraYear = parseInt(eraYearStr);
    const eraDetail = gwJicHelper.getEraDetailsForValueOrIndexOrThrow(gwJicHelper.getEraSelectValue());
    let eraYearSelectHtml = "<div class=\"gw-datePicker--eraYear\"><select id=\"gw-datePicker--eraYear--select\" data-gw-change=\"gwJic.onEraYearChange\" data-gw-event-barrier>";
    for (let i = eraDetail.total; i >= 1; i--) {
      eraYearSelectHtml += ("<option value=\"" + i + "\"");
      if (eraYear === i) {
        eraYearSelectHtml += " selected";
      }
      eraYearSelectHtml += (">" + i + gwJicHelper.eraYearLocalizedSuffix + "</option>");
    }
    return eraYearSelectHtml + "</select><div class='gw-icon'></div></div>";
  }

  getEraPickerHtml (): string {
    const eraVal = gwJicHelper.getEraSelectValue();
    const currentIndex = gwJicHelper.getEraDetailsForValueOrIndexOrThrow(eraVal).index;
    let eraPickerHtml = "<div class='gw-datePicker--era'><select id=\"gw-datePicker--era--select\" data-gw-change=\"gwJic.onEraChange\" data-gw-event-barrier>";
    for (let i = gwJicHelper.highestEraIndex; i >= 0; i--) {
      const name = gwJicHelper.eraIndexOrNameToDetails[i].name;
      eraPickerHtml += ("<option value=\"" + name + "\"");
      if (currentIndex === i) {
        eraPickerHtml += " selected";
      }
      eraPickerHtml += (">" + name + "</option>");
    }
    return eraPickerHtml + "</select><div class='gw-icon'></div></div>";
  }

  getMonthOptionNames (): string[] {
    return this.monthOptions;
  }

  initializeMonthOptionNames (): void {
    this.monthOptions = [];
    for (let i = 1; i < 13; i++) {
      this.monthOptions.push("" + i + gwJicHelper.eraMonthLocalizedSuffix);
    }
  }

  showDatePicker (el: GwDomNode, args: GwMap, e: GwEventType): void {
    const dateWidget = document.getElementById(args.id);
    if (!dateWidget) {
      return;
    }

    const dateInput = dateWidget.querySelector(".gw-DateValueWidget--dateInput");
    if (!dateInput) {
      return;
    }

    gwFocus.forceFocus(dateInput as GwDomNode);
  }

  eraMonthOrYearChangedPossiblyRestrictDates (): void {
    const detail = gwJicHelper.getEraDetailsForValueOrIndex(gwJicHelper.getEraSelectValue());
    if (!detail) {
      return;
    }

    // No need to do anything, since the whole month will be valid
    if (detail.startDay === 1) {
      return;
    }
    const eraYearSelect = gwJicHelper.getEraYearSelect(null);
    if (!eraYearSelect) {
      return;
    }
    const eraYear = +eraYearSelect.value;
    if (!eraYear) {
      return;
    }

    const currMonth = +gwJicHelper.getMonthSelect(null).value;

    if (+eraYear === 1 && currMonth === detail.startMonth) { //If this is year 1, of the first month as emperor, then restrict
      gwDatePickerHelper.disableDaysBefore(detail.startDay);

    } else if (detail.index !== gwJicHelper.highestEraIndex && eraYear >= detail.total) { //If this is the final year, but not the last emperor, then restrict
      const nextEmperorDetail = gwJicHelper.getEraDetailsForValueOrIndexOrThrow(detail.index + 1);
      const finalMonth = nextEmperorDetail.startMonth;

      if (finalMonth === currMonth) {
        gwDatePickerHelper.disableDaysAfter(nextEmperorDetail.startDay - 1);
      }
    }
  }
}

export const gwJic = new GwJic();
