import ErrorCallback = JQuery.Ajax.ErrorCallback;
import { GwForcedEvent } from "../core/events/GwForcedEvent";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwBreaker {}

export const GW_BREAKER = new GwBreaker();

export type GwNavigationPredicate = (node: GwDomNode, methodName: GwNavDirection, info: GwMap, event: GwEventType) => boolean;

export type GwMap = { [key: string]: any };
export type GwTypedMap<T> = { [key: string]: T };

export type GwNotNullNotUndefined = object | string | number | boolean | symbol;
export type GwValueWidgetElement = HTMLDivElement | HTMLSpanElement;
export type GwInputElement = HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement;
export type GwDomNode = GwValueWidgetElement | GwInputElement | HTMLOptionElement;
export type GwClassIdTagOrNode = string | GwDomNode;
export type GwContextNode = GwDomNode | HTMLDocument;
export type GwDomNodeList = GwDomNode[] | NodeListOf<Element> | JQuery | HTMLCollectionOf<Element>;
export type GwIterable = any[] | string | HTMLCollection | NodeList | JQuery | GwMap;
export type GwIterationCallback = (value: any, key: string, collection: GwIterable, mockIndex: number) => GwBreaker | void;
export type GwIterationMapper = (value: any, key: string, collection: GwIterable, mockIndex: number) => any;
export type GwEventType = Event | GwForcedEvent;
export type GwAction = (node: GwDomNode, args: GwMap, event?: GwEventType, optCb?: () => unknown) => void;
export type GwErrorCallback = ErrorCallback<void>;
export type GwEventListener = (this: HTMLElement, ev: Event) => boolean;

// Used when resolving what shortcuts to check.  When the shortcut owner is CENTER, shortcuts will be checked
// across the NORTH, WEST, and CENTER panels; shortcuts in the SOUTH panel are ignored.  When the shortcut owner is
// SOUTH, shortcuts in the NORTH, WEST, and SOUTH panels will be checked; shortcuts in the CENTER panel are ignored.
export const enum GwShortcutOwner {
  CENTER = "CENTER", // North, West and Center panels
  SOUTH = "SOUTH", // South, North and West panels
  NULL = "NULL",
}

export const enum GwPanel {
  NORTH = "N",
  SOUTH = "S",
  WEST = "W",
  CENTER = "C",
}

export const enum GwAjaxResponseStatus {
  OK,
  UNEXPECTED_RESPONSE,
  LOGOUT,
  DISPLAYABLE_ERROR,
  FATAL_ERROR,
  TIMEOUT,
}

/**
 * Methods return value corresponds to "should prevent default"
 */
export interface GwKeyboardNavigation {
  up(node: GwDomNode, info: GwMap, event: GwEventType): boolean;
  down(node: GwDomNode, info: GwMap, event: GwEventType): boolean;
  left(node: GwDomNode, info: GwMap, event: GwEventType): boolean;
  right(node: GwDomNode, info: GwMap, event: GwEventType): boolean;
}

export type GwNavDirection = "up" | "down" | "left" | "right";

export interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

export interface GwValueAndCursorPos {
  value: string;
  cursorPos: number;
}

export interface HTMLCheckboxElement extends HTMLInputElement {
  checked: boolean;
  defaultChecked: boolean;
  value: "on" | string;
  type: "checkbox";
}

export interface HTMLRadioElement extends HTMLInputElement {
  checked: boolean;
  defaultChecked: boolean;
  value: "on" | string;
  type: "radio";
}

export type HTMLCheckboxOrRadioElement = HTMLCheckboxElement | HTMLRadioElement;

export interface HTMLTextInputElement extends HTMLInputElement {
  type: "text" | "url" | "tel" | "search" | "password" | "email" | "number" | "date" | "datetime-local" | "hidden";
}

export interface HTMLFileInputElement extends HTMLInputElement {
  type: "file";
}

export enum GwPartialReloadReason {
  REPLACE_ITEMS,
  REPLACE_BODY,
  THEME_CHANGE,
  ERROR,
}

export interface GwPartialReloadDetails {
  readonly reason: GwPartialReloadReason;
  readonly ids?: string[];
}

export type GwPointerType = "mouse" | "pen" | "touch";
