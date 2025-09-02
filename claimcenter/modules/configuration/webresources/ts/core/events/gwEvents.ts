/**
 * How to construct an element on the server that responds to events:
 * 1. add data-gw-eventname="methodname", ie: '<div data-gw-click="fireEvent">'
 *   -
 *   - You can also pass a dot delimited string to use a method not on this.methods: ie:
 *     - data-gw-eventname="SouthPanel.UIMethods.toggleMinMax"
 * 2. Any additional arguments should be supplied after the method name and a space.
 *   - ie: <div data-gw-click="fireEvent add:class1 class2 class3 target:.class4">.
 *   - if you use an `argName: blah` format, then the client will build a map of argName to argString.
 *   - for the common methods, these are already defined. So addClass expects add: blah, etc.
 *     - for custom methods, it will call your method as myMethod(node, argumentMap, event);
 *   - If you want to pass custom info to a custom method and not use name: blah, just don't use any colons, and the client will execute
 *     your method as myMethod(node, entireArgString, event);
 *
 * Key event handling makes use of "key listener" objects. A key listener contains the description of
 * a key (a keyCode plus boolean modifiers, like alt, shift, ctrl), an optional enableDefault flag and
 * an action to execute. The action is either a simple method name, stored in a field called "methodName",
 * or a "createEventDescription" function that can be called to get a complete event description.
 */
