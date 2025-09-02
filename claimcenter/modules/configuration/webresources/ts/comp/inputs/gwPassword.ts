import {GwRegisteredSystem} from "../../core/util/GwRegisteredSystem";
import {GwDomNode, GwMap} from "../../types/gwTypes";
import {gwSensitiveInputTools} from "./gwSensitiveInputTools";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwPassword extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwPassword";
  }

  readonly hiddenClass: string = "gw-hidden";

  clearValue (triggerNode: GwDomNode, args: GwMap): void {
    gwSensitiveInputTools.clearValue(
        triggerNode,
        ".gw-PasswordValueWidget--dropMenu",
        ".gw-PasswordValueWidget--valueField",
        args);
  }

}

export const gwPassword = new GwPassword();