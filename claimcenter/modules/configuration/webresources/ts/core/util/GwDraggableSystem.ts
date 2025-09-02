import {gw} from "../gw";
import {GwDomNode} from "../../types/gwTypes";
import {GwInitializableSystem} from "./GwInitializableSystem";
import {GwPoint} from "../GwPoint";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export abstract class GwDraggableSystem extends GwInitializableSystem {
  constructor () {
    super();
    if (this.availableToDraggable()) {
      gw.registerDraggableSystem(this);
    }
  }

  /**
   * Drag start is called when a drag is first detected, which will be after the pointer has
   * moved a bit from where the original pointer down happened. Because the global position
   * stored by gwMouse.position will already be updated to a new position, the initial position
   * where the drag actually started is explicitly passed as a parameter. The call to drag start
   * will be immediately be followed by a call to drag, which can update the UI according to
   * the current pointer position
   * @param {GwDomNode} el the draggable element
   * @param {GwPoint} initialPosition the pointer position when the pointer was initially pressed
   */
  abstract dragStart (el: GwDomNode, initialPosition: GwPoint): void;

  /**
   * Called when the pointer moves during dragging. gwMouse.position can be used to get the
   * current pointer position. Will be called when the drag is first detected, in the
   * same event callback as dragStart. After that will be called whenever the pointer moves.
   * If gwDraggable.enableDragHover() is called then drag may be called repeatedly in the
   * same position by a timer (this is to allow drag systems to take an action - such as
   * scrolling the screen - if the user presses and holds the pointer without moving it)
   * @param {GwDomNode} el the draggable element
   */
  abstract drag (el: GwDomNode): void;

  /**
   * Called when the drag ends because of a pointer up event
   * @param {GwDomNode} el the draggable element
   */
  abstract dragEnd (el: GwDomNode): void;

  /**
   * Called when the drag ends because it is canceled, for example if the user hits escape
   * @param {GwDomNode} el the draggable element
   */
  abstract dragCancel (el: GwDomNode): void;

  protected availableToDraggable (): boolean {
    return true;
  }
}
