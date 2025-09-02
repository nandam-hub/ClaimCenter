import {GwMap} from "../../types/gwTypes";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwEraDetail {
  readonly name: string;
  readonly index: number;
  readonly delta: number;
  readonly start: Date;
  readonly startYear: number;
  readonly startMonth: number;
  readonly startDay: number;
  readonly total: number;

  constructor (era: GwMap, index: number) {
    this.name = era.name;
    this.index = index;
    this.delta = era.startYear - 1;
    this.start = new Date(era.startYear, era.startMonth, era.startDay);
    this.startYear = era.startYear;
    this.startMonth = era.startMonth;
    this.startDay = era.startDay;
    this.total = era.max;
  }
}