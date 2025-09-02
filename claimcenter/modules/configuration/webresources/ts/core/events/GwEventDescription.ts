import { GwDomNode, GwEventType } from "../../types/gwTypes";
import { gwUtil } from "../util/gwUtil";
import { gwEvents } from "./gwEvents";
import { GwKeyListener } from "./GwKeyListener";
import { gwKeys } from "./gwKeys";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwEventDescription extends GwKeyListener {
  eventTargetNode: GwDomNode | undefined;
  eventType: string = "";
  unnamedArgs: string = "";
  replacesClick: boolean = false;
  id: string = "";

  suffix: string = "";
  key: string = "";
  metaKey: boolean = false;
  ctrlKey: boolean = false;
  shiftKey: boolean = false;
  altKey: boolean = false;

  constructor(node: GwDomNode) {
    super("");
    this.eventTargetNode = node;
    this.id = node.getAttribute("id") || "";
  }

  static copy(source: GwEventDescription): GwEventDescription {
    const c = super.copy(source) as GwEventDescription;

    c.eventTargetNode = source.eventTargetNode;
    c.eventType = source.eventType;
    c.unnamedArgs = source.unnamedArgs;
    c.replacesClick = source.replacesClick;
    c.id = source.id;

    c.suffix = source.suffix;
    c.key = source.key;
    c.metaKey = source.metaKey;
    c.ctrlKey = source.ctrlKey;
    c.shiftKey = source.shiftKey;
    c.altKey = source.altKey;

    return c;
  }

  /**
   * @private
   * Takes the node and the event, and returns an event description object in the form of:
   * {eventTargetNode: node, methodName: Function, arg1: String, unnamedArgs: String etc }
   *
   * First looks on the node for matching gw-data-eventType attribute to parse. If we're not dealing
   * with a key event then that's it - if we found a matching attribute we're good otherwise we return
   * null.
   *
   * If the event is a key event then even if we have a matching attribute we have to check that it
   * applies to the particular key code in the event. And if the attribute doesn't match (or if we didn't
   * even find an attribute) we still have to check for special "reactor" key events plus server and
   * global keyboard shortcuts. If the current focus node is disabled then we only check for context/server/shortcuts
   * event description.
   *
   * @param node
   * @param e
   * @returns {Object}
   */
  static getEventDescription(node: GwDomNode, e: GwEventType, focusNodeDisabled: boolean): GwEventDescription | null {
    // We remap some event names here to match up with more generic terms the server uses, like key instead of keyup.
    const eventType = gwEvents.eventsMap[e.type] || e.type;
    //find if the node has an event attribute matching the triggered event
    let description =
      this.parseEventDescription(node, node.getAttribute(gwEvents.dataPrefix + eventType)) || this.createBasicEventDescription(node);
    //Persist the mapped eventType onto the description
    description.eventType = eventType;

    // If it's a key, then we are gonna check a bunch of stuff before we decide if there's a method or not
    if (description.eventType === "key") {
      const keyboardEvent: KeyboardEvent = e as KeyboardEvent;
      // If we received a key event, then either the node is focusable, or it is document.body. If it's
      // focusable then we've parsed its gw-data-key attribute (if any) into description, so first check
      // if the key specified in the description matches the event. If that fails then try, in sequence:
      // 1) The reactors list, which converts special keys (return/space) into actions on the target node
      // 2) The list of server keyboard shortcuts
      // 3) This list of global, hardcoded, shortcut
      const tempKeyCode = gwKeys.getKeyCode(keyboardEvent);
      let keyCode: string = "";
      if (tempKeyCode !== null) {
        keyCode = "" + tempKeyCode;
      }

      // Special Voodoo. If the keyCode property on the description is a list of keys separated by |
      // then we are going to break them up
      const multipleDescriptions: GwEventDescription[] = [];

      if (gwUtil.hasValue(description.keyCode)) {
        const possibleMultipleKeys = description.keyCode.split("|");
        if (possibleMultipleKeys.length > 1) {
          possibleMultipleKeys.forEach((key) => {
            const c = GwEventDescription.copy(description);
            c.key = c.keyCode = key; //TODO: I don't remember why these have key and keycode, but I don't want to mess with it right now
            multipleDescriptions.push(c);
          });

          description = multipleDescriptions[0];
        } else {
          multipleDescriptions.push(description);
        }
      }

      // We do this check here, even though we shouldnt have to, because chrome is not returning a key code on the login page,
      // for some reason we don't understand, so harden against it, since it's benign.
      if (gwUtil.hasValue(keyCode)) {
        keyCode = keyCode.toString();
      }

      let focusNodeEventDescription = null;
      // check for "widget specific" and "reactor" event description if the node is enabled.
      if (!focusNodeDisabled) {
        focusNodeEventDescription =
          this.descriptionFromKeyListener(gwKeys.findMatchingKeyListener(keyboardEvent, multipleDescriptions, keyCode), description) ||
          this.descriptionFromKeyListener(gwKeys.findMatchingKeyListener(keyboardEvent, gwKeys.genericKeyReactors, keyCode), description);
      }
      return (
        focusNodeEventDescription ||
        this.descriptionFromKeyListener(gwKeys.findClosestMatchingContextualKeyListener(keyboardEvent, node, keyCode), description) ||
        this.descriptionFromKeyListener(gwKeys.findMatchingServerShortcutKeyListener(keyboardEvent, keyCode), description) ||
        this.descriptionFromKeyListener(
          gwKeys.findMatchingKeyListener(keyboardEvent, gwKeys.globalShortcutKeyListeners, keyCode),
          description
        )
      );
    } else {
      return description.methodName ? description : null;
    }
  }

  /**
   * @private
   * Creates an initial event description containing the eventTargetNode, id and suffix fields.
   * @param node target of the event
   * @returns {{eventTargetNode: node, id: string, suffix: string}}
   */
  static createBasicEventDescription(node: GwDomNode): GwEventDescription {
    const evtDescription = new GwEventDescription(node);
    evtDescription.suffix = gwEvents.actionSuffix;
    return evtDescription;
  }

  /**
   * @private
   * Takes the node and a string describing an event and returns an event description object containing
   * the target node, the name of the method to be executed plus arguments to the method. Defines the
   * methodName as the first whole word it finds and then parses the remaining string. For example:
   * "fireEvent arg1:foo arg2:bar" would become {methodName: "fireEvent", arg1: "foo", arg2: "bar"}
   * where the colon is used to as the delimiter to determine key and value.
   *
   * If the string following the method name has no colon, then the entire string is returned as a
   * single unnamed argument, for example {unnamedArgs: wholeString}.
   *
   * By default sets the field "suffix" to the global action suffix and the field "id" to be the id of the
   * target node. These can be overridden by explicit arguments in the event string
   *
   * Returns null if the event string is null, undefined or empty
   *
   * @param node the target node of the event
   * @param eventString description of the event
   *
   * @returns {{eventTargetNode: node, id: string, suffix: string, methodName: string}}
   */
  static parseEventDescription(node: GwDomNode, eventString: string | null): GwEventDescription | null {
    if (!eventString || eventString === "") {
      return null;
    }
    const description = this.createBasicEventDescription(node);
    const firstSpaceIndex = eventString.indexOf(" ");
    if (firstSpaceIndex === -1) {
      description.methodName = eventString;
      return description;
    }

    description.methodName = eventString.substring(0, firstSpaceIndex);
    const totalStr = eventString.substring(firstSpaceIndex + 1);
    // The special "javascript" method just takes the remainder of the string as JavaScript to be executed
    if (description.methodName === "javascript") {
      (description as any)["javascript"] = totalStr;
      return description;
    }
    if (totalStr.indexOf(":") === -1) {
      // There is no colon in this arg string, so we assume it's a custom string for the method
      description.unnamedArgs = totalStr;
      return description;
    }
    let c, keyEnd, keyStart, i, valueStart, value, key;
    let valueEnd = totalStr.length;
    let lookingForKey = false;
    // This clumsy looking algorithm is just going to walk the string backwards pairing up argName: with trailing space separated args.
    // It's actually better time and memory than less clumsy looking ones, since javascript doesn't have incremental repeated regex capture groups.
    // So "toggle: class1 class2 class3 target: class4" becomes: map = {toggle: "class1 class2 class3", target: "class4"};
    for (i = totalStr.length - 1; i >= 0; i--) {
      c = totalStr[i];
      if (c === ":") {
        lookingForKey = true;
        valueStart = i + 1;
        keyEnd = i;
        continue;
      }
      if (i === 0 || (lookingForKey && c === " ")) {
        keyStart = i ? i + 1 : i;
        value = totalStr.substring(valueStart || 0, valueEnd);
        // We specifically look for the string 'null' to allow the server to prevent default client settings like action suffix
        value = value === "null" ? "" : value;
        key = totalStr.substring(keyStart, keyEnd);
        if (key === "id" && value === "^") {
          value = $(node).parents("[id]")[0].id;
        }
        (description as any)[key] = value;

        valueEnd = i;
        lookingForKey = false;
      }
    }
    // Just some silliness to allow for key related arguments to be specified in multiple forms, for
    // example either key:x or keyCode:x will result in keyCode:x in the parsed description
    description.keyCode = description.keyCode || description.key;
    description.shift = description.shift || description.shiftKey;
    description.alt = description.alt || description.altKey;
    description.ctrl = description.ctrl || description.ctrlKey;
    description.meta = description.meta || description.metaKey;
    return description;
  }

  /**
   * Given a key listener (or null) plus an initial event description return a completed event description
   * based on the key listener. Returns null if the key listener is null or if the listener cannot create
   * an event description.
   *
   * If the key listener just contains a method name, then the returned description will be the initial
   * description plus the method name and, possibly, enableDefault. If the key listener knows how to create
   * its own event description then that new description is returned.
   *
   * @param keyListener possibly null key listener
   * @param initialEventDescription event description containing at least target node and basic fields
   * @returns {*}
   */
  static descriptionFromKeyListener(
    keyListener: GwKeyListener | null,
    initialEventDescription: GwEventDescription
  ): GwEventDescription | null {
    let description: GwEventDescription | null = initialEventDescription;

    if (!keyListener) {
      return null;
    }

    if (keyListener.createEventDescription === "reactors") {
      description = keyListener.applyReactorsForKeyEvent(initialEventDescription.eventTargetNode!);
      if (!description) {
        return null;
      }
    } else if (keyListener.createEventDescription === "server") {
      description = keyListener.serverShortcut();
      if (!description) {
        return null;
      }
    } else {
      description.methodName = keyListener.methodName;
    }

    gwUtil.forEach(keyListener.eventDescriptionArgs, (val, key) => {
      if (!Object.prototype.hasOwnProperty.call(description, key)) {
        (description as any)[key] = val;
      }
    });

    description.enableDefault = keyListener.enableDefault;
    return description;
  }
}
