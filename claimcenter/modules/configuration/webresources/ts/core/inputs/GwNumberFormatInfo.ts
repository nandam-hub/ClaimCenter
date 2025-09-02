import {gwClientValidation, GwUserInputRestriction} from "./gwClientValidation";
import {gwLocale} from "../gwLocale";
import {GwValueWidgetElement} from "../../types/gwTypes";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwNumberFormatInfo {
  readonly code: string | null;
  readonly symb: string | null;
  readonly grouping: string;
  readonly radix: string;
  readonly maxDecimalDigits: number | null;

  constructor (code: string | null, symb: string | null, grouping: string, radix: string, maxDecimalDigits: number | null) {
    this.code = code; //Currency Code: ie USD
    this.symb = symb; //Currency Symbol: ie $
    this.grouping = grouping; //Grouping separator: ie ',' in 1,234
    this.radix = radix; //Radix separator: ie '.' in 123.45
    this.maxDecimalDigits = maxDecimalDigits; //Max allowed decimals: ie 2 = .00, 0 = no radix
  }

  static getNumberFormatInfo (el: HTMLInputElement, valueWidget: GwValueWidgetElement): GwNumberFormatInfo | null {
    const info = el.getAttribute("data-gw-currency-info");

    if (info) {
      const infoArr = info.split(";");
      return new GwNumberFormatInfo(infoArr[0], infoArr[1], infoArr[2], infoArr[3], +infoArr[4]);
    }

    const inputRestriction: GwUserInputRestriction = gwClientValidation.getRestrictionTypeFromValueWidget(valueWidget);

    if (gwClientValidation.userRestrictionTypeUsesGroupingFormatting(inputRestriction)) {
      return new GwNumberFormatInfo(null, null, gwLocale.getThousandsSymbol(), gwLocale.getDecimalSymbol(), inputRestriction === GwUserInputRestriction.integer ? 0 : 99);
    }

    return null;
  }
}