import { gwDateValue } from "../../comp/dates/gwDateValue";
import { gwModalClientOverlay } from "../../comp/gwModalClientOverlay";
import { gwListView } from "../../comp/tables/gwListView";
import { gwApp } from "../../plApp";
import { GwMessageEvent } from "../../types/gwCrossOriginTypes";
import {
  GwAction,
  GwContextNode,
  GwDomNode,
  GwEventType,
  GwInputElement,
  GwMap,
  GwPanel,
  GwPartialReloadDetails,
  GwShortcutOwner,
  GwTypedMap,
  GwValueWidgetElement,
  HTMLTextInputElement,
} from "../../types/gwTypes";
import { gwAria } from "../aria/GwAria";
import { gw } from "../gw";
import { gwConfirm } from "../gwConfirm";
import { gwCrossOriginInternal } from "../GwCrossOriginInternal";
import { gwDisplayKey } from "../gwDisplayKey";
import { gwDraggable } from "../gwDraggable";
import { gwFocus } from "../gwFocus";
import { gwForm } from "../gwForm";
import { gwHelpText } from "../gwHelpText";
import { gwMenus } from "../gwMenus";
import { gwMouse } from "../gwMouse";
import { gwPrefPanel } from "../gwPrefPanel";
import { gwResizer } from "../gwResizer";
import { gwScroll } from "../gwScroll";
import { gwShortcuts } from "../gwShortcuts";
import { gwTooltips } from "../gwTooltips";
import { gwAutocomplete } from "../inputs/gwAutocomplete";
import { GwCharReplacer } from "../inputs/GwCharReplacer";
import { gwInputs } from "../inputs/gwInputs";
import { gwInputSystems } from "../inputs/gwInputSystems";
import { gwReflection } from "../reflection/gwReflection";
import { GwFunctionWithContext } from "../util/GwFunctionWithContext";
import { GwOrderDependentInitializableSystem } from "../util/GwOrderDependentInitializableSystem";
import { gwUtil } from "../util/gwUtil";
import { GwEventDescription } from "./GwEventDescription";
import { GwForcedEvent } from "./GwForcedEvent";
import { gwKeys } from "./gwKeys";
import { GwPointerInfo } from "./GwPointerInfo";
import {gwMultiTab} from "../gwMultiTab";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwEvents extends GwOrderDependentInitializableSystem {
  get BREAK_AUTOCOMPLETE_VALUE(): string {
    if (gwPrefPanel.getPrefValueByPrefName("useIllegalAutocompleteValueForInputs")) {
      return "off_" + Date.now();
    }

    return "off";
  }
  /**
   * Each time an event fires on a form input node, we walk up the DOM tree looking for someone who "owns the event".
   * Like, data-gw-focus, etc. But for input events and key events, just to be safe, we don't want to walk up the entire tree
   * everytime someone types a character or rapidly tabs through the page. So we limit it here to a reasonable number.
   * This number could probably be more like 5, but 20 is safe. We only break it out here, in case for some reason,
   * we find a very complicated widget we didn't think about, or if we refactor widgets in the future to be far more
   * deeply nested.
   *
   * @type {number}
   */
  readonly LIMITED_PARENT_SEARCH_STEPS_FOR_RAPID_FIRE_EVENTS: number = 20;

  private eventLockCount: number = 1; // Start out locked; the app reload code will explicitly enable events when it is ready
  /**
   * This value is set true by methods that store the deferred change event, and then set false by the methods that resolve it.
   * While this value is true, the onGlobalInput method prevents keyboard input, as there's no reason to allow a user
   * to modify the form, when the form may come back with changes and clobber their local changes
   * @private
   */
  private currentlyInChangeHandlingCycle: boolean = false;

  /**
   * private member used by getter pasteCausedCurrentInputEvent
   * @type {boolean}
   * @private
   */
  private _pasteCausedCurrentInputEvent: boolean = false;

  /**
   * Is set to true on a paste event, and set to false at the end of onGlobalInputEvent
   * @returns {boolean}
   */
  get pasteCausedCurrentInputEvent(): boolean {
    return this._pasteCausedCurrentInputEvent;
  }

  /**
   * private member used by getter pasteEventRawClipboardText
   * @type {null}
   * @private
   */
  private _pasteEventRawClipboardText: string | null = null;

  /**
   * Set to the text based contents of the clipboard on a paste event, and set to null at the end of onGlobalInputEvent
   * @returns {string | null}
   */
  get pasteEventRawClipboardText(): string | null {
    return this._pasteEventRawClipboardText;
  }

  private get mouseDown(): boolean {
    return !!this.pointerDownInfo;
  }

  private queuedInternalClick: { clickableElement: GwDomNode; e: PointerEvent } | null = null;

  /**
   * @public constant
   * @type {string}
   */
  readonly dataPrefix: string = "data-gw-"; // If you change this, you are going to have to change it everywhere on the server
  readonly queuedClickAttr: string = "data-gw-queued-click-target";
  /**
   * @private
   * Contains the custom transformations used to add complex additional attributes for particular data-gw-* attributes.
   * These transforms are processed after the base transforms, to ensure there's no extra attributes added by chaining.
   * ie: if a node has gw-data-hover-submenu on it, then it will end up with 4 additional attributes handling mouseenter and mouseleave.
   */
  readonly complexAttributeTransforms: GwMap = {
    "data-gw-menu-hover": {
      "data-gw-mouseenter": "gwMouse.enter",
    },
    "data-gw-helptext": {},
    "data-gw-autocomplete": {
      "data-gw-input": "gwInputSystems.inputEventNotifySystems",
      "data-gw-focus": "gwAutocomplete.autocompleteOnFocus",
      "data-gw-key": "gwAutocomplete.downOrEnterKeyPressed key:13|40",
    },
    "data-gw-input-mask": {
      "data-gw-input": "gwInputSystems.inputEventNotifySystems",
      "data-gw-copy": "gwInputSystems.copyEventNotifySystems",
    },
    "data-gw-datetime": {
      "data-gw-input": "gwInputSystems.inputEventNotifySystems",
      "data-gw-copy": "gwInputSystems.copyEventNotifySystems",
    },
    "data-gw-restricted-input": {
      "data-gw-input": "gwInputSystems.inputEventNotifySystems",
    },
    "data-gw-email": {
      "data-gw-input": "gwInputSystems.inputEventNotifySystems",
    },
    "data-gw-currency": {
      "data-gw-input": "gwInputSystems.inputEventNotifySystems",
      "data-gw-copy": "gwInputSystems.copyEventNotifySystems",
      "data-gw-paste": "gwInputSystems.pasteEventNotifySystems",
    },
    "data-gw-tooltip": {
      "data-gw-mouseenter": "gwMouse.enter",
      "data-gw-mousemove": "gwTooltips.move",
      "data-gw-mouseout": "gwTooltips.hide",
      "data-gw-mouseover-enabled": "true",
      "data-gw-mouseout-enabled": "true",
      "data-gw-mousemove-enabled": "true",
      "data-gw-mouseenter-enabled": "true",
    },
  };

  /**
   * @private
   * The default suffix for any fireEvent action. This can be overridden inline for the default events methods by passing a suffix
   * argument, ie "fireEvent suffix:_other" or fireEvent suffix:null to not use a suffix. Mainly used for dev actions like PCF_RELOAD
   * @type {string}
   */
  readonly actionSuffix: string = "_act";
  /**
   * @private
   * Use the disableEvents and enableEvents functions
   */
  private eventsEnabled: boolean = false;
  /**
   * @private
   * Used to convert the actual DOM event name from key to value, when we process static
   * This is primarily so that we never need to change how events are declared on the server, regardless of how we
   * decide to listen for events on the client. ie, we changed from onkeypress to onkeydown, but the server just sets
   * data-gw-key.
   *
   */
  readonly eventsMap: GwMap = {
    keydown: "key",
    focusout: "blur",
    focusin: "focus",
    pointerover: "mouseenter",
    pointerenter: "mouseenter",
    pointerdown: "mousedown",
    pointermove: "mousemove",
    pointerleave: "mouseout",
    pointerout: "mouseout",
    pointercancel: "mouseup", // Note: we use mouse events to map to UI Element drag, as the drag events are too opinionated
    pointerup: "mouseup",

    mouseover: "mouseenter",
    mouseenter: "mouseenter",
    mousedown: "mousedown",
    mousemove: "mousemove",
    mouseleave: "mouseout",
    mouseout: "mouseout",
    mousecancel: "mouseup", // Note: we use mouse events to map to UI Element drag, as the drag events are too opinionated
    mouseup: "mouseup",
  };

  /**
   * Events types listed here, by our "internal event names" meaning, "key" not "onkeydown".
   * Will fire event.preventDefault if the events system finds a target that can handle the event.
   * Unless the eventDescription it finds specifically sets enableDefault: true.
   * @type {{key: boolean, copy: boolean, dragover: boolean, drop: boolean}}
   */
  private readonly disableDefaultBehaviorIfHandled: GwMap = {
    key: true,
    dragover: true,
    drop: true,
    copy: true,
    focusin: true,
    focusout: true,
  };

  private lastActiveKeydownKey: number | null = null;
  // =====================================
  // == PUBLIC VARS
  // =====================================

  DOUBLE_CLICK_MAX_DELAY_MS: number = 500;
  CLICK_MAX_TIME_BETWEEN_UP_AND_DOWN_MS: number = 1500;
  DRAG_DISTANCE_TO_START_IN_PX: number = 7;
  MOVE_DISTANCE_TO_CANCEL_LONG_PRESS_IN_PX: number = 6;
  LONG_PRESS_TIME_MS: number = 1000;

  //======================
  //== NON EVENT METHODS
  //======================

  getSystemName(): string {
    return "gwEvents";
  }

  forceGlobalChangeEvent(targetEl: GwDomNode, optRelatedTargetEl?: GwDomNode): void {
    gwUtil.eventLog("Forcing global change event on target:", targetEl);

    if (!targetEl.hasAttribute("name")) {
      throw new Error("Attempting to force a global change event by passing an element without a name.");
    }

    this.onGlobalChangeEvent.call(this, new GwForcedEvent(targetEl, "change", optRelatedTargetEl) as any as Event);
  }

  forceGlobalClickEvent(targetEl: GwDomNode): void {
    gwUtil.eventLog("Forcing global click event on target:", targetEl);
    this.handleDeferredChangeEvent(targetEl);
    this.internalClick.call(this, targetEl, new GwForcedEvent(targetEl, "click") as any as PointerEvent);
    this.doAfterAnyClick(targetEl);
  }

  forceProcessDeferredChangeEvent(targetEl: GwDomNode): void {
      this.handleDeferredChangeEventTimer = window.setTimeout(this.handleDeferredChangeEvent.bind(this, targetEl, true), 0);
  }

  /**
   * @private
   * Called on a dom node and an attribute object, to transform any matching data-gw-'event' attributes
   */
  private addAdditionalAttributeTransforms(el: GwDomNode, attributes: GwMap): void {
    let obj: GwMap;

    for (const attribute in attributes) {
      if (el.hasAttribute(attribute)) {
        obj = attributes[attribute];
        Object.keys(obj).forEach((newAttribute) => {
          if (el.hasAttribute(newAttribute)) {
            if (el.getAttribute(newAttribute) !== obj[newAttribute]) {
              gwUtil.devlog(
                "EVENT METHOD WARNING: " +
                  newAttribute +
                  " was defined twice by two different systems: \n1. " +
                  el.getAttribute(newAttribute) +
                  "\n2. " +
                  obj[newAttribute] +
                  ". In most cases, this is an error state. But it's possible, in rare cases, that a client modified DOM element (like an autocomplete input) could be using another version of an inline attribute, and the DOM was updated in a way that the system could not undo its modifications."
              );
            }
          } else {
            el.setAttribute(newAttribute, obj[newAttribute]);
          }
        });
      }
    }
  }

  /**
   * Catch all method to do anything when the escape key is pressed. Focus node can be checked to do specific things.
   */
  escapeKeyPressed(): void {
    gwAutocomplete.revertAutocompleteInput();
    this.closeAllTemporaryUIElements();
    gwDraggable.forceCancel();
    gwPrefPanel.cancel();
    gwApp.closeShortcutHelp();
  }

  closeAllTemporaryUIElements(): void {
    gwMenus.closeAllMenus();
    gwInputSystems.closeOpenInputs();
    gwTooltips.hide();
    gwModalClientOverlay.close();
  }

  forceFocus(targetId: string): void {
    gwFocus.forceFocus(targetId, true);
  }

  quickJumpShortcutFired(): void {
    gwFocus.quickJumpShortcutFired();
  }

  possiblyAddOnBeforeUnloadHandler(): void {
    const isLoggedIn = gwUtil.getSessionInfo().userId !== "";
    const hasUnsavedWork = isLoggedIn && (gwPrefPanel.isDirty());
    const alwaysConfirm = isLoggedIn && gwPrefPanel.getPrefValueByPrefName("alwaysConfirmNavigation");
    const multiTabEnabled = gwMultiTab.isMultiTabEnabled();
    if (hasUnsavedWork || alwaysConfirm) {
      window.onbeforeunload = () => this.onBeforeUnload();
    } else {
      this.clearBeforeUnload();
    }
  }

  /**
   * Clears any currently registered onBeforeUnload handler
   */
  clearBeforeUnload(): void {
    (window as any).onbeforeunload = null;
  }

  /**
   * Checks whether an onBeforeUnload handler has been registered.
   */
  isBeforeUnloadRegistered(): boolean {
    return (window as any).onbeforeunload !== null;
  }

  /**
   * @public
   * should be called on any page reload.
   */
  orderSpecificInit(isFullReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    this.addInlineEventListenersToDom();

    if (isFullReload) {
      document.body.addEventListener("copy", this.onGlobalCopyEvent.bind(this));
      document.body.addEventListener("cut", this.onGlobalCutEvent.bind(this));
      document.body.addEventListener("paste", this.onGlobalPasteEvent.bind(this));
      document.body.addEventListener("keydown", this.onGlobalKeyEvent.bind(this));
      window.addEventListener("focusin", this.onGlobalFocusinEvent.bind(this));
      window.addEventListener("focusout", this.onGlobalFocusoutEvent.bind(this));

      document.addEventListener("pointerdown", this.onGlobalPointerdownEvent.bind(this));
      document.addEventListener("pointerup", this.onGlobalPointerupEvent.bind(this));
      document.addEventListener("pointerover", this.onGlobalPointeroverEvent.bind(this));
      document.addEventListener("pointermove", this.onGlobalPointermoveEvent.bind(this));
      document.addEventListener("pointerout", this.onGlobalPointeroutEvent.bind(this));
      document.addEventListener("pointercancel", this.onGlobalPointercancelEvent.bind(this));

      // These listeners are only for file system dragging from OS into the application
      window.addEventListener("dragover", this.onGlobalDragoverEvent.bind(this));
      window.addEventListener("dragenter", this.onGlobalDragenterEvent.bind(this));
      window.addEventListener("dragleave", this.onGlobalDragleaveEvent.bind(this));
      window.addEventListener("dragend", this.onGlobalDragendEvent.bind(this));
      window.addEventListener("drop", this.onGlobalDropEvent.bind(this));

      window.addEventListener("message", this.onGlobalMessageEvent.bind(this), false);

      // Add listener on capture phase as scroll events do not bubble
      window.addEventListener("scroll", this.onGlobalScrollEvent.bind(this), true);

      window.visualViewport.addEventListener("resize", this.onGlobalVisualViewportResize.bind(this));
    }

    this.possiblyAddOnBeforeUnloadHandler();

    //onChange and onInput events don't work if they are added at the body or window level,
    //so we attach them to the <form> tag instead
    const gwBody = gwUtil.getDomNode(".gw-body");
    //The body can be swapped by a diff (login!) so check that these are still registered
    if (gwBody && !(gwBody.hasAttribute("onchange") && gwBody.hasAttribute("oninput"))) {
      gwBody.setAttribute("onchange", "gw.globals.gwEvents.onGlobalChangeEvent(event)");
      gwBody.setAttribute("oninput", "gw.globals.gwEvents.onGlobalInputEvent(event)");
    }

    if (this.tempActiveId) {
      gwUtil.removeClass("#" + this.tempActiveId, "gw-event-temp-active");
      this.tempActiveId = null;
    }
  }

  onBeforeUnload(): string {
    return gwDisplayKey.get("Web.Client.ConfirmNavigateAway");
  }

  private getEnabledEventMethodOwnerOrBarrierEl(el: GwDomNode, eventName: string): GwDomNode | null {
    const event = this.eventsMap[eventName] || eventName;
    return gwUtil.getSelfOrFirstParentMatchingOneOfSelectors(
      el,
      [
        `[data-gw-event-barrier]`,
        `[data-gw-${event}]:not([aria-disabled=true]):not(:disabled)`,
        `[data-gw-${event}][data-gw-${event}-enabled]`,
      ],
      this.LIMITED_PARENT_SEARCH_STEPS_FOR_RAPID_FIRE_EVENTS
    );
  }

  //============================
  //=== Mouse and Pointer Events
  //============================

  // Added in order to support multi-select of checkboxes in a LV using shift click
  private shiftKeyEnabledOnLastPointerUp: boolean = false;
  private pointerDownInfo: GwPointerInfo | null = null;
  private possibleFirstClickOfDoubleClick: GwPointerInfo | null = null;
  private longPressTimeoutInfo: { id: number; info: GwPointerInfo } | null = null;
  private scrollingSincePointerDown: boolean = false;

  private cancelLongpressTimer(): void {
    if (this.longPressTimeoutInfo !== null) {
      window.clearInterval(this.longPressTimeoutInfo.id);
      this.longPressTimeoutInfo = null;
    }
  }

  private startLongpressTimer(info: GwPointerInfo): void {
    this.cancelLongpressTimer();
    const id = window.setTimeout(this.fireLongPress.bind(this), this.LONG_PRESS_TIME_MS);
    this.longPressTimeoutInfo = { id, info };
  }

  getShiftkeyPressedDuringLastMouseUp(): boolean {
    return this.shiftKeyEnabledOnLastPointerUp;
  }

  /**
   * Pointer Lifecycle:
   * 1. Pointer down
   * 2. Blur
   * 3. Focus
   * 4. Pointer up
   * 5. Input (in some scenarios)
   * 6. Change (in some scenarios)
   *
   * @param {PointerEvent} event
   */
  onGlobalPointerdownEvent(event: PointerEvent): void {
    if (!event.target) {
      return;
    }

    gwUtil.eventLog("### POINTER DOWN", event);

    if (gwDraggable.isDragging() || !this.eventsEnabled) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    this.setVisibleFocusMode(false);

    this.shiftKeyEnabledOnLastPointerUp = false; // Reset next time mouse pressed
    this.scrollingSincePointerDown = false;

    const possiblyNewPointerDownInfo = new GwPointerInfo(event);

    //NOTE: PointerEvent.isPrimary may sound like a cleaner solution than this, but the amount of places/hardware
    //where you end up with either nothing being set as isPrimary or 2 things being set as isPrimary is too dangerous
    if (!this.pointerDownInfo) {
      this.pointerDownInfo = possiblyNewPointerDownInfo;
      this.cancelLongpressTimer();
    } else if (possiblyNewPointerDownInfo.shouldBecomeNewMouseDownOverExistingMouseDown(this.pointerDownInfo)) {
      this.pointerDownInfo = possiblyNewPointerDownInfo;
      this.cancelLongpressTimer();
    }

    // Pointer events can be marked "invalid" - e.g. non-primary mouse button clicks (right / center buttons) or when
    // the mouse-click is used in conjunction with keyboard modifiers (alt, ctl)
    if (this.pointerDownInfo.isValidForMouseDown) {
      gwMouse.updatePosition(event);

      if (this.pointerDownInfo.longPressableEl) {
        this.startLongpressTimer(this.pointerDownInfo);
      }
    }
  }

  onGlobalPointerupEvent(event: PointerEvent): void {
    const pointerUpInfo = new GwPointerInfo(event, this.pointerDownInfo);
    let finalFirstClickOfDoubleClick: GwPointerInfo | null = null;
    let afterClickTarget: GwDomNode | null = null;

    // If the event doesn't contain info from the originating pointerDown event, kick out
    if (!this.pointerDownInfo) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // If this isn't the currently tracked pointer, then ignore it
    if (this.pointerDownInfo.id !== pointerUpInfo.id) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    gwUtil.eventLog("### POINTER UP", event);

    this.cancelLongpressTimer();

    // Don't bother handling this if the original pointer down event was marked as invalid;
    // e.g. - right mouse button clicks
    if (!this.pointerDownInfo.isValidForMouseDown) {
      this.pointerDownInfo = null;
      return;
    }

    this.handleDeferredChangeEvent(this.pointerDownInfo.originalTarget || (event.target as GwDomNode));

    if (event.shiftKey) {
      this.shiftKeyEnabledOnLastPointerUp = true;
      // Restricts this to an onchange event triggered by the associated mouse up event
      setTimeout(() => (this.shiftKeyEnabledOnLastPointerUp = false), 0);
    }

    if (gwDraggable.isDragging()) {
      // We're dragging, so ignore everything else
      event.stopPropagation();
      event.preventDefault();
      gwUtil.eventLog("### drag end", event);
      gwDraggable.end();
    } else if (pointerUpInfo.hasSameDblClickableAs(this.possibleFirstClickOfDoubleClick)) {
      // We've determined this to be the second click of a doubleclick
      afterClickTarget = pointerUpInfo.dblClickableEl;
      if (this.possibleFirstClickOfDoubleClick.timeBetweenEvents(pointerUpInfo) <= this.DOUBLE_CLICK_MAX_DELAY_MS) {
        this.internalDoubleClick(afterClickTarget, event);
      }
    } else if (pointerUpInfo.timeBetweenEvents(this.pointerDownInfo) > this.CLICK_MAX_TIME_BETWEEN_UP_AND_DOWN_MS) {
      // Too much time passed between mouse down and mouse up, ignore it
    } else if (pointerUpInfo.hasSameClickableAs(this.pointerDownInfo)) {
      // This is a standard click
      this.internalClick(pointerUpInfo.clickableEl, event);
      afterClickTarget = pointerUpInfo.clickableEl;
    } else if (pointerUpInfo.hasSameDblClickableAs(this.pointerDownInfo)) {
      // This is the first click of a double click
      finalFirstClickOfDoubleClick = this.pointerDownInfo;
      afterClickTarget = pointerUpInfo.dblClickableEl;
    }

    if (
      !afterClickTarget &&
      !gwFocus.findFocusableNodeForClick(this.pointerDownInfo && this.pointerDownInfo.originalTarget) &&
      !this.scrollingSincePointerDown
    ) {
      gwFocus.setLastClickedPanelAndClearFocus(this.pointerDownInfo.originalTarget);
    }

    this.pointerDownInfo = null;
    this.scrollingSincePointerDown = false;
    this.possibleFirstClickOfDoubleClick = finalFirstClickOfDoubleClick;


    this.doAfterAnyClick(afterClickTarget || (event.target as GwDomNode));
  }

  onGlobalPointermoveEvent(event: PointerEvent): void {
    if (!this.pointerDownInfo) {
      gwMouse.updatePosition(event);
      this.abstractOnEvent(this.getEnabledEventMethodOwnerOrBarrierEl(event.target as GwDomNode, "mousemove"), event, false);
      return;
    }

    if (this.pointerDownInfo.id !== event.pointerId) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    // If the original pointer down event was marked as invalid, kick out as we don't want to handle associated pointer
    // move events.  e.g. - right mouse button click and drag on a draggable component
    if (!this.pointerDownInfo.isValidForMouseDown) {
      return;
    }

    gwMouse.updatePosition(event);

    if (gwDraggable.isDragging()) {
      event.stopPropagation();
      event.preventDefault();

      gwDraggable.drag();
      return;
    }

    if (this.pointerDownInfo.position.distanceToPoint(gwMouse.position) > this.MOVE_DISTANCE_TO_CANCEL_LONG_PRESS_IN_PX) {
      this.cancelLongpressTimer();
    }

    if (this.pointerDownInfo.draggableEl) {
      // If the pointer has moved more than a "fidgity" amount, then we are going to lock them into the drag
      if (this.pointerDownInfo.position.distanceToPoint(gwMouse.position) > this.DRAG_DISTANCE_TO_START_IN_PX) {
        event.stopPropagation();
        event.preventDefault();
        gwUtil.eventLog("###### START - DRAG", event);
        this.cancelLongpressTimer();
        gwDraggable.start(this.pointerDownInfo.draggableEl, this.pointerDownInfo.position);
      }
    }
  }

  onGlobalPointeroverEvent(event: PointerEvent): void {
    if (gwDraggable.isDragging()) {
      event.stopPropagation();
      return;
    }

    const eventOwner = this.getEnabledEventMethodOwnerOrBarrierEl(event.target as GwDomNode, "mouseenter");

    this.abstractOnEvent(eventOwner, event, false);
  }

  onGlobalPointeroutEvent(event: PointerEvent): void {
    if (gwDraggable.isDragging()) {
      event.stopPropagation();
      return;
    }

    //Force mouseout events even when events are disabled
    this.abstractOnEvent(this.getEnabledEventMethodOwnerOrBarrierEl(event.target as GwDomNode, "mouseout"), event, true);
  }

  onGlobalPointercancelEvent(event: PointerEvent): void {
    this.onGlobalPointerupEvent(event);
  }

  /**
   * Uses the longPressTimeoutInfo to create a forced event with "longpress"
   * Passes the info.originalTarget as the relatedTarget to the GwForcedEvent
   */
  private fireLongPress(): void {
    if (this.longPressTimeoutInfo === null) {
      return;
    }

    const el = this.longPressTimeoutInfo.info.longPressableEl;

    if (!el) {
      console.error("Attempting to fire longpress on from a GwPointerInfo instance without a longPressableEl");
      return;
    }

    gwUtil.eventLog("###### FIRE LONG PRESS");

    const originalTarget = this.longPressTimeoutInfo.info.originalTarget;

    this.cancelLongpressTimer();
    this.pointerDownInfo = null;
    this.possibleFirstClickOfDoubleClick = null;
    this.abstractOnEvent(el, new GwForcedEvent(el, "longpress", originalTarget || undefined));
  }

  private internalClick(clickableElement: GwDomNode | null, event: PointerEvent): void {
    gwUtil.eventLog("###### INTERNAL CLICK");

    this.possibleFirstClickOfDoubleClick = null;

    if (!clickableElement) {
      return;
    }

    event.preventDefault();

    if (this.isClickOnControlInListDetailVew(clickableElement, event)) {
      return;
    }

    //If events are currently disabled but we still got a mouse click event then we assume that the mouse click caused a loss of focus which in
    //turn caused a post on change AJAX request which disabled events. In that case we want to process the mouse click after the post on change
    //completes, so we save it to be processed when the response arrives.
    if (!this.areEventsEnabled()) {
      gwUtil.eventLog("###### QUEUING CLICK");
      clickableElement.setAttribute(this.queuedClickAttr, "true");
      this.queuedInternalClick = { clickableElement, e: this.createPointerEvent("click", event) };
      return;
    }

    this.abstractOnEvent(clickableElement, this.createMouseEvent("click", event), false);
  }

  private readonly inputTypesThatConsumeClick: GwMap = {
    checkbox: true,
    radio: true,
  };

  /**
   * Handle the special case where the user clicks on a control within a row of a list detail view's controlling list
   * view. Normally the click sets the row as the "selected" row, which involves a server round trip. But if the user
   * clicked on an editable control within the row, and that control changes in some way as the result of the click,
   * then we need to hold off on selecting the row and leave the control to handle the change and click events, which
   * would be lost if we let the server round trip proceed. This will enable the normal confirmation code (which is
   * all driven by change events) to execute.
   * @param clickableElement the element that is about to handle the click
   * @param event the original pointer event
   */
  private isClickOnControlInListDetailVew(clickableElement: GwDomNode, event: PointerEvent): boolean {
    const isRow = clickableElement.classList.contains("gw-RowWidget");
    if (!isRow) {
      return false;
    }
    const originalTarget = event.target as GwDomNode | null;
    if (!originalTarget) {
      return false;
    }
    return originalTarget instanceof HTMLInputElement
      ? this.inputTypesThatConsumeClick[originalTarget.type] || false
      : originalTarget instanceof HTMLSelectElement;
  }

  private internalDoubleClick(dblClickableEl: GwDomNode | null, event: PointerEvent): void {
    gwUtil.eventLog("###### INTERNAL DBL CLICK");
    this.abstractOnEvent(dblClickableEl, this.createMouseEvent("dblclick", event), false);
    this.possibleFirstClickOfDoubleClick = null;
  }

  possiblyFireQueuedClick(): void {
    if (this.queuedInternalClick) {
      gwUtil.eventLog("### POSSIBLY FIRE QUEUED CLICK");
      // Fire the queued click, providing its target is still present in the DOM
      if (document.body.contains(this.queuedInternalClick.clickableElement)) {
        this.internalClick(this.queuedInternalClick.clickableElement, this.queuedInternalClick.e);
      } else {
        const nodes = gwUtil.getDomNodesByAttr(this.queuedClickAttr);
        if (nodes.length > 1) {
          throw new Error("Found more than one node with the attribute: " + this.queuedClickAttr);
        } else if (nodes.length === 1) {
          const node = nodes[0];
          this.internalClick(node, this.createPointerEvent("click", this.queuedInternalClick.e));
        }
        nodes.forEach((el) => el.removeAttribute(this.queuedClickAttr));
      }
      this.queuedInternalClick = null;
    }
  }

  //============================
  //=== Clipboard Events
  //============================

  onGlobalCopyEvent(event: ClipboardEvent): void {
    if (event.target) {
      this.abstractOnEvent(this.getEnabledEventMethodOwnerOrBarrierEl(event.target as GwDomNode, "copy"), event);
    }
  }

  onGlobalPasteEvent(event: ClipboardEvent): void {
    if (!event.clipboardData) {
      return;
    }

    this._pasteEventRawClipboardText = event.clipboardData.getData("text");

    if (event.target) {
      this.abstractOnEvent(this.getEnabledEventMethodOwnerOrBarrierEl(event.target as GwDomNode, "paste"), event);
    }

    this._pasteCausedCurrentInputEvent = true;
  }

  onGlobalCutEvent(event: ClipboardEvent): void {
    this.onGlobalCopyEvent(event);
  }

  //======= Window Message Event

  onGlobalMessageEvent(event: MessageEvent): void {
    gwCrossOriginInternal.receiveMessageFromTargetWindow(event as GwMessageEvent);
  }

  // ==== FORM EVENTS

  /**
   * Input event fires every time the value of an input changes
   * @param event
   */
  onGlobalInputEvent(event: Event): void {
    if (!this.eventsEnabled || this.currentlyInChangeHandlingCycle) {
      gwUtil.devlog("Disabled global input event: events: " + this.eventsEnabled + " / cycle : " + this.currentlyInChangeHandlingCycle);
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    gwUtil.eventLog("### INPUT EVENT", event);

    const eventTarget = event.target as GwDomNode;

    if (eventTarget) {
      // If pref allows scrubbing word special chars and this is a text input
      if (
        gwPrefPanel.getPrefValueByPrefName("replaceWordProcessingCharacters") &&
        gwInputs.isTextInputOrTextArea(eventTarget) &&
        GwCharReplacer.needsReplacement(eventTarget.value)
      ) {
        const newValue = GwCharReplacer.replace({ value: eventTarget.value, cursorPos: gwInputSystems.getCursorPos(eventTarget) });
        eventTarget.value = newValue.value;
        gwInputSystems.setCursorPos(eventTarget, newValue.cursorPos);
      }

      //We specifically do not convert minusLikes in text areas, just text inputs
      if (gwInputs.isTextInput(eventTarget)) {
        const cursorPos = gwInputSystems.getCursorPos(eventTarget);
        eventTarget.value = GwCharReplacer.convertAllMinusLikesToHyphenMinus(eventTarget.value);
        gwInputSystems.setCursorPos(eventTarget, cursorPos);
      }

      gwForm.inputElementChanged(eventTarget as HTMLTextInputElement);
      gwAria.addAriaLabelToInputIfPrefixedOrSuffixed(eventTarget as GwInputElement);
      this.abstractOnEvent(this.getEnabledEventMethodOwnerOrBarrierEl(event.target as GwDomNode, "input"), event);
    }

    this._pasteCausedCurrentInputEvent = false;
    this._pasteEventRawClipboardText = null;
  }

  /**
   *
   * Currently we handle the following cases:
   * 1) for <select>, when the selection is changed
   * 2) textarea, input:password, input:search: input:text; during onblur if the value's been changed
   *
   * TODO: input:file, input:range slightly different?
   *       input:checkbox and input:radio may be handled differently in IE?
   *
   * The complicated part is we need to know if the element that caused the blur, (clicked or tabbed to),
   * is actually a child of the widget holding the input, meaning, the user has clicked something like the
   * autocomplete widget. In that case, we don't want to fire the onChange method.
   *
   * The only way for us to know that, is to wait for the blur event, and then run all the logic there.
   *
   * So, here, we set a flag to tell the following on blur event to run all the on change logic.
   * Unless this event is the result of a call to forceGlobalChangeEvent, in which case we process the event normally.
   * @type {boolean}
   */
  onGlobalChangeEvent(event: Event): void {
    gwUtil.eventLog("### CHANGE EVENT", event);

    const input: GwInputElement | null = event.target as GwInputElement;
    if (!input) {
      return;
    }

    const hasNoValueWidget = input.hasAttribute("data-gw-event-barrier");
    const valueWidget: GwValueWidgetElement | null = hasNoValueWidget ? null : gwForm.findEnclosingValueWidget(input);
    const target: GwDomNode | null = hasNoValueWidget ? input : valueWidget;
    if (!target) {
      return;
    }

    gwForm.inputElementChanged(input);

    // If this event was the result of a forceGlobalChangeEvent or the input has no value widget then
    // handle the event.
    if (
      GwForcedEvent.isGwForcedEvent(event) ||
      hasNoValueWidget ||
      (this.isImmediateChangeNodeType(input) && !gwDateValue.isDateTimeElement(valueWidget))
    ) {
      this.abstractOnEvent(target, event);
    } else if (valueWidget) {
      this.setPendingChangesOnValueWidget(valueWidget);
      this.currentlyInChangeHandlingCycle = true;
    }
  }

  // ========= FOCUS EVENTS
  private handleDeferredChangeEventTimer: number = -1;

  private clearHandleDeferredChangeEventTimer(): void {
    if (this.handleDeferredChangeEventTimer >= 0) {
      clearTimeout(this.handleDeferredChangeEventTimer);
      this.handleDeferredChangeEventTimer = -1;
    }
  }

  /**
   * @private
   * Sets gwNavigation.lastFocused
   * Then processes the blur event
   * Then if processChangeEventInBlurEvent, process a change event
   *
   * Note, in the pointer system we use we get:
   * 1. pointer down
   * 2. focus out (this may not fire a focus in ever, if there is no focusable element)
   * 3. pointer up
   *
   * @param event
   */
  onGlobalFocusoutEvent(event: FocusEvent): void {
    gwUtil.eventLog("### BLUR EVENT", event);
    gwFocus.setLastFocus(event.target as GwDomNode);
    const target: GwDomNode = event.target as GwDomNode;
    const relatedTarget: GwDomNode = event.relatedTarget as GwDomNode;

    gwHelpText.focusOut();

    // Run the blur event first if it exists
    const blurMethodOwner = this.getEnabledEventMethodOwnerOrBarrierEl(target, "blur");

    // If the related target of the blur event is contained by the containing widget, then ignore the event
    if (blurMethodOwner && !blurMethodOwner.contains(relatedTarget)) {
      this.abstractOnEvent(blurMethodOwner, event);
    }

    // In some cases we may not get a subsequent focus in or click event
    // which will mean any deferred change won't get applied. To fix this
    // we set a timer. If there are focusin or click events queued they'll cancel the timer
    // and do our normal processing. But if there are no events queued the timer will fire and apply
    // any deferred change
    this.clearHandleDeferredChangeEventTimer();
    this.handleDeferredChangeEventTimer = window.setTimeout(this.handleDeferredChangeEvent.bind(this, relatedTarget, true), 0);

    gwFocus.possiblyHandleDocumentBlur();

    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * @private
   * Stores the currentFocus and lastFocus globals. Then fires abstractOnEvent, passing the newly set currentFocus as the node.
   * @param event
   */
  onGlobalFocusinEvent(event: FocusEvent): void {
    gwUtil.eventLog("### FOCUS EVENT", event);
    this.clearHandleDeferredChangeEventTimer();

    let nodeToFocus: GwDomNode | null = event.target as GwDomNode;

    if (!nodeToFocus || !nodeToFocus.hasAttribute) {
      return;
    }

    if (nodeToFocus.hasAttribute("data-gw-refuse-focus")) {
      gwFocus.restoreLastFocusNodeIfAvailable(false);
      return;
    }

    // If the element that we blurred from to get to this new element, is part of a focus lock cycle
    // And the new focus is outside of the focus lock
    // Then we will take over, and force focus onto the corresponding part of the lock.
    // ie. data-gw-focus-lock-top -> data-gw-focus-lock-bottom, and vice versa
    const cycleFocusedNode = gwFocus.getCorrespondingFocusLockOrNewFocusEl(nodeToFocus);
    const currentlyFocusedNodeChangedByCycle = cycleFocusedNode !== nodeToFocus;

    if (currentlyFocusedNodeChangedByCycle) {
      nodeToFocus = cycleFocusedNode;
    }

    if (!nodeToFocus) {
      return;
    }

    const isFocusable = gwFocus.isFocusable(nodeToFocus, !this.mouseDown);

    //If the mouse is down, don't allow searching down
    if (this.mouseDown && !isFocusable) {
      //If the clicked node isn't focusable, search up until we find one
      nodeToFocus = gwFocus.findFocusableNodeForClick(nodeToFocus);
    }

    if (nodeToFocus) {
      gwFocus.processNewFocus(nodeToFocus, currentlyFocusedNodeChangedByCycle);
      gwHelpText.focusIn(nodeToFocus as HTMLInputElement);
      if (gwUtil.hasValue(this.lastActiveKeydownKey) && gwKeys.shortcutKeyWordToKeyCodeMap.TAB === this.lastActiveKeydownKey) {
        gwMenus.focusChangedViaTabPossiblyCloseAbandonedMenus(nodeToFocus);
      }

      this.handleDeferredChangeEvent(nodeToFocus);
      const eventOwner = this.getEnabledEventMethodOwnerOrBarrierEl(nodeToFocus, "focus");

      this.abstractOnEvent(eventOwner, event);
    } else {
      if (gwPrefPanel.getPrefValueByPrefName("alwaysRestoreFocus")) {
        gwFocus.restoreFocus(false);
      }
    }

    event.stopPropagation();
    event.preventDefault();
  }

  private handleDeferredChangeEvent(targetNode: GwDomNode | null, allowNullTarget: boolean = false): void {
    this.clearHandleDeferredChangeEventTimer();
    this.currentlyInChangeHandlingCycle = false;

    if (!targetNode && !allowNullTarget) {
      return;
    }

    const lFocus = gwFocus.getLastFocus();
    if (!lFocus) {
      return;
    }

    let widgetWithPendingChange: GwDomNode | null;
    if (lFocus.id === "gw-focus-barrier-bottom") {
      // This traverses the entire dom but should only happen in the special case where we are tab'ing off the last
      // element on the entire page.
      widgetWithPendingChange = gwUtil.getDomNodeByAttr("data-gw-pending-change");
      gwUtil.eventLog("Focus at end of page: checked entire dom for any node with pending change: ", widgetWithPendingChange);
    } else {
      widgetWithPendingChange = gwUtil.getSelfOrFirstParentWithAttr(lFocus, "data-gw-pending-change");
    }

    if (!widgetWithPendingChange) {
      return;
    }

    if (allowNullTarget || !this.isPartOfValueWidget(widgetWithPendingChange, targetNode)) {
      const deferredChangeSystem = widgetWithPendingChange.getAttribute("data-gw-pending-change");
      widgetWithPendingChange.removeAttribute("data-gw-pending-change");
      if (deferredChangeSystem) {
        const deferredChangeOnFocusMethod = (gw.globals[deferredChangeSystem] as any).deferredChangeOnFocusInMethod;
        if (deferredChangeOnFocusMethod) {
          deferredChangeOnFocusMethod.call(gw.globals[deferredChangeSystem], widgetWithPendingChange);
        }
      }
      gwUtil.eventLog("###### PROCESS DEFERRED CHANGE");
      const widgetInput = gwUtil.getDomNodeByName(widgetWithPendingChange.id, widgetWithPendingChange);
      if (widgetInput) {
        this.forceGlobalChangeEvent(widgetInput, targetNode!);
      }
    }
  }

  /**
   * Checks if target node is part of the given value widget and is not one of its children
   * (i.e. a nested menu item)
   */
  private isPartOfValueWidget(valueWidget: GwDomNode, targetNode: GwDomNode | null): boolean {
    if (valueWidget.contains(targetNode as HTMLElement)) {
      const children = valueWidget.querySelector(".gw-vw--children");
      return !children || !children.contains(targetNode as HTMLElement);
    } else {
      return false;
    }
  }

  // =========== DRAG DROP EVENTS
  /**
   * Fires when a user drag & drops a file on a dropzone target.
   */
  onGlobalDropEvent(event: DragEvent): void {
    if (gwDraggable.isDragging()) {
      event.stopPropagation();
      return;
    }

    this.abstractGlobalDragDropEvent(event, "drop");
  }

  /**
   * Fires when a user drag a file over a dropzone target
   */
  onGlobalDragoverEvent(event: DragEvent): void {
    this.abstractGlobalDragDropEvent(event, "dragover");
  }

  onGlobalDragenterEvent(event: DragEvent): void {
    this.abstractGlobalDragDropEvent(event, "dragenter");
  }

  onGlobalDragleaveEvent(event: DragEvent): void {
    this.abstractGlobalDragDropEvent(event, "dragleave");
  }

  onGlobalDragendEvent(event: DragEvent): void {
    this.abstractGlobalDragDropEvent(event, "dragend");
  }

  private abstractGlobalDragDropEvent(event: DragEvent, type: string): void {
    event.preventDefault();

    if (gwDraggable.isDragging()) {
      event.stopPropagation();
      return;
    }

    const queryStr = "[data-gw-" + type + "]";
    if (event.target) {
      const droppableSelfOrParent = $(event.target).closest(queryStr)[0] as GwDomNode | null | undefined;
      if (droppableSelfOrParent) {
        this.abstractOnEvent(droppableSelfOrParent, event);
      }
    }
  }

  onGlobalVisualViewportResize(event: Event): void {
    gwResizer.check();
  }

  /**
   * NOTE: This is being called on every scroll event; do not put anything expensive in this method
   * NOTE: We only listen to targets that are divs.
   * @param event
   */
  onGlobalScrollEvent(event: Event): void {
    if (this.pointerDownInfo !== null) {
      this.scrollingSincePointerDown = true;
    }

    // Some silly browsers call scroll when we set the values of customized select elements
    // We don't want or need that, so we'll just limit to divs for now.
    const eventTarget: GwDomNode = event.target as GwDomNode;
    if (!eventTarget || (eventTarget.tagName && eventTarget.tagName.toLowerCase() !== "div")) {
      return;
    }

    // If the scroll event is inside of a fixed element, like a helptext window, then leave everything open
    if (eventTarget.id === gwHelpText.HELP_TEXT_EL_ID) {
      return;
    }

    if (eventTarget.id === "gw-center-bottom-section") {
      if (!gwDraggable.isDragging() && this.eventsEnabled) {
        gwResizer.onCenterPanelScroll(eventTarget as HTMLDivElement);
      }
    }

    gwMenus.closeAllMenusContainedBy(event.target as GwDomNode);
    gwInputSystems.closeOpenInputs(event);
  }

  /**
   * @public
   * The event listener method placed on any elements with data-gw-"event" attributes requiring the node to listen for the event.
   * @parem node: passed to the function via inline 'this'.
   * @param event
   */
  onElementEvent(event: Event, node: GwDomNode): void {
    const e = event;
    let forceAllowEvent = false;
    const eType = e.type;
    if (eType === "mouseleave") {
      forceAllowEvent = true;
    }

    this.abstractOnEvent(node, e, forceAllowEvent);
  }

  /**
   * @private
   * Global callback for any key event.
   * @param event
   */
  onGlobalKeyEvent(event: KeyboardEvent): void {
    gwUtil.eventLog("### onGlobalKeyEvent", event);
    if (!this.eventsEnabled || this.currentlyInChangeHandlingCycle) {
      gwUtil.devlog("Disabled global key event: events: " + this.eventsEnabled + " / cycle : " + this.currentlyInChangeHandlingCycle);
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const key = gwKeys.getKeyCode(event);

    if (key !== null && key !== undefined) {
      if (gwKeys.ignoredKeyCodes[key]) {
        return;
      }
    }

    //If the key is the enter key, and the focus is inside of a textarea, then bail
    if (gwKeys.shortcutKeyWordToKeyCodeMap.ENTER === key) {
      const currentFocus = gwFocus.getCurrentFocus();
      if (currentFocus && (currentFocus.tagName || "").toLowerCase() === "textarea") {
        return;
      }
    }

    this.setVisibleFocusMode(true);

    this.lastActiveKeydownKey = key;
    setTimeout(() => (this.lastActiveKeydownKey = null), 0);

    const target = event.target as GwDomNode;
    this.abstractOnEvent(this.getEnabledEventMethodOwnerOrBarrierEl(target, "key") || target, event);
  }

  /**
   * Called by key and pointer events in order to allow the client to "not bother" showing focus outlines unless the user
   * Wants them, which we interpret by the press of keys.
   * Some modern implementations only enable focus mode on tab or arrow keys, we are going to enable it on all keys for now
   * @param visible
   */
  setVisibleFocusMode(visible: boolean): void {
    const formEl = document.getElementById("gw-root-form");

    if (formEl) {
      formEl.style.setProperty("--gw-focus-outline-style-for-disabled-el", visible ? "dashed" : "none");
      formEl.style.setProperty("--gw-focus-outline-style-for-enabled-el", visible ? "solid" : "none");
    }
  }

  /**
   * @private
   * This should not need to be referenced outside of this file. This is the catch all listener function for all static
   * @param node: a DOM element
   * @param e: the event object
   * @param forceAllowEvent: boolean - set to true will bypass the aria-disabled and eventsEnabled checks. Used to allow things like
   * mouseleave to let hover menus close even during a server roundtrip.
   */
  private abstractOnEvent(node: GwDomNode | null, e: GwEventType, forceAllowEvent: boolean = false): void {
    if (!node) {
      return;
    }

    const isFocusNodeDisabled = !this.isEventEnabledOnNode(node, e.type, e);

    if (!forceAllowEvent) {
      // don't process any further if there is a global events disabled or the current focusNode is disabled for non-key event
      if (!this.eventsEnabled || (e.type !== "keydown" && isFocusNodeDisabled)) {
        e.stopPropagation();
        return;
      }
    }

    if (e.type === "change") {
      gwInputSystems.clearInvalidValueStatus(node);
    }

    const eventDescription: GwEventDescription | null = GwEventDescription.getEventDescription(node, e, isFocusNodeDisabled);

    //gwUtil.eventLog("abstractOnEvent for event '" + e.type + "', eventDescription:", eventDescription);

    const systemAndMethod: GwFunctionWithContext | null =
      eventDescription && eventDescription.methodName ? this.findSystemAndMethod(eventDescription.methodName) : null;

    const maybeReflect = e.type === "change" && gwReflection.isReflectionTrigger(node);
    // Bail if we didn't find any method and this node is not a reflection trigger candidate
    if (!systemAndMethod && !maybeReflect) {
      return;
    }

    if (eventDescription) {
      // If the event's target is disabled, bail
      if (eventDescription.eventTargetNode && !this.isEventEnabledOnNode(eventDescription.eventTargetNode, eventDescription.eventType, e)) {
        return;
      }
      // Bail if the event needs confirmation and the user vetoes it
      if (!gwConfirm.confirmEvent(eventDescription)) {
        return;
      }

      //If there is a prompt, show it. If the user cancels the prompt, we stop the event
      if (!this.checkForAndShowPrompt(eventDescription)) {
        return;
      }
    }

    /**
     * If we get all the way here, and then the gw event handling method decides it should not be in charge
     * Then it can return forceCurrentEventDefaultBehaviorAndPropagation: true
     * In which case we ignore any upcoming logic where we would normally stopPropagation or preventDefault on the event.
     * This should not be needed, but the implementation of our special gw 'copy' on value widgets really shouldn't run if the widget is in readonly mode,
     * But there is not a clean place to prevent the adding of data-gw-copy on readonly value widgets
     */
    let systemAndMethodResult: { forceCurrentEventDefaultBehaviorAndPropagation: true } | unknown = null;

    if (systemAndMethod) {
      if (eventDescription && eventDescription.unnamedArgs) {
        //then this method was defined in HTML without colon separated arguments, so we just send it the whole string after the method name
        systemAndMethodResult = systemAndMethod.execute(eventDescription.unnamedArgs, e);
      } else {
        systemAndMethodResult = systemAndMethod.execute(node, eventDescription, e);
      }
    }

    const forceCurrentEventDefaultBehaviorAndPropagation =
      systemAndMethodResult && typeof systemAndMethodResult === "object"
        ? (systemAndMethodResult as any).forceCurrentEventDefaultBehaviorAndPropagation
        : false;

    if (!forceCurrentEventDefaultBehaviorAndPropagation) {
      // Stop propagation prevents the event from bubbling any further.
      e.stopPropagation();

      let shouldPreventDefault: boolean = false;

      if (eventDescription) {
        // If the method was triggered by a key, we prevent the default behavior unless enableDefault is set
        if (this.disableDefaultBehaviorIfHandled[eventDescription.eventType]) {
          if (!eventDescription.enableDefault) {
            shouldPreventDefault = true;
          }
        }
      }

      if (shouldPreventDefault) {
        // Prevent default prevents low level browser behavior on normally standard interactions, like copy/paste, etc
        e.preventDefault();
      }
    }

    if (maybeReflect) {
      gwReflection.notifyTriggerChange(node.id);
    }
  }

  // ========= EVENT QUEUE

  clearQueuedInternalClick(): void {
    this.queuedInternalClick = null;
  }

  // ========== HELPER METHODS

  findEnclosingValueWidgetOrThrow(el: GwDomNode): GwValueWidgetElement {
    const valueWidget = gwForm.findEnclosingValueWidget(el);
    if (!valueWidget) {
      throw new Error("Unable to locate value widget for dom node: " + el);
    }

    return valueWidget;
  }

  setPendingChangesOnValueWidget(el: GwValueWidgetElement): void {
    gwUtil.eventLog("setPendingChangesOnValueWidget: el: ", el.id);
    el.setAttribute("data-gw-pending-change", "");
  }

  private isImmediateChangeNodeType(node: GwInputElement): node is HTMLSelectElement | HTMLInputElement {
    if (gwInputs.isSelect(node)) {
      return true;
    }

    const type = node.type;
    if (!type) {
      return false;
    }

    return type === "checkbox" || type === "radio" || type === "button" || type === "file";
  }

  /**
   * @private
   * Given a string describing a method return the corresponding function
   * @param methodName
   * @returns {*}
   */
  findSystemAndMethod(methodName: string): GwFunctionWithContext | null {
    const path = methodName.split(".");

    if (path.length === 1) {
      // If there isn't a deep path specified then we assume it's a method on our events methods object
      const methodOnEventMethodObject = this.methods[path[0]];

      if (typeof methodOnEventMethodObject !== "function") {
        gwUtil.devlog("WARNING: found object not of type function via data attribute path: ", methodName);
        return null;
      }

      return new GwFunctionWithContext(this.methods, methodOnEventMethodObject);
    }

    // We allow the path to be dot delimited, so we walk down it to find the method
    // If they didn't include gw, then we'll start there.

    if (path[0] === "gw") {
      path.shift();
    }

    if (path[0] === "globals") {
      path.shift();
    }

    let functionChunk: (() => unknown) | null = null;
    let contextChunk: GwMap | null = null;
    let chunkObject: GwMap = gw.globals;

    if (!gw.globals[path[0]]) {
      throw new Error(
        "Unable to locate global system " +
          path[0] +
          ". Ensure that the class is set up correctly, and is being included in the import chain."
      );
    }

    for (let i = 0; i < path.length; i++) {
      chunkObject = chunkObject[path[i]];

      if (i === 0) {
        contextChunk = chunkObject;
      } else if (i === path.length - 1) {
        if (typeof chunkObject !== "function") {
          break;
        }

        functionChunk = chunkObject as () => unknown;
      }
    }

    if (contextChunk === null || functionChunk === null) {
      throw new Error("found object not of type function via data attribute path: " + methodName);
    }

    return new GwFunctionWithContext(contextChunk, functionChunk);
  }

  /**
   * @private
   * If the node running this event includes a prompt, show the prompt and the optional
   * default value, and set the eventParam input to match the submitted value before continuing.
   * @return boolean false if the action was canceled, stopping the event
   */
  private checkForAndShowPrompt(eventDescription: GwEventDescription): boolean {
    if (eventDescription.eventType !== "click" && !eventDescription.replacesClick) {
      // no need to show a prompt for events other than 'click'
      return true;
    }
    const node = eventDescription.eventTargetNode;
    if (node && node.dataset && node.dataset.gwPrompt) {
      gwConfirm.closeProblematicTemporyElementsDuringConfirmAndPrompt();
      const promptText = node.dataset.gwPrompt;
      const promptDefault = node.dataset.gwPromptDefault || "";
      const response: string | null = window.prompt(promptText, promptDefault);

      if (response === null) {
        //The browser returns "null" if the prompt is canceled
        return false;
      }

      gwUtil.setEventParam("eventParam", response);
    }

    return true;
  }

  /**
   * @private
   * Fires after any mouse click event. Closes all open submenus and datepickers
   * if the click comes from outside of the submenu or the datepicker.
   * @param target - DOM element
   */
  private doAfterAnyClick(clickedEl: GwDomNode | null): void {
    // Check if click is inside a sub menu, if it is, then don't close the open menus
    const clickIsInSubmenu = !!gwUtil.getSelfOrFirstParentWithClass(clickedEl, ".gw-subMenu");
    if (!clickIsInSubmenu) {
      gwMenus.closeAllMenus();
    }

    gwMenus.openStoredMenu();

    // When a date picker is shown, it becomes the child of the DateValueWidget that holds the date input.
    // If the click is in a DateValueWidget, don't close the date picker
    if (!gwUtil.getSelfOrFirstParentWithClass(clickedEl, ".gw-inDatePicker")) {
      gwDateValue.hideDatePicker();
    }

    //TODO: do we need to do something special with when a user tries to "select" text in a help text dropdown?
  }

  /**
   * @private
   * Checks the current focus and returns associated shortcut owner.  If the current focus is not set, use
   * the focus context area to try to determine the shortcut owner.
   *
   * The shortcut owner is used to determine which panels and in what order the panels are checked when
   * resolving shortcuts.
   *
   * @returns GwShortcutOwner which owner to use when resolving shortcuts
   */
  getCurrentShortcutOwner(): GwShortcutOwner {
    // Check to see if the south panel is open.  If it is closed or minimized, set the shortcut owner to CENTER.
    if (!this.isSouthPanelOpen()) {
      return GwShortcutOwner.CENTER;
    }

    // Else we check the currentfocus to see which owner to use.  If currentfocus is not set, use the last clicked panel
    // to decide who owns shortcuts.

    const currentFocus = gwFocus.getCurrentFocus();
    if (currentFocus) {
      if ($(currentFocus).parents("#gw-south-panel").length > 0) {
        return GwShortcutOwner.SOUTH;
      } else {
        return GwShortcutOwner.CENTER;
      }
    } else {
      const panel = gwFocus.getLastClickedPanel();
      if (panel === null) {
        return GwShortcutOwner.NULL;
      } else if (panel === GwPanel.SOUTH) {
        return GwShortcutOwner.SOUTH;
      } else {
        return GwShortcutOwner.CENTER;
      }
    }
  }

  /**
   * Returns true if south panel is visible and not-collapsed
   * @returns {boolean}
   */
  isSouthPanelOpen(): boolean {
    const gwSouthPanelEl = document.getElementById("gw-south-panel");
    if (!gwSouthPanelEl) {
      return false;
    }
    return !(gwSouthPanelEl.classList.contains("gw-placeholder") || gwSouthPanelEl.classList.contains("gw-makeSouthPanel--min"));
  }

  /**
   * @private
   * Checks to see if the gw-internalTools-flag info div is set to true, signalling that
   * internal tools are enabled
   * @returns true if internal tools are enabled, false if not.
   */
  internalToolsEnabled(): boolean {
    return gwUtil.getUtilityFlag("gw-internalTools-flag");
  }

  // ========== MANIPULATE DOM

  /**
   * Called by addInlineEventListenersToContainer,
   * allows systems to add processing to check every node in the dom, since we're already walking them for addInlineEventListeners
   * @param node
   */
  private doCustomSystemWorkOnEveryNodeOnPageLoad(node: GwDomNode): void {
    gwScroll.restoreScrollForNode(node);
    gwReflection.initForNode(node);
    gwShortcuts.registerShortcuts(node);
  }

  addInlineEventListenersToContainer(contextNode: GwContextNode): void {
    if (!contextNode) {
      throw new Error("addInlineEventListenersToContainer requires a contextNode");
    }

    this.addInlineEventListenersToDom(contextNode);
  }

  /**
   * @public
   * Currently called on full or partial page reload. TODO: this could get optimized to only run on the diff nodes.
   * Iterates over every element in the dom looking for data-gw-"event" attributes, and adds the corresponding inline event listeners
   * //TODO: eventually, this could become the "walkAllDomNodesOnPageLoad" generic method.
   */
  addInlineEventListenersToDom(contextNode: GwContextNode = document): void {
    const nodes = contextNode.getElementsByTagName("*"); //TODO: need to @Optimize this one day to be more specific. Or to not walk all nodes.

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node) {
        continue;
      }

      this.processNodeForInlineEvents(node as GwDomNode);
    }
  }

  processNodeForInlineEvents(node: GwDomNode): void {
    this.addAdditionalAttributes(node);

    this.doCustomSystemWorkOnEveryNodeOnPageLoad(node);

    //NOTE: all native user input elements will already have a tabIndex of 0
    if (!node.hasAttribute("data-gw-no-tab-index")) {
      const hasEventDescriptor =
        node.hasAttribute("data-gw-click") ||
        node.hasAttribute("data-gw-key") ||
        node.hasAttribute("data-gw-focus") ||
        node.hasAttribute("data-gw-blur") ||
        gwUtil.hasClass(node, "gw-actionable") || // include (potentially-disabled) action widgets with this tag, mostly for including LinkWidgets
        this.shouldBeIndexedForTooltip(node); // show helptext for all tooltips if setting enabled
      // Editable value widget wrappers do not need a tab index because focus should go to their input
      if (hasEventDescriptor && !(gwUtil.hasClass(node, "gw-editable") && gwUtil.hasClass(node, "gw-ValueWidget"))) {
        node.setAttribute("tabIndex", "0");
      }
    }
  }

  private shouldBeIndexedForTooltip(node: GwDomNode): boolean {
    return Boolean(
        node.hasAttribute("data-gw-tooltip")
        && gwPrefPanel.getPrefValueByPrefName("tabIndexedTooltips")
        && gwFocus.getFocusable(node).length == 0 // only give index if no focusable children can inherit the tooltip
    );
  }

  addInlineEventListenersToThisSpecificNode(el: GwDomNode): void {
    this.processNodeForInlineEvents(el);
  }

  addAdditionalAttributes(node: GwDomNode): void {
    this.addAdditionalAttributeTransforms(node, this.complexAttributeTransforms);

    if (gwInputs.isTextInput(node)) {
      // We never want to auto capitalize, only pain lies down that road
      node.setAttribute("autocapitalize", "none");

      // But we want to enable/disable browser autocomplete, based on the pref panel, but we don't want to mess with nodes that we've already set it on
      // Either via an ht template, or via our attribute transform logic
      // So if the node already has an attribute of autocomplete, let it be, otherwise, set it based on the pref panel
      // We manually set autocomplete="off" on nodes with our data-gw-autocomplete or with data-gw-helptext on them
      if (!node.hasAttribute("autocomplete")) {
        gwUtil.conditionalAddRemoveAttr(
          gwPrefPanel.getPrefValueByPrefName("disableBrowserAutocomplete"),
          node,
          "autocomplete",
          this.BREAK_AUTOCOMPLETE_VALUE
        );
      }

      gwAria.addAriaLabelToInputIfPrefixedOrSuffixed(node as GwInputElement);
    }

    if (gwListView.isCellInner(node)) {
      gwListView.processCellInner(node);
    }
  }

  // ========= EVENT DISABLED ENABLED

  private isEventEnabledOnNode(node: GwDomNode, eventType: string, e: Event): boolean {
    const finalEventName = this.eventsMap[eventType] || eventType;
    // If this is a keyboard event, using an arrow key, then we assume it's a navigation type, and allow it, even if the node is disabled
    // This is a pretty specific exception, but more general ones start causing problems with being able to do things like hitting "enter" on a disabled but focused button
    if (finalEventName === "key") {
      const key = gwKeys.getKeyCode(e as KeyboardEvent);
      if (
        key === gwKeys.shortcutKeyWordToKeyCodeMap.UP ||
        key === gwKeys.shortcutKeyWordToKeyCodeMap.DOWN ||
        key === gwKeys.shortcutKeyWordToKeyCodeMap.LEFT ||
        key === gwKeys.shortcutKeyWordToKeyCodeMap.RIGHT
      ) {
        return true;
      }
    }

    return !gwUtil.isDisabled(node) || node.hasAttribute("data-gw-" + finalEventName + "-enabled");
  }

  /**
   * @public
   * Enable events globally. This includes mouse, keyboard, blur, focus.  Calling enableEvents will decrement the
   * current lock count by 1 and will only enable events if the underlying lock count is <= 0.
   *
   * Lock count is incremented every time {@method disabledEvents} is called.
   *
   */
  enableEvents(): void {
    if (this.eventLockCount < 1) {
      gwUtil.devlog("WARNING: (enableEvents) Encountered unexpected event lock count (resetting to 0): " + this.eventLockCount);
      this.eventLockCount = 0;
    } else {
      this.eventLockCount--;
    }
    if (this.eventLockCount === 0) {
      this.eventsEnabled = true;
      this.onEventsEnabled();
    }
  }

  onEventsEnabled(): void {
    gwTooltips.hide();
    gwUtil.removeClass(".gw-click-overlay", "gw-disable-click");
  }

  onEventsDisabled(): void {
    gwUtil.addClass(".gw-click-overlay", "gw-disable-click");
    gwTooltips.hide();
  }

  /**
   * @public
   * Disable events globally. This includes mouse, keyboard, blur, focus.  Each call to this method will increment
   * an underlying lock counter.
   */
  disableEvents(): void {
    if (this.eventLockCount < 0) {
      gwUtil.devlog("WARNING: (disableEvents) Encountered unexpected event lock count (resetting to 0): " + this.eventLockCount);
      this.eventLockCount = 0;
    }

    if (this.eventLockCount === 0) {
      this.eventsEnabled = false;
      this.onEventsDisabled();
    }

    this.eventLockCount++;
  }

  /**
   * Indicates whether events are currently enabled.
   * @returns {boolean}
   */
  areEventsEnabled(): boolean {
    return this.eventsEnabled;
  }

  handleOnChangeMethod(onChangeMethod: string, node: GwDomNode, args: GwMap): void {
    const methodAndContext = this.findSystemAndMethod(onChangeMethod);
    methodAndContext?.execute(node, args);
  }

  private tempActiveId: string | null = null;

  private createPointerEvent(type: string, original: PointerEvent): PointerEvent {
    return new PointerEvent(type, original);
  }

  private createMouseEvent(type: string, original: MouseEvent): MouseEvent {
    return new MouseEvent(type, original);
  }

  // ========== METHODS OBJECT

  /**
   * @private
   * These methods should only be called as a result of a lookup inside of gw.event.onElementEvent
   * @type {{fireEvent: this.methods.fireEvent, addClass: this.methods.addClass, removeClass: this.methods.removeClass, addAndRemoveClass: this.methods.addAndRemoveClass, toggleClass: this.methods.toggleClass, openSubMenu: this.methods.openSubMenu, closeSubMenu: this.methods.closeSubMenu, toggleSubMenu: this.methods.toggleSubMenu, resetValue: this.methods.resetValue, page: this.methods.page}}
   */
  methods: GwTypedMap<GwAction> = {
    /**
     * This method fires the event inside of a setTimeout to ensure that the browser has a frame to render and update first
     * @param node
     * @param args
     * @param cbAfterClientFiresEventMethod - method fires inside the timeout after gwUtil.fireEvent is called.
     */
    fireEvent: (node: GwDomNode, args: GwMap, e?: GwEventType, cbAfterClientFiresEventMethod?: (node: GwDomNode, args: GwMap) => void) => {
      //TODO: temp hack to see about preventing flash highlighting in nav menu;
      if (gwUtil.hasClass(node, "gw-action--inner")) {
        const parentEl = $(node).parents(".gw-action--outer")[0];
        gwUtil.addClass(parentEl, "gw-event-temp-active");
        gwEvents.tempActiveId = parentEl.id;
      }

      gwEvents.disableEvents();

      setTimeout(() => {
        gwEvents.enableEvents();
        gwUtil.fireEvent(args.id + args.suffix);
        if (cbAfterClientFiresEventMethod) {
          cbAfterClientFiresEventMethod(node, args);
        }
      }, 0);
    },
    refresh: (node: GwDomNode, args: GwMap) => gwUtil.refresh(args.id),
    javascript: (node: GwDomNode, args: GwMap, event?: GwEventType) => {
      if (args.javascript) {
        // Simulate an "onxxx" handler call on the element
        const button = gwUtil.createEl("input", null, { type: "button", onclick: args.javascript });
        const nodeWithId = gwUtil.getSelfOrFirstParentWithAttr(node, "id") || node;
        button.onclick!.call(nodeWithId, event as MouseEvent);
      }
      gwMenus.closeAllMenus();
    },
    noOp: () => {
      /*noop*/
    },
    addClass: (node: GwDomNode, args: GwMap) => gwUtil.addClass(args.target || node, args.add),
    removeClass: (node: GwDomNode, args: GwMap) => gwUtil.removeClass(args.target || node, args.remove),
    addAndRemoveClass: (node: GwDomNode, args: GwMap) => gwUtil.addAndRemoveClasses(args.target || node, args.add, args.remove),
    toggleClass: (node: GwDomNode, args: GwMap) => gwUtil.toggleClass(args.target || node, args.toggle),
    toggleSubMenu: (node: GwDomNode, args: GwMap) => gwMenus.toggleSubMenu(args.target || node, args.eventType),
    toggleOnDemand: (node: GwDomNode, args: GwMap) => {
      //TODO: cannot find toggleOnDemand anywhere in js code, other than here
      //gwMenus.toggleOnDemand(args.target || node, args);
      throw new Error("This method no longer does anything after the Typescript conversion. Need to understand where the js went");
    },
    resetValue: (node: GwDomNode, args: GwMap) => {
      const val = args.reset;
      if (val === null || val === undefined) {
        gwUtil.devlog("WARNING: resetValue called for node with no data-gw-reset attribute", node);
      }

      const targetNode: HTMLInputElement = gwUtil.getDomNode(args.target || node) as HTMLInputElement;
      if (targetNode) {
        targetNode.value = val;
      }
    },
    unsavedWork: (node: GwDomNode, args: GwMap) => {
      const id = args.id + (args.go ? "_go" : args.goGroup ? "_goGroup" : "_discard");
      const unsavedWorkItem = args.go || args.discard || args.goGroup;
      gwUtil.unsavedWork(id, unsavedWorkItem);
    },
    logout: (node: GwDomNode, args: GwMap) => {
      gwEvents.methods.fireEvent(node, args);
    },
  };
}

export const gwEvents = new GwEvents();
