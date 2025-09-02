import {GwRegisteredSystem} from "../core/util/GwRegisteredSystem";
import {gwUtil} from "../core/util/gwUtil";
import {gwFocus} from "../core/gwFocus";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwModalClientOverlay extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwModalClientOverlay";
  }

  close (): void {
    gwUtil.removeNodeIfExists("#gw-ModalClientOverlay");
  }

  closeButtonClicked (): void {
    this.close();
    gwFocus.restoreLastFocusNodeIfAvailable(true);
  }

  openWithImage (url: string | null): void {
    if (url === null) {
      url = "";
    }
    const wrapper = gwUtil.createDiv(
        "gw-loading",
        {id: "gw-ModalClientOverlay-img-wrapper"}
    );

    const image = gwUtil.createEl("img", ["gw-modal-image"], {src: url});
    image.onload = () => {
      wrapper.classList.remove("gw-loading");
    };

    wrapper.appendChild(image);

    this.build(wrapper);
  }

  openWithElementContainer (el: HTMLElement): void {
    this.build(el);
  }

  private build (el: HTMLElement): void {
    this.close();
    const closeButton = gwUtil.createDiv(null,
        {
          id: "gw-ModalClientOverlay--close",
          "data-gw-refuse-focus": true,
          "data-gw-click": "gwModalClientOverlay.closeButtonClicked"
        });

    const modal = gwUtil.createDiv(null,
        {
          id: "gw-ModalClientOverlay",
          "data-gw-refuse-focus": true,
          "data-gw-click": "noOp"
        }, undefined, undefined, [el, closeButton]);

    document.getElementById("gw-body")!.appendChild(modal);
  }

}

export const gwModalClientOverlay = new GwModalClientOverlay();
