import {gwDatePickerHelper} from "./gwDatePickerHelper";
import {gwJic} from "./gwJic";
import {gwPrefPanel} from "../../core/gwPrefPanel";
import {GwRegisteredSystem} from "../../core/util/GwRegisteredSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwDatePicker extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwDatePicker";
  }

  prev (): void {
    gwDatePickerHelper.adjustDate(-(gwDatePickerHelper.getSetting("stepMonths")), "M");
    gwDatePickerHelper.putFocusBackOnInput();
  }

  next (): void {
    gwDatePickerHelper.adjustDate(+gwDatePickerHelper.getSetting("stepMonths"), "M");
    gwDatePickerHelper.putFocusBackOnInput();
  }

  hide (): void {
    gwDatePickerHelper.putFocusBackOnInput();
    gwDatePickerHelper.hideDatePicker();
  }

  today (): void {
    if (gwPrefPanel.getPrefValueByPrefName("todayClosesDatePicker")) {
      gwDatePickerHelper.selectToday();
    } else {
      gwDatePickerHelper.adjustDatePickerToShowToday();
      gwDatePickerHelper.putFocusBackOnInput();
    }
  }

  current (): void {
    gwDatePickerHelper.adjustDatePickerToShowDayFromInputField();
    gwDatePickerHelper.putFocusBackOnInput();
  }

  selectDay (el: HTMLSelectElement | HTMLTableDataCellElement): void {
    gwDatePickerHelper.selectDay(+el.getAttribute("data-month")!, +el.getAttribute("data-year")!, +el.getAttribute("data-day")!);
  }

  selectMonth (el: HTMLSelectElement): void {
    if (!gwDatePickerHelper.currDateInfo) {
      return;
    }

    if (gwDatePickerHelper.currDateInfo.isJIC) {
      gwJic.eraMonthOrYearChangedPossiblyRestrictDates();
    }
    gwDatePickerHelper.selectMonthYear(el, "M");
    gwDatePickerHelper.putFocusBackOnInput();
  }

  selectYear (el: HTMLSelectElement): void {
    if (!gwDatePickerHelper.currDateInfo) {
      return;
    }

    if (gwDatePickerHelper.currDateInfo.isJIC) {
      gwJic.eraMonthOrYearChangedPossiblyRestrictDates();
    }

    gwDatePickerHelper.selectMonthYear(el, "Y");
    gwDatePickerHelper.putFocusBackOnInput();
  }
}

export const gwDatePicker = new GwDatePicker();
