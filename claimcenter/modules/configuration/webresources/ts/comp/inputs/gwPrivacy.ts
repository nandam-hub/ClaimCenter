import {GwRegisteredSystem} from "../../core/util/GwRegisteredSystem";
import {GwDomNode, GwMap} from "../../types/gwTypes";
import {gwSensitiveInputTools} from "./gwSensitiveInputTools";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwPrivacy extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwPrivacy";
  }

  clearValue (triggerNode: GwDomNode, args: GwMap): void {
    gwSensitiveInputTools.clearValue(
        triggerNode,
        ".gw-PrivacyValueWidget--dropMenu",
        ".gw-PrivacyValueWidget--valueField",
        args);
  }

  setValueProgrammatically (widgetNode: GwDomNode, value: string): boolean {
    return gwSensitiveInputTools.setValueProgammatically(
        widgetNode,
        ".gw-PrivacyValueWidget--dropMenu",
        ".gw-PrivacyValueWidget--valueField",
        value);
  }
}

export const gwPrivacy = new GwPrivacy();