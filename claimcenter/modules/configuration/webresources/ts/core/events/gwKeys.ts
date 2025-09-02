import { GwDomNode, GwMap, GwPanel, GwShortcutOwner, GwTypedMap, GW_BREAKER } from "../../types/gwTypes";
import { GwShortcutInfo } from "../GwShortcutInfo";
import { GwInitializableSystem } from "../util/GwInitializableSystem";
import { gwUtil } from "../util/gwUtil";
import { GwEventDescription } from "./GwEventDescription";
import { gwEvents } from "./gwEvents";
import { GwKeyListener } from "./GwKeyListener";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwKeys extends GwInitializableSystem {
  getSystemName(): string {
    return "gwKeys";
  }

  /**
   * @private
   * Used to translate special characters to the equivalent keyCode
   */
  private readonly keyCodeMap: GwMap = {
    ";": 186,
    "=": 187,
    ",": 188,
    "-": 189,
    ".": 190,
    "/": 191,
    "`": 192,
    "[": 219,
    "\\": 220,
    "]": 221,
    "'": 222,
  };

  /**
   * @private
   * Used to map shortcut key words to keyCode for use with shortcuts
   */
  readonly shortcutKeyWordToKeyCodeMap: GwMap = {
    BACKSPACE: 8,
    COMMA: 188,
    DELETE: 46,
    DOWN: 40,
    END: 35,
    ENTER: 13,
    ESCAPE: 27,
    HOME: 36,
    LEFT: 37,
    PAGE_DOWN: 34,
    PAGE_UP: 33,
    PERIOD: 190,
    RIGHT: 39,
    SPACE: 32,
    TAB: 9,
    UP: 38,
  };

  /**
   * @private
   * Stores keyboard shortcuts sent down from the server via a client command. The shortcuts are stored
   * as a map of arrays where the keys to the map are scopes (MAIN/WORKSHEET) and the arrays contain the
   * actual listeners. The listeners have a createEventDescription function, which is called if a matching
   * key event is detected. This function searches for the widget with the id specified by the server and
   * finds its data-gw-click attribute (which may be directly on the element, or hidden in a sub element)
   * to determine the full event description
   * @type {Object}
   */
  private serverShortcutKeyListeners: GwMap = {};

  /**
   * We ignore any of these keycodes if they appear inside of the keyup event
   * @type {{16: boolean, 17: boolean, 18: boolean, 91: boolean, 93: boolean}}
   */
  readonly ignoredKeyCodes: GwMap = {
    16: true, // shift
    17: true, // ctrl
    18: true, // alt
    91: true, // left meta
    93: true, // right meta
  };

  /**
   * Used by getKeyCode. Converts any keycode into another keycode.
   * Handy for when browsers are misbehaving, or specifically to ensure that numpad keys are treated the same as digit keys
   * @return number
   */
  readonly convertedKeyCodes: GwMap = {
    96: 48, //numpad -> digits
    97: 49, //numpad -> digits
    98: 50, //numpad -> digits
    99: 51, //numpad -> digits
    100: 52, //numpad -> digits
    101: 53, //numpad -> digits
    102: 54, //numpad -> digits
    103: 55, //numpad -> digits
    104: 56, //numpad -> digits
    105: 57, //numpad -> digits
  };

  /**
   * If an element has focus and triggers a keyup event, this map will be used if the element doesn't explicitly
   * define a data-gw-keyup method So, for instance if an element has a data-gw-click method, then when keycode 13 fires (the
   * enter key) the on click method will fire. This is so we can implement things like space bar toggling radio
   * buttons, etc. These can also take shift, alt, ctrl, and meta key modifiers by setting shift: true,
   * alt: true, etc.
   */
  readonly genericKeyReactors: GwKeyListener[] = [];

  /**
   * Contextual key listeners, who only fire if they key combination was fired within an element of the given contextClass
   * See: registerContextualKeyListener
   * contextual key listeners are added to the front of the queue in order to allow customers to override existing functionality
   */
  readonly contextualKeyListeners: GwTypedMap<GwKeyListener[]> = {};

  /**
   * These global shortcuts are only evaluated if the the focused element does not listen to the given keycode.
   * These are processed for shift, alt, ctrl, and meta key modifiers, but historically the gw shortcuts only used
   * alt and shift
   *
   * call registerGlobalShortcutKeyListeners to add a new keylisteners. New key listeners are added to the front of the queue
   * in order to allow customers to override existing functionality.
   */
  readonly globalShortcutKeyListeners: GwKeyListener[] = [];

  init(isFullReload: boolean): void {
    if (isFullReload) {
      this.genericKeyReactors.push(new GwKeyListener("13").withReactors("click").useCreateEventDescription("reactors")); //Enter key
      this.genericKeyReactors.push(new GwKeyListener("32").withReactors("click").useCreateEventDescription("reactors")); // space bar

      this.registerGlobalShortcutKeyListeners(new GwKeyListener("37").withMethodName("gwNavigation.left").withEnableDefault());
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("38").withMethodName("gwNavigation.up").withEnableDefault());
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("39").withMethodName("gwNavigation.right").withEnableDefault());
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("40").withMethodName("gwNavigation.down").withEnableDefault());

      this.registerGlobalShortcutKeyListeners(
        new GwKeyListener("73").withShift().withAlt().withMethodName("gwInternalTools.showPcfStructure").withInternalTool() //i
      );
      this.registerGlobalShortcutKeyListeners(
        new GwKeyListener("87").withShift().withAlt().withMethodName("gwInternalTools.showFullPcfStructure").withInternalTool() //w
      );
      this.registerGlobalShortcutKeyListeners(
        new GwKeyListener("76").withShift().withAlt().withMethodName("gwInternalTools.reloadPCF").withInternalTool() //l
      );
      this.registerGlobalShortcutKeyListeners(
        new GwKeyListener("69").withShift().withAlt().withMethodName("gwInternalTools.editCurrentPageInStudio").withInternalTool() //e
      );
      this.registerGlobalShortcutKeyListeners(
          new GwKeyListener("65").withShift().withAlt().withMethodName("gwPrefPanel.immediatelyToggleShowInlineValueTypesAndRefresh").withInternalTool() //a
      );
      this.registerGlobalShortcutKeyListeners(
        new GwKeyListener("72").withShift().withAlt().withMethodName("gwApp.openShortcutHelp").withInternalTool() //h
      );
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("37").withShift().withAlt().withMethodName("gwNavigation.goWest"));
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("38").withShift().withAlt().withMethodName("gwNavigation.goNorth"));
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("39").withShift().withAlt().withMethodName("gwNavigation.goCenter"));
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("40").withShift().withAlt().withMethodName("gwNavigation.goSouth"));
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("27").withMethodName("gwEvents.escapeKeyPressed"));
      this.registerGlobalShortcutKeyListeners(new GwKeyListener("78").withShift().withAlt().withMethodName("gwMultiTab.newContextInNewTab")); //"n"
    }

    // Server keyboard shortcuts are parsed from the dom sent down by the server and are managed separately from global shortcuts.
    // As they are registered when traversing the dom, we need to reset them on every partial/full reload.
    this.clearServerKeyboardShortcuts();
  }

  /**
   * This could in theory be used elsewhere in the app, but I can't imagine where
   * Looks through the event to find one of the hundreds of possible locations various browsers store key codes
   * @param e
   * @returns {key code}
   */
  getKeyCode(e: KeyboardEvent): number | null {
    let keyCode;

    if (e.which !== undefined) {
      keyCode = e.which;
    } else if (e.keyCode !== undefined) {
      keyCode = e.keyCode;
    } else if (e.charCode !== undefined) {
      keyCode = e.charCode;
    } else if (e.key !== undefined) {
      keyCode = e.key;
    }
    if (keyCode === null || keyCode === undefined) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(gwKeys.convertedKeyCodes, "" + keyCode)) {
      keyCode = gwKeys.convertedKeyCodes[keyCode];
    }

    return +keyCode;
  }

  /**
   * Adds a contextual keylistener to the front of the queue, ensuring that is will be evaluated before existing listeners
   * This ensures that a customer can override any existing listeners
   * @param {string} contextClass
   * @param {GwKeyListener} keyListener
   */
  registerContextualKeyListener(contextClass: string, keyListener: GwKeyListener): void {
    let keyListeners: GwKeyListener[] | undefined = this.contextualKeyListeners[contextClass];

    if (!keyListeners) {
      keyListeners = [];
      this.contextualKeyListeners[contextClass] = keyListeners;
    }

    keyListeners.unshift(keyListener);
  }

  /**
   * Adds a keylistener to the front of the queue, ensuring that is will be evaluated before existing listeners
   * This ensures that a customer can override any existing listeners
   * @param {GwKeyListener} keyListener
   */
  registerGlobalShortcutKeyListeners(keyListener: GwKeyListener): void {
    this.globalShortcutKeyListeners.unshift(keyListener);
  }

  /**
   * Used by server side shortcuts to track down the target of the shortcut and return it
   */
  findServerShortcutKeyTarget(id: string): GwDomNode | null {
    const widgetNode = gwUtil.getDomNode("#" + id);

    if (!widgetNode || widgetNode.hasAttribute("data-gw-click") || widgetNode.hasAttribute("data-gw-key")) {
      return widgetNode;
    }

    let subWidgetNode = null;
    gwUtil.forEach($(widgetNode).find("[data-gw-click],[data-gw-key]"), (el) => {
      const attr = el.dataset.gwClick || el.dataset.gwKey;
      const description = GwEventDescription.parseEventDescription(el, attr);
      if (description && description.id === id) {
        subWidgetNode = el;
        return GW_BREAKER;
      }
      return; // Keep looking
    });
    return subWidgetNode;
  }

  addServerKeyboardShortcut(shortcutInfo: GwShortcutInfo): void {
    if (!shortcutInfo) {
      return;
    }

    let useAlt;
    let useShift;
    let keyCode;

    const useCtrl = false; // Control is not currently supported for server side keyShortcuts
    const shortcutScope = shortcutInfo.panel;
    let shortcutKey = shortcutInfo.key;
    shortcutKey = shortcutKey.toLocaleUpperCase();

    if (shortcutKey === "ENTER") {
      useAlt = false;
      useShift = false;
      keyCode = 13;
    } else {
      useAlt = true; // Alt is implicit for server defined shortcuts
      // Check for Shift modifier
      if (shortcutKey.indexOf("SHIFT") === 0) {
        useShift = true;
        shortcutKey = shortcutKey.replace("SHIFT", "");
      }
      keyCode = this.getShortcutToKeyCode(shortcutKey).toString();
    }

    const entry = new GwKeyListener("" + keyCode)
      .withServerEventId(shortcutInfo.eventId)
      .withShortcutKey(shortcutKey)
      .useCreateEventDescription("server")
      .withShortcutOpType(shortcutInfo.op);

    if (useShift) {
      entry.withShift();
    }

    if (useAlt) {
      entry.withAlt();
    }

    if (useCtrl) {
      entry.withCtrl();
    }

    this.serverShortcutKeyListeners[shortcutScope] = this.serverShortcutKeyListeners[shortcutScope] || [];

    // The scoped shortcut array is traversed from the start when finding a shortcut match.
    // Insert at the beginning of the array so when the same key  stroke resolves to multiple shortcuts,
    // the last registered shortcut wins.
    this.serverShortcutKeyListeners[shortcutScope].unshift(entry);
  }

  clearServerKeyboardShortcuts(): void {
    this.serverShortcutKeyListeners = {};
  }

  getServerKeyboardShortcutCharacters(): string[] {
    const characters: GwMap = {};
    if (this.serverShortcutKeyListeners) {
      Object.keys(this.serverShortcutKeyListeners).forEach((scope) => {
        this.serverShortcutKeyListeners[scope]
          .filter((shortcut: GwMap) => {
            // Only allow single character shortcuts.  Multichar shortcut keys are assumed to
            // be special shortcut keys - e.g. ENTER
            return shortcut.shortcutKey.length === 1;
          })
          .forEach((shortcut: GwMap) => {
            characters[shortcut.shortcutKey] = true;
          });
      });
    }

    return Object.keys(characters);
  }

  /**
   * Walks up the parent chain, checking each parent and returns the first one that:
   * 1. has the css context class for any registered contextual keylisteners
   * 2. matches the key listener event
   */
  findClosestMatchingContextualKeyListener(e: KeyboardEvent, node: GwDomNode, keyCode: string): GwKeyListener | null {
    const contextKeys = Object.keys(this.contextualKeyListeners);

    let matchedKeyListener: GwKeyListener | null = null;
    let targetNode = node;
    let safety = 999;

    while (!matchedKeyListener && targetNode && --safety > 0) {
      contextKeys.forEach((contextKey) => {
        if (gwUtil.hasClass(targetNode, contextKey)) {
          matchedKeyListener = this.findMatchingKeyListener(e, this.contextualKeyListeners[contextKey], keyCode);
        }
      });

      targetNode = targetNode.parentElement as GwDomNode;
    }

    return matchedKeyListener;
  }

  /**
   * Returns the keyCode of the associated shortcut.  First we check keycodes to see if there's a keycode
   * shortcut.  If we find no keycode match, we assume the shortcut is a single letter shortcut key.
   *
   * For a single letter shortcut key we usually return the ASCII character code.  However, the shortcut does
   * not always match the keyCode for a given character.  e.g. - the keycode for '.' is 190.  '.'.charCodeAt(0) is 46
   * @param shortcut
   * @returns {Number}
   */
  getShortcutToKeyCode(shortcut: string): string {
    return this.shortcutKeyWordToKeyCodeMap[shortcut] || this.keyCodeMap[shortcut] || shortcut.charCodeAt(0);
  }

  /**
   * Checks server shortcut keys and returns a key listener if it finds a match.
   * Checks current panel Scope to determine the priority of shortcut listeners.
   * If the current scope is South, center is never checked. If Center, south is never checked.
   *
   * @param e
   * @param keyCode
   */
  findMatchingServerShortcutKeyListener(e: KeyboardEvent, keyCode: string): GwKeyListener | null {
    const shortcutOwner = gwEvents.getCurrentShortcutOwner();

    if (shortcutOwner === GwShortcutOwner.SOUTH) {
      // If the owner is south, don't even check center panel for shortcuts
      return (
        this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.SOUTH], keyCode) ||
        this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.WEST], keyCode) ||
        this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.NORTH], keyCode)
      );
    }
    // If center, don't bother checking south
    if (shortcutOwner === GwShortcutOwner.CENTER) {
      return (
        this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.CENTER], keyCode) ||
        this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.WEST], keyCode) ||
        this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.NORTH], keyCode)
      );
    }

    // If current owner is null, then just run em all. This is important, because of the concept of contextArea,
    // which allows the user to click into a blank space, clearing focus, but still triggering shortcuts in priority based on where they clicked
    return (
      this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[shortcutOwner], keyCode) ||
      this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.CENTER], keyCode) ||
      this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.SOUTH], keyCode) ||
      this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.WEST], keyCode) ||
      this.findMatchingKeyListener(e, this.serverShortcutKeyListeners[GwPanel.NORTH], keyCode)
    );
  }

  /**
   * @private
   * Finds the first key listener that matches the given key event in the supplied array of key listener
   * objects, or returns null if none match. A key listener must have a keyCode and may have various other
   * flags such as alt, shift, ctrl, meta, internalTool and enableDefault.
   * @param e: the event
   * @param keyListeners: an array of objects to be matched via keyCode and modifier keys.
   * @param keyCode: the keyCode from the event.
   * @returns {object}
   */
  findMatchingKeyListener(e: KeyboardEvent, keyListeners: GwKeyListener[], keyCode: string): GwKeyListener | null {
    return this.findMatchingKeyListeners(e, keyListeners, keyCode, true)[0] || null;
  }

  /**
   * @private
   * Finds all key listeners, in order, that match the given key event in the supplied array of key listener
   * objects, or returns an empty array if none match. A key listener must have a keyCode and may have various other
   * flags such as alt, shift, ctrl, meta, internalTool and enableDefault.
   * @param e: the event
   * @param keyListeners: an array of objects to be matched via keyCode and modifier keys.
   * @param keyCode: the keyCode from the event.
   * @returns {object}
   */
  findMatchingKeyListeners(
    e: KeyboardEvent,
    keyListeners: GwKeyListener[],
    keyCode: string,
    returnOnFirstFound: boolean = false
  ): GwKeyListener[] {
    const results = [];
    if (keyListeners) {
      const shift = e.shiftKey;
      const alt = e.altKey;
      const ctrl = e.ctrlKey;
      const meta = e.metaKey;

      for (let i = 0; i < keyListeners.length; i++) {
        const entry = keyListeners[i];
        if (
          (!entry.internalTool || gwEvents.internalToolsEnabled()) &&
          !meta === !entry.meta &&
          !ctrl === !entry.ctrl &&
          !shift === !entry.shift &&
          !alt === !entry.alt &&
          keyCode === entry.keyCode
        ) {
          results.push(entry);
          if (returnOnFirstFound) {
            return results;
          }
        }
      }
    }

    return results;
  }
}

export const gwKeys = new GwKeys();
