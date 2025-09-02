import {GwInitializableSystem} from "./util/GwInitializableSystem";
import {GwPartialReloadDetails} from "../types/gwTypes";
import {gwResizer} from "./gwResizer";
import {gwUtil} from "./util/gwUtil";

export class GwMobile extends GwInitializableSystem {
  getSystemName (): string {
    return "gwMobile";
  }

  init (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    if (isFullPageReload) {
      window.addEventListener("orientationchange", this.onGlobalOrientationChange.bind(this));
      window.addEventListener("wheel", this.onGlobalWheel.bind(this));
    }
  }

  /**
   * Pinch/Pull zoom fires ctrl + wheel
   *
   * We use gwResizer "check" to prevent getting spammed with updates as the user pinches and pulls
   * @param {WheelEvent} e
   */
  private onGlobalWheel (e: WheelEvent): void {
    if (e.ctrlKey) {
        gwUtil.devlog("#### Device Zoom Changed by: " + e.deltaY);
        gwResizer.check();
    }
  }

  /**
   * When the user rotates the screen, we need to rebuild the panels
   * We use recalcPanelSizing directly, so the effect is immediate, as it's a one off event.
   * @param {DeviceOrientationEvent} event
   */
  private onGlobalOrientationChange (event: Event): void {
    gwUtil.devlog("#### Device Orientation Change to: " + window.orientation);
    gwResizer.recalcPanelSizing(true);
  }
}

export const gwMobile = new GwMobile();
