import {GwDomNode, GwMap} from "../types/gwTypes";
import {gwMenus} from "./gwMenus";
import {gwTooltips} from "./gwTooltips";
import {GwRegisteredSystem} from "./util/GwRegisteredSystem";
import {GwPoint} from "./GwPoint";
import {gwUtil} from "./util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwMouse extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwMouse";
  }

  private _position: GwPoint = GwPoint.ZERO;

  updatePosition (e: PointerEvent): void {
    if (gwUtil.hasValue(e.pageX)) {
      this._position = new GwPoint(e.pageX, e.pageY);
    } else {
      if (!e.target) {
        return;
      }

      const rect = (e.target as GwDomNode).getBoundingClientRect();
      const root = document.documentElement;

      const x = e.clientX - rect.left - root.scrollLeft;
      const y = e.clientY - rect.top - root.scrollTop;
      this._position = new GwPoint(x, y);
    }
  }

  get position (): GwPoint {
    return this._position;
  }

  /**
   * The method called by events.js for all systems that need to share the mouseenter event listener.
   * Any system needling to listen to mouseenter needs to add a complex transform in event.js, then register itself here.
   * @param node
   * @param args
   * @param e
   */
  enter (node: GwDomNode, args: GwMap, e: PointerEvent): void {
    if (!gwMenus.openSubMenuMouseEnter(node)) {
      gwTooltips.show(node, args, e);
    }
  }
}

export const gwMouse = new GwMouse();
