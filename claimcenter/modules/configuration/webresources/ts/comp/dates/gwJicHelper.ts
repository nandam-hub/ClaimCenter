import {GW_BREAKER, GwDomNode, GwTypedMap} from "../../types/gwTypes";
import {gwDatePickerHelper} from "./gwDatePickerHelper";
import {gwUtil} from "../../core/util/gwUtil";
import {GwDateInfo} from "./GwDateInfo";
import {GwEraDetail} from "./GwEraDetail";
import {gwInputs} from "../../core/inputs/gwInputs";
import {gwConfig} from "../../core/gwConfig";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwJicHelper {
  eraYearLocalizedSuffix: string = " Year"; //Updated if available in mapEraDataFromServer
  eraMonthLocalizedSuffix: string = "";
  highestEraIndex: number = 0; // in mapEraDataFromServer
  readonly eraIndexOrNameToDetails: GwTypedMap<GwEraDetail> = {}; // in mapEraDataFromServer
  readonly eraQuickToDetails: GwTypedMap<GwEraDetail> = {}; // in mapEraDataFromServer

  mapEraDataFromServer (): void {
    const eraArray = gwUtil.getUtilityJson("gw-eraInfo");
    if (!eraArray || eraArray.length === 0) {
      return;
    }

    for (let i = 0; i < eraArray.length; i++) {
      const eraDetail = new GwEraDetail(eraArray[i], i);
      this.eraIndexOrNameToDetails[i] = eraDetail;
      this.eraIndexOrNameToDetails[eraDetail.name] = eraDetail;
    }
    this.highestEraIndex = eraArray.length - 1;

    const yearSymbol = eraArray[this.highestEraIndex].yearSymbol;

    if (yearSymbol) {
      this.eraYearLocalizedSuffix = yearSymbol;
    }

    const monthSymbol = eraArray[this.highestEraIndex].monthSymbol;
    if (monthSymbol) {
      this.eraMonthLocalizedSuffix = monthSymbol;
    }

    const eraPrefixes = gwConfig.jicEraPrefixes();
    for (let i = 0; i < eraPrefixes.length; i++) {
      const details = this.eraIndexOrNameToDetails[i];
      if (details) {
        this.eraQuickToDetails[eraPrefixes[i]] = details;
      }
    }
  }

  getCurrDateInfo (): GwDateInfo {
    return (gwDatePickerHelper.currDateInfo || {}) as GwDateInfo;
  }

  getDateWidget (el: GwDomNode | null): GwDomNode {
    const dw = gwUtil.getSelfOrFirstParentWithClass(el || this.getDateInput(), "gw-DateValueWidget");
    if (!dw) {
      throw new Error("Unable to locate a date widget connected to the Imperial Calendar.");
    }

    return dw;
  }

  getEraInput (el: GwDomNode | null): HTMLInputElement | null {
    return this.getDateWidget(el).querySelector(".gw-DateValueWidget--era");
  }

  getTotalYearsForCurrentEraSelect (el: GwDomNode): number {
    const eraSelect = this.getEraSelect(el);
    if (!eraSelect) {
      return 0;
    }
    const eraDetails = this.getEraDetailsForValueOrIndex(eraSelect.value);
    if (eraDetails) {
      return eraDetails.total;
    }

    return 0;
  }

  getMonthSelect (el: GwDomNode | null): HTMLSelectElement {
    return this.getDateWidget(el).querySelector("#gw-datePicker--month--select") as HTMLSelectElement;
  }

  getEraYearSelect (el: GwDomNode | null): HTMLSelectElement {
    return this.getDateWidget(el).querySelector("#gw-datePicker--eraYear--select") as HTMLSelectElement;
  }

  getEraSelect (el: GwDomNode | null): HTMLSelectElement {
    return this.getDateWidget(el).querySelector("#gw-datePicker--era--select") as HTMLSelectElement;
  }

  getDateInput (): HTMLInputElement {
    return this.getCurrDateInfo().inputEl;
  }

  getEraValueForToday (): string {
    return this.eraIndexOrNameToDetails[this.highestEraIndex].name;
  }

  setEraYearSelect (eraYear: number): void {
    this.getCurrDateInfo().eraYear = eraYear;
    const eraYearSelect = this.getEraYearSelect(null);
    if (eraYearSelect) {
      gwInputs.setValueOnSelect(eraYearSelect, eraYear + "");
    }
  }

  setEraSelect (eraValOrIndex: any, dateInput: HTMLInputElement | null = null): void {
    const eraDetail = this.getEraDetailsForValueOrIndex(eraValOrIndex);

    if (eraDetail) {
      const eraSelect = this.getEraSelect(dateInput);
      if (eraSelect) {
        gwInputs.setValueOnSelect(eraSelect, eraDetail.name);
      }
    }
  }

  setEraInputValue (eraValOrIndex: string | number | undefined, dateInput: HTMLInputElement | null = null): void {
    const eraDetail = this.getEraDetailsForValueOrIndex(eraValOrIndex);

    if (eraDetail) {
      const eraInput = this.getEraInput(dateInput);
      if (eraInput) {
        eraInput.value = eraDetail.name;
      }
    }
  }

  getEraInputValue (el: GwDomNode | null): string | null {
    const eraInput = this.getEraInput(el);
    if (!eraInput) {
      return null;
    }
    return eraInput.value;
  }

  getEraDetailsForValueOrIndexOrThrow (eraValOrIndex: string | number | undefined): GwEraDetail {
    const eraDetail = this.getEraDetailsForValueOrIndex(eraValOrIndex);
    if (!eraDetail) {
      throw new Error("unable to locate era detail information for: " + eraValOrIndex);
    }

    return eraDetail;
  }

  getEraDetailsForValueOrIndex (eraValOrIndex: string | number | undefined): GwEraDetail | null {
    if (eraValOrIndex === undefined) {
      return this.eraIndexOrNameToDetails[this.getEraValueForToday()];
    }

    let eraDetail = this.eraIndexOrNameToDetails[eraValOrIndex];
    if (eraDetail) {
      return eraDetail;
    }

    if (typeof eraValOrIndex === "string") {
      eraDetail = this.eraQuickToDetails[eraValOrIndex[0].toUpperCase()];
      if (eraDetail) {
        return eraDetail;
      }

      gwUtil.forEach(this.eraIndexOrNameToDetails, (detail) => {
        if (eraValOrIndex.localeCompare(detail.name, undefined, {sensitivity: "base"}) === 0) {
          eraDetail = detail;
          return GW_BREAKER;
        }
        return;
      });
    }

    return eraDetail || null;
  }

  eraYearToGregYear (eraYear: number, useEraSelectForValue: boolean = false): number {
    let eraVal;
    if (useEraSelectForValue) {
      eraVal = this.getEraSelectValue();
    } else {
      eraVal = this.getEraInputValue(null) || this.getEraValueForToday();
    }

    const eraDetail = this.getEraDetailsForValueOrIndexOrThrow(eraVal);
    eraYear = +eraYear || +this.gregYearToEraYear(new Date()).year; //Get today's date as an era year, if eraYear is null
    return eraYear + eraDetail.delta;
  }

  gregYearToEraYear (gregDateObj: Date, forceUpdate: boolean = false): {year: string, era: string} {
    let jicYear = 1;
    let era = "";

    for (let i = this.highestEraIndex; i >= 0; i--) {
      const detail = this.eraIndexOrNameToDetails[i];
      if (gregDateObj >= detail.start) {
        jicYear = gregDateObj.getFullYear() - detail.delta;
        era = detail.name;
        if (forceUpdate) {
          //setEraInputValue(i);
          this.setEraYearSelect(jicYear);
          this.setEraSelect(i);
        }
        break;
      }
    }
    let year = "" + jicYear;
    if (year.length < 2) {
      year = "0" + year;
    }
    return {year, era};
  }

  getEraSelectValue (): string | undefined {
    let eraSelect: HTMLSelectElement | HTMLInputElement = this.getEraSelect(null);
    if (!eraSelect) {
      eraSelect = this.getEraInput(null)!;
    }

    let eraName: string | undefined;
    if (eraSelect) {
      eraName = eraSelect.value;
    }
    const finalEraName = eraName || this.getEraValueForToday();

    return finalEraName;
  }

  resetEraInputValue (dateInput: HTMLInputElement): void {
    const eraInput = this.getEraInput(dateInput);
    if (eraInput) {
      eraInput.value = "";
    }
  }

}

export const gwJicHelper = new GwJicHelper();
