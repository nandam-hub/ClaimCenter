import {GwInitializableSystem} from "../core/util/GwInitializableSystem";
import {gwUtil} from "../core/util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwLoginPage extends GwInitializableSystem {
  getSystemName (): string {
    return "gwLoginPage";
  }

  init (): void {
    const usernameInput = gwUtil.getDomNodeByAttr("name", "Login-LoginScreen-LoginDV-username");
    if (usernameInput) {
      usernameInput.setAttribute("autocapitalize", "none");
    }
  }
}

export const gwLoginPage = new GwLoginPage();
