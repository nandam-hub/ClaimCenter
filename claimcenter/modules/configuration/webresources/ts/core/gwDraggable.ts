import {GwDomNode} from "../types/gwTypes";
import {gwUtil} from "./util/gwUtil";
import {gwEvents} from "./events/gwEvents";
import {gw} from "./gw";
import {GwRegisteredSystem} from "./util/GwRegisteredSystem";
import {GwPoint} from "./GwPoint";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * @public
 * Handles all events triggered by the global events mapped to dragstart, drag, and dragend.
 * To register a system for drag, the element just needs a data-gw-draggable="SystemName" attribute.
 * When the various drag events are triggered, then corresponding methods will be called on the system:
 * ie:
 * gw[SystemName].dragstart
 * gw[SystemName].drag
 * gw[SystemName].dragend
 * (Optional)gw[SystemName].dragcancel (if not present, and a cancel condition fires, then dragend will be fired)
 *
 * e.g. if you had data-gw-draggable="SouthPanel" then a drag operation would call:
 * gw.SouthPanel.dragStart(el, args, e)
 * gw.SouthPanel.drag(el, args, e) - maybe multiple times
 * gw.SouthPanel.dragEnd(el, args, e)
 * gw.SouthPanel.dragCancel(el, args, e) - is Optional, and dragEnd will fire if no drag cancel is found
 * @type {{}}
 */
export class GwDraggable extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwDraggable";
  }

  private readonly DRAG_ATTR: string = "data-gw-draggable";

  private beingDragged: GwDomNode | null = null;
  private dragHoverInterval: number = -1;
  private currentDraggingSystemName: string | null = null;
  private dragHoverEnabled: boolean = false;

  getBeingDragged (): GwDomNode | null {
    return this.beingDragged;
  }

  isDragging (): boolean {
    return !!this.beingDragged;
  }

  /**
   * An individual system needs to call this, most likely inside of dragStart,
   * in order to receive calls to the drag method every frame, even if the mouse isn't moving.
   * This is so systems can do things like "scroll the screen" while the user hovers the mouse near the edge.
   */
  enableDragHover (): void {
    this.dragHoverEnabled = true;
  }

  /**
   * calls gw[el.getAttributeName("data-gw-draggable")].dragStart(el, initialPosition);
   */
  start (el: GwDomNode, initialPosition: GwPoint): void {
    if (this.isDragging()) {
      return;
    }

    if (!el.hasAttribute(this.DRAG_ATTR)) {
      return;
    }

    gwEvents.closeAllTemporaryUIElements();

    this.beingDragged = el;
    gwUtil.addClass(this.beingDragged, "gw-beingDragged");

    this.currentDraggingSystemName = el.getAttribute(this.DRAG_ATTR)!.split(" ")[0];
    if (!gw.draggable[this.currentDraggingSystemName]) {
      throw new Error("No system exists on the gw draggable object named: " + this.currentDraggingSystemName);
    }

    gw.draggable[this.currentDraggingSystemName].dragStart(el, initialPosition);
    // We've moved from the initial position so do an immediate drag to take account of that
    this.drag();

    if (this.dragHoverEnabled) {
      this.dragHoverInterval = window.setInterval(() => {
        if (!this.dragHoverEnabled || !gwEvents.areEventsEnabled()) {
          window.clearInterval(this.dragHoverInterval);
          this.dragHoverInterval = -1;
          return;
        }

        gw.draggable[this.currentDraggingSystemName!].drag(this.beingDragged!);
      }, 33);
    }
  }

  /**
   * calls gw[el.getAttributeName("data-gw-draggable")].drag(getBeingDragged(), args, e);
   * @param e a mouse move event
   */
  drag (): void {
    if (!this.beingDragged) {
      return;
    }

    gw.draggable[this.currentDraggingSystemName!].drag(this.beingDragged);
  }

  /**
   * calls gw[el.getAttributeName("data-gw-draggable")].dragend(getBeingDragged(), args, e);
   * @param el
   * @param args
   * @param e
   */
  end (): void {
    this.abstractDragEndedOrCanceled(false);
  }

  /**
   * calls gw[el.getAttributeName("data-gw-draggable")].dragcancel(getBeingDragged(), args, e);
   * @param el
   * @param args
   * @param e
   */
  cancel (): void {
    this.abstractDragEndedOrCanceled(true);
  }

  private abstractDragEndedOrCanceled (isCancel: boolean = false): void {
    if (!this.beingDragged) {
      return;
    }

    window.clearInterval(this.dragHoverInterval);
    this.dragHoverInterval = -1;
    this.dragHoverEnabled = false;

    gwUtil.removeClass(this.beingDragged, "gw-beingDragged");
    const systemName = this.currentDraggingSystemName || this.beingDragged.getAttribute(this.DRAG_ATTR) || "undefined";

    if (!gw.draggable[systemName]) {
      throw new Error("unable to locate draggable system " + systemName);
    }

    if (isCancel) {
      gw.draggable[systemName].dragCancel(this.beingDragged);
    } else {
      gw.draggable[systemName].dragEnd(this.beingDragged);
    }

    this.beingDragged = null;
    this.currentDraggingSystemName = null;
  }

  forceCancel (): void {
    this.abstractDragEndedOrCanceled(true);
  }
}

export const gwDraggable = new GwDraggable();
