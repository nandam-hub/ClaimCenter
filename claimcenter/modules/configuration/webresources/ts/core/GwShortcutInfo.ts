/**
 * Shortcut info passed down from the server.
 *
 * Contains:
 *
 * + eventId and op type
 *   The eventId is used to identify the targeted widget for "openmenu" and "setfocus"
 * operations. It's also the event id sent to the server in the case of a "fireevent".
 *
 * + panel
 *   Panel represents which panel the shortcut key is defined in.  Only one shortcut for a given panel is active
 * at any given time (last shortcut registered wins).
 *
 * + key
 *   Key is the specific character associated with the shortcut along with any modifiers (e.g. Shift).
 * Key can also be set to 'ENTER' which is used when registering the default short cut for a given page
 * (see gwKeys.ts addServerKeyboardShortcut).
 *
 */
import {GwPanel} from "../types/gwTypes";

export class GwShortcutInfo {
  private readonly _eventId: string;
  private readonly _op: "fireevent" | "openmenu" | "setfocus";
  private readonly _panel: GwPanel;
  private readonly _key: string;

  constructor (initObj: any) {
    this._eventId = initObj.id;
    this._op = initObj.op;
    this._panel = initObj.panel;
    this._key = initObj.key;
  }

  get eventId (): string {
    return this._eventId;
  }

  get op (): "fireevent" | "openmenu" | "setfocus" {
    return this._op;
  }

  get panel (): GwPanel {
    return this._panel;
  }

  get key (): string {
    return this._key;
  }
}
