import {GwDomNode, GwMap} from "../../types/gwTypes";
import {GwEventDescription} from "./GwEventDescription";
import {gwEvents} from "./gwEvents";
import {gwKeys} from "./gwKeys";
import {gwInputs} from "../inputs/gwInputs";
import {gwUtil} from "../util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwKeyListener {
  keyCode: string;

  internalTool: boolean = false;
  meta: boolean = false;
  ctrl: boolean = false;
  shift: boolean = false;
  alt: boolean = false;
  enableDefault: boolean = false;
  methodName: string | undefined = undefined;
  reactors: string[] | undefined = undefined;
  createEventDescription: undefined | "reactors" | "server";
  eventType: string = "key";
  eventDescriptionArgs: GwMap | undefined;

  shortcutKey: string | undefined;
  shortcutOpType: undefined | "fireevent" | "openmenu"| "setfocus";
  serverEventId: string | undefined;

  constructor (keyCode: string) {
    this.keyCode = keyCode;
  }

  static copy (source: GwKeyListener): GwKeyListener {
    const c = new GwKeyListener(source.keyCode);

    c.internalTool = source.internalTool;
    c.meta = source.meta;
    c.ctrl = source.ctrl;
    c.shift = source.shift;
    c.alt = source.alt;
    c.enableDefault = source.enableDefault;
    c.methodName = source.methodName;
    c.reactors = source.reactors ? source.reactors.slice(0) : undefined;
    c.createEventDescription = source.createEventDescription;
    c.eventType = source.eventType;
    c.shortcutKey = source.shortcutKey;
    c.shortcutOpType = source.shortcutOpType;
    c.serverEventId = source.serverEventId;
    c.eventDescriptionArgs = {...source.eventDescriptionArgs};

    return c;
  }

  handlesSameEvent (that: GwKeyListener): boolean {
    if (this === that) {
      return true;
    }

    return (
        this.meta === that.meta &&
        this.ctrl === that.ctrl &&
        this.shift === that.shift &&
        this.alt === that.alt &&
        this.eventType === that.eventType
    );
  }

  withServerEventId (id: string): this {
    this.serverEventId = id;
    return this;
  }

  withShortcutOpType (shortcutOpType: "fireevent" | "openmenu"| "setfocus"): this {
    this.shortcutOpType = shortcutOpType;
    return this;
  }

  withShortcutKey (key: string): this {
    this.shortcutKey = key;
    return this;
  }

  withMeta (): this {
    this.meta = true;
    return this;
  }

  withAlt (): this {
    this.alt = true;
    return this;
  }

  withInternalTool (): this {
    this.internalTool = true;
    return this;
  }

  withCtrl (): this {
    this.ctrl = true;
    return this;
  }

  withShift (): this {
    this.shift = true;
    return this;
  }

  withEnableDefault (): this {
    this.enableDefault = true;
    return this;
  }

  withMethodName (name: string): this {
    this.methodName = name;
    return this;
  }

  withReactors (...args: string[]): this {
    this.reactors = args;
    return this;
  }

  useCreateEventDescription (functionType: "reactors" | "server"): this {
    this.createEventDescription = functionType;
    return this;
  }

  /**
   * This map will me merged onto event descriptions created from this key listener
   * This effectively allows the the "info" args to be provided that normally would trail the "object.method" string
   * @param {GwMap} args
   * @returns {this}
   */
  withEventDescriptionArgs (args: GwMap): this {
    this.eventDescriptionArgs = args;
    return this;
  }

  /**
   * Function used by "reactor" key listeners, which map key presses to specific events (such as click)
   * on the target node. If the target node contains a data attribute containing an appropriate event
   * description then returns the parsed description, otherwise returns null.
   */
  applyReactorsForKeyEvent (el: GwDomNode): GwEventDescription | null {
    if (!this.reactors) {
      return null;
    }

    for (let i = 0; i < this.reactors.length; i++) {
      const reactor = this.reactors[i];
      // Don't turn spacebar into click in text inputs
      if (this.keyCode === "32" && reactor === "click" && gwInputs.isTextInputOrTextArea(el)) {
        continue;
      }

      // Don't turn enter into click in textareas
      if (this.keyCode === "13" && reactor === "click" && el.tagName === "textarea") {
        continue;
      }

      const dataAttr = gwEvents.dataPrefix + reactor;
      const description = GwEventDescription.parseEventDescription(el, el.getAttribute(dataAttr));
      if (description) {
        // Target node has a matching event description; return it
        description.eventType = "key";
        description.replacesClick = reactor === "click";
        return description;
      }
    }
    return null;
  }

  serverShortcut (): GwEventDescription | null {
    let method: string | undefined;
    let target: GwDomNode | null = null;
    let result: GwEventDescription | null = null;

    if (this.shortcutOpType === "openmenu") {
      target = gwUtil.getDomNode("#" + this.serverEventId);
      method = "gwMenus.toggleFromShortcut" + " target:#" + this.serverEventId;
    } else if (this.shortcutOpType === "setfocus") {
      target = gwUtil.getDomNode("#" + this.serverEventId);
      if (this.serverEventId === "QuickJump") {
        method = "gwEvents.quickJumpShortcutFired";
      } else {
        method = "gwEvents.forceFocus #" + this.serverEventId;
      }
    } else if (this.shortcutOpType === "fireevent") {
      target = gwKeys.findServerShortcutKeyTarget(this.serverEventId!);
      if (target) {
        method = target.dataset.gwClick || target.dataset.gwKey;
      }
    }

    if (target && method) {
      result = GwEventDescription.parseEventDescription(target, method);
    }

    if (result) {
      result.eventType = "key";
      result.replacesClick = true;
    }

    return result;
  }
}
