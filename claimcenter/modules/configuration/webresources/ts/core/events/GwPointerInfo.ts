import {GwDomNode, GwPointerType} from "../../types/gwTypes";
import {gwEvents} from "./gwEvents";
import {gwPrefPanel} from "../gwPrefPanel";
import {GwPoint} from "../GwPoint";
import {gwMouse} from "../gwMouse";

/**
 * Used by gwEvents to store off information about pointer events.
 * Primarily for comparison between pointer down and pointer up, but also provides helper methods
 * for mousemove, and for things like determining if drag should start, or if a thumb or palm should be rejected.
 */
export class GwPointerInfo {
  readonly id: number;
  readonly position: GwPoint;
  readonly type: GwPointerType;
  readonly eventType: GwPointerInternalEventType;
  readonly height: number;
  readonly width: number;
  readonly timestamp: number;
  readonly originalTarget: GwDomNode | null;

  readonly meta: boolean;
  readonly shift: boolean;
  readonly ctrl: boolean;
  readonly alt: boolean;

  readonly button: number;

  readonly isTouch: boolean;
  readonly isPen: boolean;
  readonly isMouse: boolean;

  readonly isDown: boolean;
  readonly isMove: boolean;
  readonly isEnter: boolean;
  readonly isOut: boolean;
  readonly isUp: boolean;

  readonly isPossiblyPalm: boolean;

  readonly isValidForClick: boolean;
  readonly isValidForDblClick: boolean;
  readonly isValidForMouseDown: boolean;

  readonly clickableEl: GwDomNode | null;
  readonly draggableEl: GwDomNode | null;
  readonly dblClickableEl: GwDomNode | null;
  readonly longPressableEl: GwDomNode | null;

  readonly hasAnyDataGwEl: boolean;

  constructor (event: PointerEvent, pointerDownEventInfo: GwPointerInfo | null = null) {
    this.id = event.pointerId;
    this.position = gwMouse.position;
    this.type = event.pointerType as GwPointerType;
    this.height = event.height || 1;
    this.width = event.width || 1;
    this.timestamp = window.performance.now();
    this.eventType = (gwEvents.eventsMap[event.type] || event.type).replace("mouse", "");
    this.originalTarget = this.getTarget(event, pointerDownEventInfo);

    this.meta = event.metaKey;
    this.shift = event.shiftKey;
    this.ctrl = event.ctrlKey;
    this.alt = event.altKey;

    this.button = event.button;

    this.isTouch = this.type === "touch";
    this.isPen = this.type === "pen";
    this.isMouse = this.type === "mouse";

    this.isDown = this.eventType === "down";
    this.isMove = this.eventType === "move";
    this.isEnter = this.eventType === "enter";
    this.isOut = this.eventType === "out";
    this.isUp = this.eventType === "up";

    this.isPossiblyPalm = this.height >= palmSize || this.width >= palmSize;

    const {clickable, draggable, dblClickable, longPressable} = this.getRelevantAncestorDataGwEventEls(this.originalTarget);

    this.hasAnyDataGwEl = !!(clickable || draggable || dblClickable || longPressable);

    this.clickableEl = clickable;
    this.draggableEl = draggable;
    this.dblClickableEl = dblClickable;
    this.longPressableEl = longPressable;

    this.isValidForClick = this.button === 0 && !this.ctrl && !this.alt && !!this.clickableEl;
    this.isValidForDblClick = this.button === 0 && !this.ctrl && !this.meta && !this.alt && !this.shift && !this.ctrl && !!this.dblClickableEl;
    this.isValidForMouseDown = this.button === 0 && !this.ctrl && !this.alt && !!this.originalTarget;
  }

  /**
   * Get the target of the pointer event, but with special handling for the case where this is a pointer up
   * event and the overlay mask has obscured the original target of the corresponding pointer down event. In
   * that case, providing the original target is still present and under the pointer, we set the "original
   * target" to match the pointer down, so we'll fire an intenal click
   * @param event the current pointer event
   * @param pointerDownInfo the corresponding pointer down event, if this is a pointer up event
   */
  private getTarget (event: PointerEvent, pointerDownInfo: GwPointerInfo | null = null): GwDomNode | null {
    const target = event.target as GwDomNode | null;
    const targetIsOverlay = target !== null && target.id === "gw-click-overlay";
    if (targetIsOverlay && pointerDownInfo
        && pointerDownInfo.originalTarget && document.body.contains(pointerDownInfo.originalTarget)) {
      const rect = pointerDownInfo.originalTarget.getBoundingClientRect();
      if (rect.left <= event.clientX
          && rect.right >= event.clientX
          && rect.top <= event.clientY
          && rect.bottom >= event.clientY) {
        return pointerDownInfo.originalTarget;
      }
    }
    return target;
  }

