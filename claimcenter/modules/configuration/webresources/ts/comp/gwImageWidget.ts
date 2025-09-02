import {GwRegisteredSystem} from "../core/util/GwRegisteredSystem";
import {GwDomNode, GwMap} from "../types/gwTypes";
import {gwModalClientOverlay} from "./gwModalClientOverlay";
import {gwUtil} from "../core/util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwImageWidget extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwImageWidget";
  }

  clickThumb (el: GwDomNode, args: GwMap, e: Event): void {
    gwModalClientOverlay.openWithImage(el.getAttribute("data-gw-modal-url"));
  }

  onLoad (e: Event): void {
    gwUtil.removeClass(this.getContainerFromImg(e || event), "gw-loading");
  }

  onError (e: Event): void {
    gwUtil.addAndRemoveClasses(this.getContainerFromImg(e || event), "gw-error", "gw-loading");
  }

  private getContainerFromImg (e: Event): GwDomNode {
    const img = e.currentTarget;
    if (!img) {
      throw new Error("Unable to locate container from null image.");
    }

    const thumb = gwUtil.getSelfOrFirstParentWithClass(img as HTMLImageElement, "gw-image-wrapper");

    if (!thumb) {
      throw new Error("Unable to locate container from image element.");
    }

    return thumb;
  }

}

export const gwImageWidget = new GwImageWidget();
