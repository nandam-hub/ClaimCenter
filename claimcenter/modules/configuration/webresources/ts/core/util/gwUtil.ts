/**
 * Catch-all for utility methods used by multiple systems.
 */
import { gwApp } from "../../plApp";
import {
  GwClassIdTagOrNode,
  GwContextNode,
  GwDomNode,
  GwDomNodeList,
  GwEventListener,
  GwInputElement,
  GwIterable,
  GwIterationCallback,
  GwIterationMapper,
  GwMap,
  GwNotNullNotUndefined,
  GwPartialReloadReason,
  GwTypedMap,
  GW_BREAKER,
} from "../../types/gwTypes";
import { gwEvents } from "../events/gwEvents";
import { gwKeys } from "../events/gwKeys";
import { gwPerfAnalyzer } from "../events/gwPerfAnalyzer";
import { gwAnimation } from "../gwAnimation";
import { gwDisplayKey } from "../gwDisplayKey";
import { gwFormSubmit } from "../gwFormSubmit";
import { gwPrefPanel } from "../gwPrefPanel";
import { gwAjax } from "./gwAjax";
import { GwRegisteredSystem } from "./GwRegisteredSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwUtil extends GwRegisteredSystem {
  readonly whitespaceRegex: RegExp = /[\s\u202F\u00A0]/g;
  readonly targetIdsToAnimate: string[] = [];
  readonly CSRF_PARAM_NAME: string = "csrfToken";
  private _isEdge: boolean | null = null;
  private _isInIframe: boolean | null = null;
  readonly MAX_UINT32_VAL: number = 0xffffffff; //4,294,967,295 (Uint32 valid range is 0 to 4,294,967,295)

  shallowCompare(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }

      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }

      return true;
    }

    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }

    if (typeof a === "object" && typeof b === "object") {
      const aKeys: string[] = Object.keys(a);
      const bKeys: string[] = Object.keys(b);

      if (aKeys.length !== bKeys.length) {
        return false;
      }

      for (let i = 0; i < aKeys.length; i++) {
        if (a[aKeys[i]] !== b[bKeys[i]]) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  isObjectOrFunction(val: any): val is object | Function {
    if (val === null || val === undefined) {
      return false;
    }

    const type = typeof val;
    return val !== null && (type === "object" || type === "function");
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  isFunction(val: any): val is Function {
    return typeof val === "function";
  }

  getSystemName(): string {
    return "gwUtil";
  }

  getUtilityInfo(id: string): string {
    const node = document.getElementById(id);
    if (!node) {
      return "";
    }
    if (node.hasAttribute("data-gw-info")) {
      return node.getAttribute("data-gw-info")!;
    } else if (node.hasAttribute("value")) {
      return node.getAttribute("value")!;
    } else {
      return "";
    }
  }

  getUtilityFlag(id: string): boolean {
    return "true" === this.getUtilityInfo(id);
  }

  getUtilityJson(id: string): any {
    const info = this.getUtilityInfo(id);
    return info ? JSON.parse(info) : null;
  }

  getSessionInfo(): { appId: string; isNew: boolean; userId: string, ownerTabId?: string, allowsMultiTab: boolean, sessionCount?: string } {
    return gwUtil.getUtilityJson("gw-sessionInfo");
  }

  getMultiTabInfo(): {ownerTabId: string | null, allowsMultiTab: boolean, sessionCount: number} {
    try {
      const {ownerTabId, allowsMultiTab, sessionCount} = this.getSessionInfo();
      return {allowsMultiTab, ownerTabId: ownerTabId || null, sessionCount: parseInt("" + sessionCount) || 1}
    } catch(e) {
      return {ownerTabId: null, allowsMultiTab: false, sessionCount: 1};
    }
  }

  onLoginPage(): boolean {
    const locObject = this.getDomNode(".gw-location-name");
    if (locObject) {
      const locName = locObject.getAttribute("data-gw-location-name");
      // If we are on the login page, then don't bother asking for a websocket
      if (locName && locName.indexOf("Login") > -1) {
        return true;
      }
    }
    return false;
  }

  hasUnsavedWork(): boolean {
    return this.getUtilityFlag("gw-hasUnsavedWork");
  }

  convertIfString(val: any): any {
    if (val === "true") {
      return true;
    }

    if (val === "false") {
      return false;
    }

    if (val === "undefined") {
      return undefined;
    }

    if (val === "null") {
      return null;
    }

    return val;
  }

  /**
   * ID for the current setTimeout method which will call resetEventThrottleCounterIfMaxNotHit
   * @type {number}
   * @private
   */
  private _eventThrottleId: number | null = null;
  /**
   * Tracks the number of calls to fireEvent, is reset by resetEventThrottleCounterIfMaxNotHit, or by the user correctly responding to the max throttle prompt
   * @type {number}
   * @private
   */
  private _eventThrottleCount: number = 0;
  private readonly EVENT_THROTTLE_EVALUATION_TIME_MS: number = 1000;

  private resetEventThrottleCounterIfMaxNotHit(): void {
    if (gwApp.EVENT_THROTTLE_MAX_REQUESTS_PER_SECOND && this._eventThrottleCount < gwApp.EVENT_THROTTLE_MAX_REQUESTS_PER_SECOND) {
      this._eventThrottleId = null;
      this._eventThrottleCount = 0;
    }
  }

  private userCorrectlyEnteredPromptForMaxThrottle(): boolean {
    let randomValue: string = ("" + this.getRandomFloatFrom0InclTo1Excl() * 100000).slice(0, 4);
    while (randomValue.length < 4) {
      randomValue = "0" + randomValue;
    }
    let promptInput = window.prompt(gwDisplayKey.get("Web.Client.Event.ThrottleWarning") + "\n" + randomValue);
    promptInput = gwUtil.hasValue(promptInput) ? promptInput.trim() : "";
    return promptInput === randomValue;
  }

  /**
   * Simple random using crypto.getRandomValues.
   * Returns a float value from 0 inclusive to 1 exclusive based on a scale of a randomly generated Uint32,
   * So the decimal specificity is based on 0 to 0xffffffff - 1
   */
  getRandomFloatFrom0InclTo1Excl(): number {
    const randomUint32 = (window.crypto || (window as any).msCrypto).getRandomValues(new Uint32Array(1))[0];

    if (randomUint32 < 0 || randomUint32 > this.MAX_UINT32_VAL) {
      throw new Error("Internal Error: invalid result of getRandomValues: " + randomUint32);
    }

    // This is just to call out that 0 isn't a problem, so folks don't have to wonder what 0/maxUint32Value would be
    if (randomUint32 === 0) {
      return randomUint32;
    }

    // Rejection sampling to avoid any possible bias against the max value which is excluded
    if (randomUint32 === this.MAX_UINT32_VAL) {
      return this.getRandomFloatFrom0InclTo1Excl();
    }

    const decimal = randomUint32 / this.MAX_UINT32_VAL;
    if (decimal < 0 || decimal >= 1) {
      throw new Error("Internal Error: unexpected decimal calculation: " + decimal);
    }

    return decimal;
  }

  /**
   * A range from min to max exceeding the maximum Uint32 value of 4,294,967,295 will throw an error.
   * @param minInc
   * @param maxExcl
   */
  getRandomInt(minIncl: number, maxExcl: number): number {
    if (minIncl === maxExcl) {
      throw new RangeError(`Invalid Arguments: minimum inclusive int value was equal to maximum exclusive value: ${maxExcl}`);
    }

    if (minIncl > maxExcl) {
      throw new RangeError(`Invalid Arguments: minimum ${minIncl} is greater than maximum ${maxExcl}`);
    }

    const range = maxExcl - minIncl;
    if (Math.abs(range) > this.MAX_UINT32_VAL) {
      throw new RangeError(`Invalid Arguments: range of ${minIncl} to ${maxExcl} is greater than 0xffffffff (4,294,967,295)`);
    }

    const randomFloat = this.getRandomFloatFrom0InclTo1Excl();

    const randomValue = Math.floor(range * randomFloat) + minIncl;
    if (randomValue < minIncl || randomValue >= maxExcl) {
      throw new Error(`Internal Error: min value: ${minIncl} && max value ${maxExcl} produced the random value: ${randomValue}`);
    }

    return randomValue;
  }

  /**
   * This is the core method by which the client triggers an event on the server.
   * It handles some client housekeeping, like disabling events and updating the progress bar.
   * It alo uses gwApp.EVENT_THROTTLE_REQUEST_MAX_PER_SECOND to handle server request throttling.
   *
   * @param id: the event id, including the suffix, most commonly _act.
   */
  fireEvent(id: string): void {
    // If throttle max has been set to a value greater than 0, then all the throttle logic will kick in
    if (gwUtil.hasValue(gwApp.EVENT_THROTTLE_MAX_REQUESTS_PER_SECOND) && gwApp.EVENT_THROTTLE_MAX_REQUESTS_PER_SECOND > 0) {
      // If there is not a threshold timer currently running, then start one
      if (this._eventThrottleId === null) {
        this._eventThrottleId = window.setTimeout(
          this.resetEventThrottleCounterIfMaxNotHit.bind(this),
          this.EVENT_THROTTLE_EVALUATION_TIME_MS
        );
      }

      // If we've counted a number of requests greater than the threshold max, within the threshold timer
      // Then we are going to prompt the user to continue
      if (this._eventThrottleCount++ >= gwApp.EVENT_THROTTLE_MAX_REQUESTS_PER_SECOND) {
        if (this.userCorrectlyEnteredPromptForMaxThrottle()) {
          this._eventThrottleCount = 0;
          window.clearInterval(this._eventThrottleId);
          this._eventThrottleId = null;
        } else {
          throw new Error(
            "Event throttle max count hit and user failed to enter correct prompt. This is likely because a physical key, like the enter key, is stuck or is being held. See gw.globals.gwApp.EVENT_THROTTLE_REQUEST_MAX_PER_SECOND."
          );
        }
      }
    }

    gwPerfAnalyzer.startRequest(id);
    gwEvents.disableEvents();
    gwApp.beforeEachFireEventToServer();

    this.setEventSource(id);
    gwFormSubmit(gwUtil.getDomNodeOrThrow("#gw-root-form") as HTMLFormElement);
    this.clearEventParam();
    gwPerfAnalyzer.requestSent();
  }

  /**
   * Calls the server to render children that weren't initially rendered, but are rendered as the result of
   * clicking on the element with the given id. This is how subMenuOnDemand is implemented. The server is
   * notified that the children of the element with the given id are needed and it responds with just the
   * HTML for those children. The new HTML is added into the DOM (or replaces existing HTML if the children
   * were already present for some reason). In the event of an error contacting the server the onError
   * handler is called so the caller can clean up any client side state.
   */
  renderDeferredChildren(id: string, onSuccess: () => void, onError: () => void): void {
    gwAjax.ajaxRequest(
      {
        __renderTarget: id,
      },
      (response: any) => {
        if (response.deferredTarget && (response.childContent || response.isEmptyContent)) {
          this.replaceDeferred(response.deferredTarget, response.childContent, response.isEmptyContent);
          onSuccess();
        } else if (response.targets) {
          this.replaceTargets(0, 0, 1, response.targets, false);
          onSuccess();
        } else {
          //TODO: @localize
          throw new Error("Invalid response to rerenderTarget, missing targets or deferredTarget and childContent: " + response);
        }
      },
      () => {
        this.replaceDeferred(id);
        onError();
      }
    );
  }

  showOnDemandElement(id: string, callback?: () => void): void {
    const idSelector = "#" + id;
    if (!this.getDomNode(idSelector)) {
      return;
    }
    gwEvents.disableEvents();
    gwAjax.ajaxRequest(
      { __onDemandElementId: id },
      (response: any) => {
        if (response.id === id) {
          this.replaceTarget(idSelector, response.content, false);
          gwEvents.addInlineEventListenersToDom(this.getDomNode(idSelector)!);
          gwEvents.enableEvents();
          if (callback) {
            callback();
          }
        }
      },
      () => {
        gwEvents.enableEvents();
      }
    );
  }

  hideOnDemandElement(id: string): void {
    const el = this.getDomNode("#" + id);
    if (el) {
      this.addClass(el, "gw-hidden");
      gwUtil.clearInnerHTML(el);
    }
  }

  freeze(obj: object): object {
    if (Object.freeze) {
      Object.freeze(obj);
    }

    return obj;
  }

  /**
   * If a widget has PostOnChange=true, this function will be called onChange()
   * Sends the current form to the server, with no specific action as the source.
   */
  refresh(id: string = ""): void {
    this.setEventParam("pocTrigger", id);
    this.fireEvent("_refresh_");
  }

  unsavedWork(id: string, unsavedWorkItem: string): void {
    this.setEventParam("unsavedWork", unsavedWorkItem);
    this.fireEvent(id);
  }

  setEventParam(name: string, value: string): void {
    const paramInput = $("#gw-event-param");
    paramInput.attr("name", name);
    paramInput.val(value);
  }

  clearEventParam(): void {
    const paramInput = $("#gw-event-param");
    paramInput.removeAttr("name");
    paramInput.val("");
  }

  private getGwEventSourceEl(): HTMLInputElement {
    const eventSourceEl = document.getElementById("gw-event-source") as HTMLInputElement | null;
    if (!eventSourceEl) {
      throw new Error("Unable to locate event source element");
    }

    return eventSourceEl
  }

  setEventSource(value: string): void {
    this.getGwEventSourceEl().value = value;
  }

  getEventSource(): string {
    return this.getGwEventSourceEl().value;
  }

  clearEventSource(): void {
    this.getGwEventSourceEl().value = "";
  }

  runAfterPageLoad(): void {
    if (gwApp.shouldFlash) {
      gwUtil.forEach(this.targetIdsToAnimate, (id: string) => {
        gwAnimation.addAnimation(id, "focus");
      });

      this.targetIdsToAnimate.length = 0;
    }

    gwEvents.possiblyFireQueuedClick();
  }


  private MIN_TIME_BETWEEN_REPLACE_TARGET_ERRORS: number = 4000;
  private previousReplaceTargetErrorTime: number = -1;
  /**
   * Work around to support Edge; during certain page transitions where a large number of DOM elements
   * get swapped quickly, the first element clicked loses it's global onClick.
   * @param classIdTagOrNode
   * @param newContent
   * @param errorOnMissingTarget: boolean, optional defaults to true. If true, will throw an error on missing target,
   * if false, will popup an alert with the display key Web.Client.Alert.MissingIdForDiff
   */
  replaceTarget(classIdTagOrNode: string | GwDomNode, newContent: string, errorOnMissingTarget: boolean = true): void {
    const targetElement = this.getDomNode(classIdTagOrNode);
    if (!targetElement) {
      const now = Date.now();
      if (now - this.previousReplaceTargetErrorTime > this.MIN_TIME_BETWEEN_REPLACE_TARGET_ERRORS ) {
        if (errorOnMissingTarget) {
          throw new Error("replaceTarget unable to find valid target from classIdTagOrNode");
        } else {
          window.alert(gwDisplayKey.get("Web.Client.Alert.MissingIdForDiff", classIdTagOrNode));
          this.devlog("Server response contained an element ID unknown to the client. This can be caused by the same user accessing the application from multiple browser windows or tabs. It can also be the result of manual DOM manipulation.",
              classIdTagOrNode)
        }
      }

      this.previousReplaceTargetErrorTime = now;

      return;
    }

    const $targetElement = $(targetElement);
    if (this.isEdge()) {
      // Edge has problems with onClick if we don't hide the old HTML before replacing it
      $targetElement.css("display", "none");
    }
    $targetElement.replaceWith(newContent);
  }

  cleanId(id: string): string {
    return "#" + id.replace(/(:|\.|\[|\]|,|=)/g, "\\$1");
  }

  replaceTargets(start: number, prog: number, inc: number, targets: GwDomNode[], errorOnMissingTarget: boolean = true): void {
    const max = start + gwApp.maxElementsToReplacePerFrame;
    let target;
    let id;
    const ids = [];

    for (let i = start; i < targets.length && i <= max; i++) {
      target = targets[i];
      ids.push(target.id);
      id = gwUtil.cleanId(target.id);
      this.replaceTarget(id, (target as any).content, errorOnMissingTarget); //TODO: what are these targets elements, or jquery elemetns
      if (gwApp.shouldFlash) {
        this.targetIdsToAnimate.push(id);
      }
      prog += inc;
      if (i === max) {
        window.setTimeout(() => gwUtil.replaceTargets(i, prog, inc, targets, errorOnMissingTarget), 0);
        return;
      }
    }

    gwApp.fireAfterPartialPageReload({ reason: GwPartialReloadReason.REPLACE_ITEMS, ids: ids });
  }

  private replaceDeferred(deferredTargetID: string, childContent?: string, isEmptyContent: boolean = false): void {
    const node = gwUtil.getDomNode(gwUtil.cleanId(deferredTargetID));
    if (node === null) {
      throw new Error("Unable to locate node for deferred replacement");
    }

    const deferredNode = gwUtil.getDomNode(".gw-deferred", node);
    const $deferredNode = $(deferredNode as Element);
    $deferredNode.empty();
    $deferredNode.removeClass("gw-deferred");

    if (isEmptyContent) {
      $deferredNode.append("<div class='gw-deferred-menuItem gw-deferred--empty'></div>");
    } else if (childContent) {
      // childContent will always be truthy if server responded.
      // It is only falsey if the content is actually empty (and in this case isEmptyContent==true)
      // or we got an error
      $deferredNode.append(childContent);
      gwEvents.addInlineEventListenersToContainer(node);
    }
  }

  /**
   * Helper for truthy falsey evals when all you care about is not null or undefined.
   * Common JS library method.
   * This is also a type guard via Generic T
   * @param thing
   * @returns {boolean} (not undefined not null)
   */
  hasValue<T extends GwNotNullNotUndefined>(thing: T | null | undefined): thing is T {
    return thing !== undefined && thing !== null;
  }

  convertAllWhitespaceToStandard(str: string): string {
    return str.replace(this.whitespaceRegex, " ");
  }

  /**
   * Reloads the client from cache without asking the server for any files.
   */
  reloadClient(): void {
    gwEvents.disableEvents();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.location.reload(false); //NOTE: this arg does nothing except in some versions of firefox
  }

  forceFullClientRefresh(): void {
    gwEvents.disableEvents();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.location.reload(true); //NOTE: this arg does nothing except in some versions of firefox
  }

  /**
   * Returns the element.dataset.dataSetProp if it exists, or if provided, a defaultValue, else an empty string
   * @param classIdTagOrNode
   * @param dataSetProp - camelCase property on the dataset object
   * @param defaultValue - optional return value if no matching property found
   * @returns {*}
   */
  getDatasetPropOrDefault(classIdTagOrNode: string | GwDomNode, dataSetProp: string, defaultValue: string = ""): string {
    const el = gwUtil.getDomNode(classIdTagOrNode);

    if (!el) {
      return defaultValue;
    }

    if (gwUtil.hasValue(el.dataset)) {
      return el.dataset[dataSetProp] || defaultValue;
    }

    return defaultValue;
  }

  private readonly UNIQUE_CHILD_CLASSES: string[] = ["gw-action--inner", "gw-action--expand-button"];

  /**
   * Given a dom element try to construct a selector that can be given to document.querySelector to return that
   * same element. This relies on some assumptions about our HTML. We assume any element id or name is unique.
   * Then for certain CSS classes we assume only one child with that class will appear under a parent with a
   * particular id (so we can use the parent id plus the class to uniquely identify the child).
   * @param {GwDomNode} node
   * @returns {string | null}
   */
  getUniqueSelector(node: GwDomNode): string | null {
    if (node.hasAttribute("id")) {
      return `#${node.id}`;
    } else if (node.hasAttribute("name")) {
      return `[name="${node.getAttribute("name")}"]`;
    } else if (node.parentElement && node.parentElement.hasAttribute("id")) {
      for (const c of this.UNIQUE_CHILD_CLASSES) {
        if (this.hasClass(node, c)) {
          return `#${node.parentElement.id} > .${c}`;
        }
      }
    }
    return null;
  }

  /**
   * @private
   * Used inside of getDomeNode and getDomNodes to select the correct method
   * @param classIdOrTag
   * @returns {}
   */
  private getElementsByString(classIdTagOrNode: GwClassIdTagOrNode, contextNode: GwContextNode = document): GwDomNodeList | null {
    if (typeof classIdTagOrNode === "string") {
      if (classIdTagOrNode[0] === "#") {
        const node = contextNode.querySelector(classIdTagOrNode);
        if (node === null) {
          return null;
        }

        return [node as GwDomNode];
      } else if (classIdTagOrNode[0] === ".") {
        return Array.prototype.slice.call(contextNode.getElementsByClassName(classIdTagOrNode.slice(1)), 0);
      } else {
        return Array.prototype.slice.call(contextNode.getElementsByTagName(classIdTagOrNode), 0);
      }
    }
    return [classIdTagOrNode];
  }

  /**
   * @public
   * Returns a collection. Always. Even if passing in dom node or an id or an HTMLCollection.
   * @param classIdTagOrNode: class, id, or tag string, or
   * @returns {collection of DOM Nodes}
   */
  getDomNodes(classIdTagOrNode: GwClassIdTagOrNode | GwDomNodeList, contextNode: GwContextNode = document): GwDomNodeList {
    if (!classIdTagOrNode) {
      return [];
    }

    if (typeof classIdTagOrNode === "string" || classIdTagOrNode instanceof Element) {
      return this.getElementsByString(classIdTagOrNode, contextNode) || [];
    }

    return classIdTagOrNode;
  }

  /**
   * @public
   * Returns a single Dom Node
   * @param classIdTagOrNode: class string, id string, tag string, or if it's a node, it gets passed right back.
   * @contextNode the node too search within
   * @returns {DOM Node}
   */
  getDomNode<T extends GwDomNode = GwDomNode>(classIdTagOrNode: GwClassIdTagOrNode, contextNode: GwContextNode = document): T | null {
    if (!classIdTagOrNode) {
      return null;
    }

    const vals = this.getElementsByString(classIdTagOrNode, contextNode);

    if (vals === null || vals === undefined) {
      return null;
    }

    return (vals[0] as T) || null;
  }

  getDomNodeOrThrow<T extends GwDomNode = GwDomNode>(classIdTagOrNode: GwClassIdTagOrNode, contextNode: GwContextNode = document): T {
    const node = this.getDomNode<T>(classIdTagOrNode, contextNode);
    if (!node) {
      throw new Error("Unable to locate a matching node for: " + classIdTagOrNode);
    }

    return node;
  }

  getInputElement(classIdTagOrNode: GwClassIdTagOrNode, contextNode: GwContextNode = document): GwInputElement | null {
    return this.getDomNode(classIdTagOrNode, contextNode) as GwInputElement | null;
  }

  /**
   * @public
   * @param attr - String: html dom attribute
   * @param optValue - any, if undefined, then checks for the presence of the attribute, if defined then checks against the value
   * @param optParent - DOM Element, if undefined, then uses the document.
   * @returns {Element || null}
   */
  getDomNodeByAttr(attr: string, optValue?: string, optParent: GwContextNode = document): GwDomNode | null {
    if (optValue === undefined) {
      return optParent.querySelector("[" + attr + "]");
    }

    return optParent.querySelector("[" + attr + "='" + optValue + "']");
  }

  getDomNodeByName(nameValue: string, optParent: GwContextNode = document): GwDomNode | null {
    return this.getDomNodeByAttr("name", nameValue, optParent);
  }

  getDomNodesByName(nameValue: string, optParent: GwContextNode = document): NodeListOf<HTMLElement> {
    return this.getDomNodesByAttr("name", nameValue, optParent);
  }

  /**
   * @public
   * @param attr - String: html dom attribute
   * @param optValue - any, if undefined, then checks for the presence of the attribute, if defined then checks against the value
   * @param optParent - DOM Element, if undefined, then uses the document.
   * @returns {NodeList || null}
   */
  getDomNodesByAttr(attr: string, optValue?: string, optParent: GwContextNode = document): NodeListOf<HTMLElement> {
    if (optValue === undefined) {
      return optParent.querySelectorAll("[" + attr + "]");
    }

    return optParent.querySelectorAll("[" + attr + "='" + optValue + "']");
  }

  /**
   * @public
   * Removes a dom node from the parent if one exists
   * @param classIdTagOrNode: class string, id string, tag string, or a node that identifies the node to be removed.
   * @param contextNode the node from which to remove the child
   */
  removeNodeIfExists(classIdTagOrNode: GwClassIdTagOrNode, parentNode?: GwContextNode): void {
    const node = gwUtil.getDomNode(classIdTagOrNode, parentNode || document);
    if (node) {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      } else if (parentNode) {
        parentNode.removeChild(node);
      }
    }
  }

  removeNode(node: GwDomNode | Node | null): void {
    if (!node || !node.parentNode) {
      return;
    }

    node.parentNode.removeChild(node);
  }

  getSelfOrFirstParentWithTag<T extends keyof HTMLElementTagNameMap>(self: GwDomNode | null, tag: T): HTMLElementTagNameMap[T] | null {
    let el: GwDomNode | null = self;
    let safety = 100;
    while (el && safety--) {
      if (!el || (el.classList && el.classList.contains("gw-body"))) {
        return null;
      }
      if (el.tagName && el.tagName.toLowerCase() === tag) {
        return el as HTMLElementTagNameMap[T];
      }
      el = el.parentElement as GwDomNode;
    }
    return null;
  }

  getSelfOrFirstParentWithClass(self: GwDomNode | null, cssClass: string, limitParentLookups: number = 100): GwDomNode | null {
    let el: GwDomNode | null = self;
    cssClass = cssClass.replace(".", "");
    let safety = limitParentLookups;
    while (el && safety--) {
      if (!el || (el.classList && el.classList.contains("gw-body"))) {
        return null;
      }
      if (el.classList && el.classList.contains(cssClass)) {
        return el;
      }
      el = el.parentElement as GwDomNode;
    }
    return null;
  }

  getSelfOrFirstParentWithClassOrThrow(self: GwDomNode | null, cssClass: string): GwDomNode {
    const found = this.getSelfOrFirstParentWithClass(self, cssClass);
    if (!found) {
      throw new Error("Unable to locate matching node");
    }

    return found;
  }

  getSelfOrFirstParentWithAttr(self: GwDomNode, attr: string, limitParentLookups: number = 100): GwDomNode | null {
    let el: GwDomNode | null = self;
    let safety = limitParentLookups;
    while (el && safety--) {
      if (!el || (el.classList && el.classList.contains("gw-body"))) {
        return null;
      }
      if (el.hasAttribute(attr)) {
        return el;
      }
      el = el.parentElement as GwDomNode;
    }
    return null;
  }

  getSelfOrFirstParentMatchingOneOfSelectors(
    self: GwDomNode,
    selectorOrArrOfSelectors: string[] | string,
    limitParentLookups: number = 100
  ): GwDomNode | null {
    if (!Array.isArray(selectorOrArrOfSelectors)) {
      selectorOrArrOfSelectors = [selectorOrArrOfSelectors];
    }

    let el: GwDomNode | null = self;
    let safety = limitParentLookups;
    while (el && safety--) {
      if (!el || (el.classList && el.classList.contains("gw-body"))) {
        return null;
      }

      for (let i = 0; i < selectorOrArrOfSelectors.length; i++) {
        if (el.matches(selectorOrArrOfSelectors[i])) {
          return el;
        }
      }

      el = el.parentElement as GwDomNode;
    }
    return null;
  }

  /**
   * @public
   * Returns true if the given node is disabled via either the aria-disabled or the disabled attribute
   * @param {GwClassIdTagOrNode} classIdTagOrNode node, or identifying class, id or tag string
   * @returns {boolean}
   */
  isDisabled(classIdTagOrNode: GwClassIdTagOrNode): boolean {
    const el = gwUtil.getDomNode(classIdTagOrNode);
    return this.hasValue(el) && (el.getAttribute("aria-disabled") === "true" || el.hasAttribute("disabled"));
  }

  /**
   * @public
   * Returns true or false based on the presence of a css class on the first result of gwUtil.getDomNodes
   * @param classIdTagOrNode: the argument to be passed to getDomNodes
   * @param classToCheck: css class
   * @returns {boolean}
   */
  hasClass(classIdTagOrNode: GwClassIdTagOrNode, classToCheck: string): boolean {
    const el = gwUtil.getDomNode(classIdTagOrNode);
    if (el && el.classList) {
      const re = /\./g; //TODO: cooper, make sure that older browsers like IE11 are smart enough to cache inline regex instantiation, if not, we should pull them out into the parent.
      return el.classList.contains(classToCheck.replace(re, ""));
    }
    return false;
  }

  /**
   * @public
   * Returns true or false based on the presence of at least one css class on the first result of gwUtil.getDomNodes
   * @param classIdTagOrNode: the argument to be passed to getDomNodes
   * @param classesToCheck: css classes to check
   * @returns {boolean}
   */
  hasAnyClass(classIdTagOrNode: GwClassIdTagOrNode, classesToCheck: string[]): boolean {
    const el = gwUtil.getDomNode(classIdTagOrNode);
    if (el && el.classList) {
      const re = /\./g; //TODO: cooper, make sure that older browsers like IE11 are smart enough to cache inline regex instantiation, if not, we should pull them out into the parent.
      for (let i = 0; i < classesToCheck.length; i++) {
        if (el.classList.contains(classesToCheck[i].replace(re, ""))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @public
   * Toggles a css class on the results of getDomNodes for classIdTagOrNode
   * @param classIdTagOrNode: the argument to be passed to getDomNodes
   * @param classToToggle: css class
   */
  toggleClass(classIdTagOrNode: GwClassIdTagOrNode | GwDomNodeList, classToToggle: string): void {
    const els = gwUtil.getDomNodes(classIdTagOrNode);
    const re = /\./g;
    classToToggle = classToToggle.replace(re, "");

    gwUtil.forEachReverse(els, (el) => {
      if (el) {
        if (el.classList) {
          el.classList.toggle(classToToggle);
        } else {
          gwUtil.devlog("WARNING: called toggle class on element without classList support. This is likely an IE11 issue.", el);
        }
      }
    });
  }

  /**
   * @public
   * Ensures the presence of a the provided class based on the condition. If condition is true, adds the class,
   * if condition is false removes the class from the the target.
   * @param condition
   * @param classIdTagOrNode
   * @param classStrOrArrayOfStr
   */
  conditionalAddRemoveClass(
    condition: any,
    classIdTagOrNode: GwClassIdTagOrNode | GwDomNodeList,
    classStrOrArrayOfStr: string | string[]
  ): void {
    condition = gwUtil.convertIfString(condition);
    if (condition) {
      this.addClass(classIdTagOrNode, classStrOrArrayOfStr);
    } else {
      this.removeClass(classIdTagOrNode, classStrOrArrayOfStr);
    }
  }

  conditionalAddRemoveAttr(condition: any, classIdTagOrNode: GwClassIdTagOrNode | GwDomNodeList, key: string, value: string): void {
    condition = gwUtil.convertIfString(condition);
    if (!this.hasValue(value)) {
      value = "";
    } else {
      value = "" + value;
    }

    this.forEachReverse(this.getDomNodes(classIdTagOrNode), (node: GwDomNode) => {
      if (condition) {
        node.setAttribute(key, value);
      } else {
        node.removeAttribute(key);
      }
    });
  }

  /**
   * @private
   * Private method called by addClass and removeClass
   */
  private abstractAddRemoveClass(
    addOrRemove: "add" | "remove",
    classIdTagOrNode: GwClassIdTagOrNode | GwDomNodeList,
    classStrOrArrayOfStr: string | string[]
  ): void {
    if (typeof classStrOrArrayOfStr === "string") {
      classStrOrArrayOfStr = classStrOrArrayOfStr.split(" ");
    }

    const re = /\./g;
    const classes = [];
    const els = gwUtil.getDomNodes(classIdTagOrNode);

    for (let i = 0; i < classStrOrArrayOfStr.length; i++) {
      if (!classStrOrArrayOfStr[i]) {
        continue;
      }
      classes.push(classStrOrArrayOfStr[i].replace(re, ""));
    }

    // Note: we have to walk backwards over this list, as an HTML Node list is live, and if we modify the classes it could change contents
    for (let i = els.length - 1; i >= 0; i--) {
      const el = els[i];
      if (!el) {
        continue;
      }

      if (!el.classList) {
        gwUtil.devlog("WARNING: called add/remove class on element without classList support. This is likely an IE11 issue.", el);
        continue;
      }

      for (let j = 0; j < classes.length; j++) {
        el.classList[addOrRemove](classes[j]); //NOTE: IE11 does not support adding removing via array, so have to iterate
      }
    }
  }

  /**
   * @public
   * adds a css class or array of classes onto the results of getDomNodes for classIdTagOrNode
   * @param classIdTagOrNode: the argument to be passed to getDomNodes
   * @param classStrOrArrayOfStrToAdd: css class string, or array of classes
   */
  addClass(classIdTagOrNode: GwClassIdTagOrNode | GwDomNodeList, classStrOrArrayOfStrToAdd: string | string[]): void {
    this.abstractAddRemoveClass("add", classIdTagOrNode, classStrOrArrayOfStrToAdd);
  }

  /**
   * @public
   * removes a css class or array of classes from the results of getDomNodes for classIdTagOrNode
   * @param classIdTagOrNode: the argument to be passed to getDomNodes
   * @param classStrOrArrayOfStrToRemove: css class string, or array of classes
   */
  removeClass(classIdTagOrNode: GwClassIdTagOrNode | GwDomNodeList, classStrOrArrayOfStrToRemove: string | string[]): void {
    this.abstractAddRemoveClass("remove", classIdTagOrNode, classStrOrArrayOfStrToRemove);
  }

  /**
   * @public
   * Helper method for calling addClass and removeClass. Especially handy when inlining.
   * @param classIdTagOrNode: the argument to be passed to getDomNodes
   * @param classStrOrArrayOfStrToAdd: css class string, or array of classes
   * @param classStrOrArrayOfStrToRemove: css class string, or array of classes
   */
  addAndRemoveClasses(
    classIdTagOrNode: GwClassIdTagOrNode,
    classStrOrArrayOfStrToAdd: string | string[],
    classStrOrArrayOfStrToRemove: string | string[]
  ): void {
    const collection = gwUtil.getDomNodes(classIdTagOrNode);
    gwUtil.addClass(collection, classStrOrArrayOfStrToAdd);
    gwUtil.removeClass(collection, classStrOrArrayOfStrToRemove);
  }

  appendEl(parentClassIdTagOrNode: GwClassIdTagOrNode, childClassIdTagOrNode: GwClassIdTagOrNode): void {
    const newParent = gwUtil.getDomNode(parentClassIdTagOrNode);
    const children = gwUtil.getDomNodes(childClassIdTagOrNode);
    if (!newParent || !children) {
      throw new Error("appendEl could not find parent or child matching the given arguments.");
    }

    gwUtil.forEach(children, (child: GwDomNode) => {
      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }
      newParent.appendChild(child);
    });
  }

  /**
   * Escape any special characters in the given string so they will not be used as special regular expression
   * characters. For example "." will become "\."
   * @param {string} s the string to be escaped
   * @returns {string} the escaped string
   */
  escapeForRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
  }

  /**
   * @public
   * noop
   */
  noop(): void {
    // NOOP
  }

  /**
   * @public
   * @debug logs the arguments if gwApp.showDevLogs is true;
   * Does not need to be localized.
   * @param str: some string
   * @param obj: optional, logged directly to the console, not string converted
   */
  devlog(str: string, obj?: any): void {
    if (gwApp.showDevLogs) {
      this.internalLog(str, obj);
    }
  }

  eventLog(str: string, obj?: any): void {
    if (gwApp.showEventLogs) {
      this.internalLog(str, obj);
    }
  }

  private internalLog(str: string, obj?: any): void {
    if (obj === undefined || obj === null) {
      console.log(str);
    } else {
      console.log(str, obj);
    }

    if (gwApp.showTraceInLogs) {
      console.log(this.getTrace(2));
    }
  }

  private getTrace(framesToOmit: number = 1): string {
    let trace = "";
    try {
      (null as any).toString(); // Force exception, but in way that doesn't upset TSLint
    } catch (e: unknown) {
      trace = (e as Error).stack || "";
    }
    if (!trace) {
      return "unknown stacktrace";
    }
    const splitTrace = trace.split("\n");
    // Always remove top 2 items - fake exception text and getTrace frame - plus some number of caller frames
    return splitTrace.slice(2 + framesToOmit).join("\n");
  }

  /**
   * TODO: write mocha tests
   * @param {(string | number)[]} arr
   * @returns {GwTypedMap<string>}
   */
  convertKeyValueArrayToMap(arr: any[]): GwMap {
    const map: GwMap = {};

    for (let i = 0; i < arr.length; i += 2) {
      map[arr[i]] = arr[i + 1];
    }

    return map;
  }

  /**
   * TODO: write mocha tests
   * @param {GwDomNodeList | any[]} arr
   * @returns {any[]}
   */
  copyArrayLike(arr: GwDomNodeList | any[]): any[] {
    const finalArr: any[] = [];
    gwUtil.forEach(arr, (val) => finalArr.push(val));

    return finalArr;
  }

  isIndexIterable(coll: any): coll is string | any[] | HTMLCollection | NodeList | JQuery {
    if (coll === null || coll === undefined) {
      return false;
    }
    return (
      coll.forEach !== undefined ||
      coll.each !== undefined ||
      Array.isArray(coll) ||
      typeof coll === "string" ||
      coll instanceof NodeList ||
      coll instanceof HTMLCollection
    );
  }

  /**
   * @public
   * Takes any collection, object, array, or even more useful, HTMLNodeCollections, etc.
   * @param coll: object or array, or array-like.
   * @param cb: a function with signature cb(value, indexOrKey, collection, (mockIndex). Where mockIndex is the current count of
   * values processed on a non-array. return false inside the callback explicitly to break the loop;
   */
  forEach(coll: GwIterable | undefined | null, cb: GwIterationCallback): void {
    if (!coll) {
      return;
    }

    if (this.isIndexIterable(coll)) {
      for (let i = 0; i < coll.length; i++) {
        if (cb(coll[i], "" + i, coll, i) === GW_BREAKER) {
          return;
        }
      }
    } else if (typeof coll === "object") {
      let mockIndex = -1;
      for (const key in coll) {
        if (!Object.prototype.hasOwnProperty.call(coll, key)) {
          continue;
        }

        mockIndex++;
        if (cb(coll[key], key, coll, mockIndex) === GW_BREAKER) {
          return;
        }
      }
    }
  }

  map(coll: GwIterable | undefined | null, mapper: GwIterationMapper): any[] {
    const finalVals: any[] = [];

    gwUtil.forEach(coll, (val: any, key: any, iColl: any, mock: any) => {
      finalVals.push(mapper(val, key, iColl, mock));
    });

    return finalVals;
  }

  mapFilterUndefined(coll: GwIterable | undefined | null, mapper: GwIterationMapper): any[] {
    const finalVals: any[] = [];

    gwUtil.forEach(coll, (val: any, key: any, iColl: any, mock: any) => {
      const mappedVal = mapper(val, key, iColl, mock);
      if (mappedVal !== undefined) {
        finalVals.push(mappedVal);
      }
    });

    return finalVals;
  }

  /**
   * @public
   * same as forEach, but reversed. In the case of objects, there's an extra build from Object.keys, which is then
   * iterated over backwards.
   * @param coll: object or array, or array-like.
   * @param cb: a function with signature cb(value, indexOrKey, collection, (mockIndex). Where mockIndex is the current count of
   * values processed on a non-array. return false inside the callback explicitly to break the loop;
   */
  forEachReverse(coll: GwIterable, cb: GwIterationCallback): void {
    if (!coll) {
      return;
    }

    if (this.isIndexIterable(coll)) {
      for (let i = coll.length - 1; i >= 0; i--) {
        if (cb(coll[i], "" + i, coll, i) === GW_BREAKER) {
          return;
        }
      }
    } else if (typeof coll === "object") {
      const keys = Object.keys(coll);
      for (let mockIndex = keys.length - 1; mockIndex >= 0; mockIndex--) {
        const key = keys[mockIndex];
        if (cb(coll[key], key, coll, mockIndex) === GW_BREAKER) {
          return;
        }
      }
    }
  }

  /**
   * Helper method to create a div via lists of classes attributes and styles.
   * This should be used sparingly, as Pebbles is a server side rendererd system, so any client side generated elements
   * will need to be regenerated and re-added to the dom after any page load, full or partial.
   * This is most commonly used by client side systems to add MenuItems to the settings dropdown.
   * @param classes - String as single class or array of strings.
   * @param attributes - Object: key value pairs for inline attributes, including 'id'. Pass empty string value if no value needed.
   * @param styles - Object: key value pairs for inline styles.
   * @param label - if provided, then div.innerHTML = label is called.
   * @returns {DOMElement: DIV}
   */
  createDiv(
    classes?: string | string[] | null,
    attributes?: GwTypedMap<string | number | boolean>,
    styles?: GwTypedMap<string>,
    label?: string,
    children?: GwDomNodeList
  ): HTMLDivElement {
    return this.createEl("div", classes, attributes, styles, label, children);
  }

  createDivWithId(elementId: string, children?: GwDomNodeList): HTMLDivElement {
    const id = elementId.replace("#", "");
    return this.createDiv(null, { id }, undefined, undefined, children);
  }

  createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    classes?: string | string[] | null,
    attributes?: GwTypedMap<string | number | boolean>,
    styles?: GwTypedMap<string>,
    label?: string,
    children?: GwDomNodeList
  ): HTMLElementTagNameMap[K] {
    const el: HTMLElement = document.createElement(tag);

    if (classes) {
      this.addClass(el, classes);
    }

    this.forEach(attributes, (value, key) => {
      el.setAttribute(key, "" + value);
    });

    this.forEach(styles, (value, key) => {
      if (!this.hasValue(value)) {
        return;
      }

      el.style.setProperty(key, value);
    });

    if (label) {
      el.textContent = label;
    }

    this.forEach(children, (child) => (child ? el.appendChild(child) : null));

    return el as HTMLElementTagNameMap[K];
  }

  /**
   * Detects whether we're running Edge.
   * @returns {boolean} Returns true if Edge else false
   */
  isEdge(): boolean {
    if (this._isEdge === null) {
      this._isEdge = !!navigator.userAgent.match(/Edge\//);
    }

    return this._isEdge;
  }

  /**
   * Detects whether the application is loaded via an iframe element
   * @returns {boolean} true if loaded via iframe
   */
  isInIframe(): boolean {
    const mockLauncher = gwPrefPanel.getPrefValueByPrefName("loadInMockLauncher");
    if (mockLauncher) {
      this._isInIframe = true;
    }

    if (this._isInIframe === null) {
      try {
        this._isInIframe = window.self !== window.top;
      } catch (e) {
        this._isInIframe = true;
      }
    }

    return this._isInIframe;
  }

  /**
   * @private
   * Generates a span containing an accessKey for each server shortcut key to allow shortcut keys to work
   * in IE (See comment for disableIEShortcuts below).
   * @returns {string} HTML span containing an accessKey entry for each server shortcut
   */
  private generateIEShortcutWorkAround(): string {
    const workAroundTargets = gwKeys.getServerKeyboardShortcutCharacters();
    let str = "<span id='gw-ie-shortcut-links' style='position:absolute'>";
    str += workAroundTargets
      .map((target: string) => {
        return '<a accessKey="' + target + '" href="javascript:void(0)" data-gw-refuse-focus tabIndex="-1"></a>';
      })
      .join("");

    str += "</span>";

    return str;
  }

  /**
   * Fire a custom event on the body of the document. The event is created with the given name and the detail
   * object can be used to pass information useful to listeners, who can access it via event.detail
   * @param eventName the name of the custom event
   * @param detail object containing further details of the event
   */
  fireCustomEvent(eventName: string, detail: GwMap): void {
    let event;

    event = new CustomEvent(eventName, { detail: detail });

    document.body.dispatchEvent(event);
  }

  /**
   * Essentially a bypass for using dangerouslySetInnerHTML to just clear contents
   * Setting innerHTML to an empty string is always safe, but we use this because the linter can't distinguish this from a dangerous use
   * @param node
   */
  clearInnerHTML(node: GwDomNode): GwDomNode {
    // NOTE: in various browsers, there are performance increases by using a looping child removal instead of setting innerHTML to ""
    // We were only using that optimization in the media gallery, and only in one place, so am simplifying, but leaving the code below
    // if (node.firstChild && node.removeChild) {
    //   while (node.firstChild) {
    //     node.removeChild(node.firstChild);
    //   }
    //
    // } else if (node.innerHTML) {
    //
    //   node.innerHTML = "";
    // }

    node.innerHTML = "";

    return node;
  }

  /**
   * Essentially a bypass for the TSLint rule no-inner-html
   * But is also important to have the name dangerous in it to make folks think twice
   * @param node
   * @param htmlString
   */
  dangerouslySetInnerHTML(node: GwDomNode, htmlString: string): void {
    if (!htmlString) {
      gwUtil.devlog("Use clearInnerHTML instead of passing an empty string to dangerouslySetInnerHTML");
    }

    node.innerHTML = htmlString;
  }

  /**
   * Listen for a custom event on the body of the document. Typically the event would be fired using
   * gwUtil.fireCustomEvent
   * @param eventName the name of the event to listen for
   * @param handler function to call if the event is filed; takes one argument which will be the event that was fired
   */
  addCustomEventListener(eventName: string, handler: GwEventListener): void {
    document.body.addEventListener(eventName, handler, false);
  }

  removeCustomEventListener(eventName: string, handler: GwEventListener): void {
    document.body.removeEventListener(eventName, handler, false);
  }

  mapMerge(...maps: (GwMap | undefined | null)[]): GwMap {
    const finalMap: GwMap = {};

    for (const map of maps) {
      gwUtil.forEach(map, (val: any, key: string) => {
        if (!gwUtil.hasValue(finalMap[key])) {
          finalMap[key] = val;
        }
      });
    }

    return finalMap;
  }

  _isSimulatedDOM(): boolean {
    return !!((window as any) || {}).GwTestEnv;
  }

  getCurrentUrlWithNewHandlerName(handlerNameValue: string): string {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.append("handlerName", handlerNameValue);
    const urlObj = new URL(window.location.href);
    urlObj.search = searchParams.toString();
    return urlObj.href;
  }

  mapToKeyValueString(map: Map<string, any> | Record<string, any>, connector: string = "=", joiner: string = ","): string {
    return Object.keys(map).map((key) => `${key}${connector}${map instanceof Map ? map.get(key) : map[key]}`).join(joiner);
  }

  keyValueStringToMap(kvStr: string, connector: string = "=", joiner = ";"): Map<string, string> {
    const map = new Map();

    kvStr.split(joiner).forEach((kvPairStr) => {
      const kv = kvPairStr.split(connector);
      if (kv.length === 1) {
        map.set(kv[0].trim(), "");
      } else if (kv.length == 2) {
        map.set(kv[0].trim(), kv[1].trim());
      } else {
        throw new Error("Unable to parse keyValue String: " + kvStr);
      }
    });

    return map;
  }
}

export const gwUtil = new GwUtil();