  private getRelevantAncestorDataGwEventEls (start: GwDomNode | null): {clickable: GwDomNode | null, draggable: GwDomNode | null, dblClickable: GwDomNode | null, longPressable: GwDomNode | null} {
    let clickable: GwDomNode | null = null;
    let draggable: GwDomNode | null = null;
    let dblClickable: GwDomNode | null = null;
    let longPressable: GwDomNode | null = null;

    let el: GwDomNode | null = start;
    let safety = 100;
    while (el && safety--) {
      if (!el || !el.matches || (el.classList && el.classList.contains("gw-body"))) {
        break;
      }

      if (!clickable && (this.isDown || this.isUp) && el.matches(CLICK_MATCH)) {
        clickable = el;
      }

      if (!dblClickable && (this.isDown || this.isUp) && el.matches(DBL_MATCH)) {
        dblClickable = el;
      }

      if (!draggable && this.isDown && el.matches(DRAG_MATCH)) {
        draggable = el;
      }

      if (!longPressable && this.isDown && el.matches(LONG_MATCH)) {
        longPressable = el;
      }

      el = el.parentElement as GwDomNode;
    }

    return {clickable, draggable, dblClickable, longPressable};
  }

  timeSinceEventInMs (): number {
    return window.performance.now() - this.timestamp;
  }

  timeBetweenEvents (otherInfo: GwPointerInfo): number {
    return Math.abs(this.timestamp - otherInfo.timestamp);
  }

  hasSameClickableAs (otherInfo: GwPointerInfo | null): boolean {
    if (!otherInfo) {
      return false;
    }

    if (this.id !== otherInfo.id) {
      return false;
    }

    if (!this.isValidForClick || !otherInfo.isValidForClick) {
      return false;
    }

    if (!this.clickableEl || !otherInfo.clickableEl) {
      return false;
    }

    return this.clickableEl === otherInfo.clickableEl;
  }

  hasSameDblClickableAs (otherInfo: GwPointerInfo | null): otherInfo is GwPointerInfo {
    if (!otherInfo) {
      return false;
    }

    if (this.id !== otherInfo.id) {
      return false;
    }

    if (!this.isValidForDblClick || !otherInfo.isValidForDblClick) {
      return false;
    }

    if (!this.dblClickableEl || !otherInfo.dblClickableEl) {
      return false;
    }

    return this.dblClickableEl === otherInfo.dblClickableEl;
  }

  /**
   * Runs logic to determine if this instance of GwPointerInfo should replace a currently stored instance.
   * It's primary purpose is to determine if we can ignore what was an errant touch, or a palm touch
   * in a multi-touch environment. Like if the user is holding a tablet by the bottom left corner
   * We would start tracking that thumb touch, and then, without this logic, we would ignore every other touch
   * or pen touch that didn't match that touch's id.
   *
   * When this method runs, it attempts to do things like assume if a pen touch follows a finger touch, then we should
   * ignore the earlier finger touch.
   *
   * Or if the earlier touch was "large" in footprint, and a following touch was much smaller, then we'll assume
   * the earlier touch was the user placing their "palm" on a large tablet device. And we'll let a new touch, or a new
   * pen touch replace it.
   *
   * The more opinionated, latter half of the method's logic, can be disabled via the smartTouchRejection panel pref.
   *
   * @param {GwPointerInfo} existingInfo
   * @returns {boolean}
   */
  shouldBecomeNewMouseDownOverExistingMouseDown (existingInfo: GwPointerInfo): boolean {
    if (!this.isDown) {
      return false;
    }

    if (!this.isValidForClick) {
      return false;
    }

    if (!existingInfo.isValidForClick) {
      return true;
    }

    if (existingInfo.eventType !== this.eventType) {
      return false;
    }

    if (existingInfo.isTouch && !this.isTouch) {
      return true;
    }

    if (!existingInfo.isTouch && this.isTouch) {
      return false;
    }

    if (!gwPrefPanel.getPrefValueByPrefName("smartTouchRejection")) {
      return false;
    }

    if (this.isPossiblyPalm && existingInfo.isPossiblyPalm) {
      return true;
    }

    if (this.isPossiblyPalm) {
      return false;
    }

    if (existingInfo.isPossiblyPalm) {
      return true;
    }

    if (existingInfo.isTouch) {
      return true;
    }

    return false;
  }
}

const NOT_DISABLED_SUFFIX: string = ":not([aria-disabled=true]):not(:disabled)";
const CLICK_MATCH: string = "[data-gw-click]" + NOT_DISABLED_SUFFIX;
const DRAG_MATCH: string = "[data-gw-draggable]" + NOT_DISABLED_SUFFIX;
const DBL_MATCH: string = "[data-gw-dblclick]" + NOT_DISABLED_SUFFIX;
const LONG_MATCH: string = "[data-gw-longpress]" + NOT_DISABLED_SUFFIX;

export type GwPointerInternalEventType = "down" | "move" | "enter" | "out" | "up";

const palmSize: number = 120;
