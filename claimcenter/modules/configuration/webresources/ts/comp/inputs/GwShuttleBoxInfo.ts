import {GwDomNode} from "../../types/gwTypes";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwShuttleBoxInfo {
  readonly left: HTMLSelectElement;
  readonly right: HTMLSelectElement;
  readonly hidden: HTMLSelectElement;
  readonly parent: GwDomNode;

  constructor (parentWidgetForRangeShuttle: GwDomNode) {
    const shuttleSelects = parentWidgetForRangeShuttle.getElementsByTagName("select");

    this.left = shuttleSelects[1];
    this.right = shuttleSelects[2];
    this.hidden = shuttleSelects[0];
    this.parent = parentWidgetForRangeShuttle;
  }
}