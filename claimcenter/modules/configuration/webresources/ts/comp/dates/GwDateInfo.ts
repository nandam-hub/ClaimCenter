import {gwJic} from "./gwJic";
import {HTMLTextInputElement} from "../../types/gwTypes";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwDateInfo {
  readonly $input: JQuery;
  readonly inputEl: HTMLTextInputElement;
  readonly $inputParent: JQuery;
  readonly dateIconEl: HTMLDivElement;
  currentDay: number = 0;
  currentMonth: number = 0;
  currentYear: number = 0;
  selectedDay: number = 0;
  selectedMonth: number = 0;
  selectedYear: number = 0;
  drawMonth: number = 0;
  drawYear: number = 0;
  isJIC: boolean;
  eraYear: number = 1;
  lastVal: string | null = null;
  disableDaysAfter: number | null = null;
  disableDaysBefore: number | null = null;
  disableTestFoundDate1: number = 0;

  constructor (inputEl: HTMLTextInputElement) {
    this.$input = $(inputEl);
    this.inputEl = inputEl;
    this.$inputParent = $(inputEl).parent(); // associated target
    this.dateIconEl = document.getElementById(inputEl.name + "_dateIcon") as HTMLDivElement;
    this.isJIC = gwJic.isJIC(inputEl);
  }
}
