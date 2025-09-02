import { GwMap, GwTypedMap } from "../types/gwTypes";
import { GwOrderDependentInitializableSystem } from "./util/GwOrderDependentInitializableSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwConfig extends GwOrderDependentInitializableSystem {
  getSystemName(): string {
    return "gwConfig";
  }

  private values: GwMap = { prefPanelDefaults: {}, timeout: 20 };

  orderSpecificInit(isFullPageReload: boolean): void {
    if (isFullPageReload) {
      this.values = $("body").data("gw-config");
    }
  }

  serverTimeoutMillis(): number {
    return this.serverTimeoutSeconds() * 1000;
  }

  serverTimeoutSeconds(): number {
    return this.values.timeout;
  }

  prefPanelDefaults(): GwTypedMap<string | boolean> {
    return this.values.prefPanelDefaults;
  }

  jicEraPrefixes(): string[] {
    return this.values.jicEraPrefixes;
  }

  _setPrefPanelDefaults(map: GwMap): void {
    this.values.prefPanelDefaults = map;
  }

  /** Only used for testing */
  _setServerTimeoutSeconds(seconds: number): void {
    this.values.timeout = seconds;
  }
}

export const gwConfig = new GwConfig();
