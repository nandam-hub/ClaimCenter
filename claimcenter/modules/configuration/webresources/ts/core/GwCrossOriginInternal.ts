import { convertConfigManagerThemeNameToPLThemeName, gwApp } from "../plApp";
import {
  GwCrossOriginEvent,
  GwCrossOriginEventRequest,
  GwMessageData,
  GwMessageEvent,
  GwMessagesFromGW,
  GwMessageStatus,
  GwMessagesToGW,
  GwNotification,
  GwNotificationType,
} from "../types/gwCrossOriginTypes";
import { GwMap, GwPartialReloadDetails, GwTypedMap } from "../types/gwTypes";
import { gwPrefPanel } from "./gwPrefPanel";
import { gwInputs } from "./inputs/gwInputs";
import { gwAjax } from "./util/gwAjax";
import { GwOrderDependentInitializableSystem } from "./util/GwOrderDependentInitializableSystem";
import { gwUtil } from "./util/gwUtil";

type GwWindowInfo = {
  id: string;
  targetWindow: Window;
  windowOrigin: string;
  logicalNameToIdMap: GwTypedMap<string> | undefined;
};

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * Together with GwCrossOriginExternal, this class makes up the API for for the GW Application Cross Origin Messaging System
 * Messages and Actions can be sent to embedded Widgets with windows hosting external domains.
 *
 * These external domains should include the code located in GwCrossOriginExternal to complete the API
 *
 * All communication across domains is done via window.postMessage which is a source for cross site scripting attacks.
 * So be aware whenever working in these 2 files.
 *
 * Also loads adds a window message event listener for config-manager if application is loaded in an iframe
 *
 * MDN window reference documentation:
 * Window.open (to spawn a new window and then reference it),
 * Window.opener (to reference the window that spawned this one),
 * HTMLIFrameElement.contentWindow (to reference an embedded <iframe> from its parent window),
 * Window.parent (to reference the parent window from within an embedded <iframe>), or
 * Window.frames + an index value (named or numeric).
 */
export class GwCrossOriginInternal extends GwOrderDependentInitializableSystem {
  private readonly _crossOriginWindowsById: GwTypedMap<GwWindowInfo> = {};
  private readonly _crossOriginEventListenersByBroadcasterThenEvent: GwTypedMap<GwTypedMap<GwTypedMap<true>>> = {};
  private _nextId: number = 1000;

  orderSpecificInit(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    if (!isFullPageReload) {
      this.unregisterObsoleteEmbeddedWidgets();
    }

    this.iterateEmbeddedWidgets();

    if (isFullPageReload) {
      if (gwUtil.isInIframe()) {
        window.addEventListener("message", receiveActionFromConfigManager);
      }

      this.registerCustomEventHandlers();
    }

    // if (gwUtil.isInIframe()) {
    //   document.documentElement.classList.add("gw-framed-app");
    // }

    if (gwUtil.isInIframe()) {
      const rootEl = document.getElementById("gw-body");
      if (rootEl) {
        rootEl.classList.add("gw-framed-app");
      }
    }
  }

  getSystemName(): string {
    return "gwCrossOriginInternal";
  }

  //==============================================
  //==== CREATE WINDOWS
  //==============================================

  /**
   * Uses window.open to spawn or replace a window connected to a specified widgetId and popup window or tab name
   * @param {string} embeddedWidgetId
   * @param {string} url
   * @param {string} popUpOrTabName
   * @param {string} windowFeatures
   * @param logicalNameToIdMap
   * @returns {Window}
   */
  createPopupWindow(
    embeddedWidgetId: string,
    url: string,
    popUpOrTabName: string,
    logicalNameToIdMap?: GwMap,
    windowFeatures?: string
  ): Window {
    const targetWindow = window.open(url, popUpOrTabName, windowFeatures);
    if (targetWindow === null) {
      throw new URIError("Unable to open window at URL: " + url);
    }
    this.registerWindow(embeddedWidgetId, this.getOriginUrl(url), targetWindow, logicalNameToIdMap);
    return targetWindow;
  }

  //==============================================
  //==== SEND MESSAGES TO TARGET WINDOW
  //==============================================

  sendGwNotificationEventToAllTargetWindows(type: GwNotificationType, info: any): void {
    const notification: GwNotification = { type, info, timestamp: window.performance.now() };

    gwUtil.forEach(this._crossOriginWindowsById, (windowInfo: GwWindowInfo) => {
      this.sendMessageToTargetWindow(windowInfo.id, GwMessagesFromGW.RECEIVE_GW_NOTIFICATION, notification);
    });
  }

  //==============================================
  //==== GET MESSAGE FROM EXTERNAL WINDOW
  //==============================================

  /**
   * Primary router for receiving messages from target window.
   * Is bound the the "message" event listener on the application window.
   * Should not be called directly.
   * @param {GwMessageEvent} event
   */
  receiveMessageFromTargetWindow(event: GwMessageEvent): void {
    const windowInfo = this.getWindowInfoForEvent(event);
    if (windowInfo === null) {
      // Not from a window that we're tracking
      return;
    }
    if (!this.verifyOrigin(event.origin, windowInfo.windowOrigin)) {
      // From a window we know about but the URL has changed from the one we trust
      throw new Error("Received cross origin message from untrusted source. " + event.origin);
    }

    const { gwMessageType, gwPayload, gwMessageId } = event.data;
    switch (gwMessageType) {
      case GwMessagesToGW.SET_VALUES:
        this.receiveSetValuesMessageFromTargetWindow(gwMessageId, gwPayload, windowInfo);
        break;
      case GwMessagesToGW.GET_VALUES:
        this.receiveGetValuesMessageFromTargetWindow(gwMessageId, gwPayload, windowInfo);
        break;
      case GwMessagesToGW.FIRE_ACTION:
        this.receiveFireActionMessageFromTargetWindow(gwMessageId, gwPayload, windowInfo);
        break;
      case GwMessagesToGW.NON_BLOCKING_SERVER_REQUEST:
        this.receiveNonBlockingServerRequestMessageFromTargetWindow(gwMessageId, gwPayload, windowInfo);
        break;
      case GwMessagesToGW.ADD_CROSS_ORIGIN_EVENT_LISTENER:
        this.receiveAddCrossOriginEventListenerFromTargetWindow(gwMessageId, gwPayload, windowInfo);
        break;
      case GwMessagesToGW.REMOVE_CROSS_ORIGIN_EVENT_LISTENER:
        this.receiveRemoveCrossOriginEventListenerFromTargetWindow(gwMessageId, gwPayload, windowInfo);
        break;
      case GwMessagesToGW.BROADCAST_CROSS_ORIGIN_EVENT:
        this.receiveBroadcastCrossOriginEventFromTargetWindow(gwMessageId, gwPayload, windowInfo);
        break;
      default:
        console.warn("Unknown Message Type: " + gwMessageType);
    }
  }

  private getWindowInfoForEvent(event: GwMessageEvent): GwWindowInfo | null {
    for (const name of Object.getOwnPropertyNames(this._crossOriginWindowsById)) {
      const info = this._crossOriginWindowsById[name];
      if (info.targetWindow === event.source) {
        return info;
      }
    }
    return null;
  }

  /**
   * Receives a crossOrigin broadcast from one window, looks up if any other windows are listening to it and forwards it on.
   * @param {number} messageId
   * @param eventNameAndInfo
   * @param {GwWindowInfo} windowInfo
   */
  private receiveBroadcastCrossOriginEventFromTargetWindow(messageId: number, eventNameAndInfo: any, windowInfo: GwWindowInfo): void {
    let error: Error | null = null;
    const { id } = windowInfo;
    const eventName: string = eventNameAndInfo.eventName;
    const info: any = eventNameAndInfo.info;

    const broadcasterEvents = this._crossOriginEventListenersByBroadcasterThenEvent[id];
    if (!broadcasterEvents || (!broadcasterEvents[eventName] && !broadcasterEvents["*"])) {
      error = new Error("No listeners found for event: " + eventName);
    } else {
      const eventListenersForEvent: GwTypedMap<true> = broadcasterEvents[eventName];
      const eventListenersForAll: GwTypedMap<true> = broadcasterEvents["*"];
      const eventListenersMerged = gwUtil.mapMerge(eventListenersForEvent, eventListenersForAll);

      gwUtil.forEach(eventListenersMerged, (_, listenerWindowId: string) => {
        const ev: GwCrossOriginEvent = {
          info,
          eventName,
          broadcasterWindowId: this.translateIdToLogicalName(this._crossOriginWindowsById[listenerWindowId], id),
          timestamp: window.performance.now(),
        };
        this.sendMessageToTargetWindow(listenerWindowId, GwMessagesFromGW.RECEIVE_CROSS_ORIGIN_EVENT, ev, -1, GwMessageStatus.NONE);
      });
    }

    this.sendConfirmationToTargetWindow(windowInfo.id, messageId, error);
  }

  private receiveRemoveCrossOriginEventListenerFromTargetWindow(
    messageId: number,
    eventRequest: GwCrossOriginEventRequest,
    windowInfo: GwWindowInfo
  ): void {
    const { id } = windowInfo;
    const eventName = eventRequest.eventName;
    const broadcasterWindowId = this.translateLogicalNameToId(windowInfo, eventRequest.broadcasterWindowName);

    let error: Error | null = null;

    try {
      //Will throw and be caught if any of the bracket accessors doesn't exist
      const foundWindowListener: true | undefined =
        this._crossOriginEventListenersByBroadcasterThenEvent[broadcasterWindowId][eventName][id];

      if (!foundWindowListener) {
        throw new Error();
      }

      delete this._crossOriginEventListenersByBroadcasterThenEvent[broadcasterWindowId][eventName][id];
      if (Object.keys(this._crossOriginEventListenersByBroadcasterThenEvent[broadcasterWindowId][eventName]).length === 0) {
        delete this._crossOriginEventListenersByBroadcasterThenEvent[broadcasterWindowId][eventName];
        if (Object.keys(this._crossOriginEventListenersByBroadcasterThenEvent[broadcasterWindowId]).length === 0) {
          delete this._crossOriginEventListenersByBroadcasterThenEvent[broadcasterWindowId];
        }
      }
    } catch (e) {
      error = new Error("Unable to find registered event listener for eventName: " + id + ":" + eventName);
    }

    this.sendConfirmationToTargetWindow(id, messageId, error);
  }

  private receiveAddCrossOriginEventListenerFromTargetWindow(
    messageId: number,
    eventRequest: GwCrossOriginEventRequest,
    windowInfo: GwWindowInfo
  ): void {
    const { id } = windowInfo;
    const eventName = eventRequest.eventName;
    const logicalBroadcasterWindowName = eventRequest.broadcasterWindowName;
    const broadcasterWindowId = this.translateLogicalNameToId(windowInfo, logicalBroadcasterWindowName);

    let error: Error | null = null;

    try {
      const broadcasterEvents = (this._crossOriginEventListenersByBroadcasterThenEvent[broadcasterWindowId] =
        this._crossOriginEventListenersByBroadcasterThenEvent[broadcasterWindowId] || {});
      const listenersForEvent = (broadcasterEvents[eventName] = broadcasterEvents[eventName] || {});
      const listenersForAll = broadcasterEvents["*"];

      if (listenersForEvent[id]) {
        throw new Error(
          "Received request to add custom event listener, but one already exists for: " + logicalBroadcasterWindowName + ":" + eventName
        );
      } else if (listenersForAll && listenersForAll[id]) {
        throw new Error(
          "Received request to add custom event listener, but an 'all' ('*') already exists for: " + logicalBroadcasterWindowName
        );
      }

      broadcasterEvents[eventName][id] = true;
    } catch (e) {
      error = e as Error;
    }

    this.sendConfirmationToTargetWindow(id, messageId, error);
  }

  private receiveNonBlockingServerRequestMessageFromTargetWindow(messageId: number, map: GwMap, windowInfo: GwWindowInfo): void {
    const { id } = windowInfo;

    try {
      map["embeddedUrl"] = windowInfo.windowOrigin;
      const parameters: GwMap = {
        __embeddedWidgetId: id,
        embeddedWidgetJson: JSON.stringify(map),
      };
      gwAjax.ajaxRequest(
        parameters,
        (resp) => {
          this.sendNonBlockingServerRequestResponse(id, resp, messageId, GwMessageStatus.SUCCEEDED);
        },
        (req, resp) => {
          this.sendNonBlockingServerRequestResponse(id, resp, messageId, GwMessageStatus.FAILED);
        }
      );
    } catch (e) {
      this.sendConfirmationToTargetWindow(id, messageId, e as Error);
    }
  }

  private sendNonBlockingServerRequestResponse(
    windowName: string,
    info: any,
    responseToMessageId?: number,
    status: GwMessageStatus = GwMessageStatus.PENDING
  ): number {
    return this.sendMessageToTargetWindow(
      windowName,
      GwMessagesFromGW.RESPONSE_FROM_NON_BLOCKING_SERVER_REQUEST,
      info,
      responseToMessageId,
      status
    );
  }

  private receiveFireActionMessageFromTargetWindow(messageId: number, map: GwMap, windowInfo: GwWindowInfo): void {
    let error: Error | null = null;

    const { id } = windowInfo;

    try {
      map["embeddedUrl"] = windowInfo.windowOrigin;
      gwUtil.setEventParam("embeddedWidgetJson", JSON.stringify(map));
      gwUtil.fireEvent(id + "_embeddedWidgetAction");
    } catch (e) {
      error = e as Error;
    }

    this.sendConfirmationToTargetWindow(id, messageId, error);
  }

  private receiveSetValuesMessageFromTargetWindow(messageId: number, logicalNamesToValues: GwMap, windowInfo: GwWindowInfo): void {
    let error: Error | string | null = null;
    try {
      const finalIdToValueMap: GwMap = {};
      // Take the logical names from the payload, and swap them out for the ids in the map.
      // But if the payload has logical names not present in the map, we need to throw so the confirmation reports it
      gwUtil.forEach(logicalNamesToValues, (val: string, key: string) => {
        finalIdToValueMap[this.translateLogicalNameToId(windowInfo, key)] = val;
      });

      if (!gwInputs.setValuesByIds(finalIdToValueMap)) {
        error = "Unable to find and set all the specified inputs";
      }
    } catch (e) {
      error = e as Error;
    }

    this.sendConfirmationToTargetWindow(windowInfo.id, messageId, error);
  }

  private receiveGetValuesMessageFromTargetWindow(messageId: number, logicalNames: string[], windowInfo: GwWindowInfo): void {
    const values: GwMap = {};
    let error: Error | null = null;

    try {
      const idToLogicalNameMap: GwMap = {};
      // Take the logical names from the payload, and swap them out for the ids in the map.
      // But if the payload has logical names not present in the map, we need to throw so the confirmation reports it
      gwUtil.forEach(logicalNames, (logicalName: string) => {
        idToLogicalNameMap[this.translateLogicalNameToId(windowInfo, logicalName)] = logicalName;
      });

      const retrievedValuesById = gwInputs.getValuesByIdsAsMap(Object.keys(idToLogicalNameMap));

      gwUtil.forEach(retrievedValuesById, (val: string, id: string) => {
        const logicalName = idToLogicalNameMap[id];
        values[logicalName] = val;
      });
    } catch (e) {
      error = e as Error;
    }

    const status = error ? GwMessageStatus.FAILED : GwMessageStatus.SUCCEEDED;
    this.sendMessageToTargetWindow(windowInfo.id, GwMessagesFromGW.VALUES, error || values, messageId, status);
  }

  sendConfirmationToTargetWindow(windowName: string, responseToMessageId: number, error: Error | string | null): number {
    const status = error ? GwMessageStatus.FAILED : GwMessageStatus.SUCCEEDED;
    return this.sendMessageToTargetWindow(windowName, GwMessagesFromGW.CONFIRMATION_ONLY, error, responseToMessageId, status);
  }

  /**
   * The Primary means of communicating with targetWindows. All current API is implemented as helper methods that eventually call this method.
   * @param {string} windowName
   * @param {GwMessagesFromGW} action
   * @param data
   * @param {number | null} responseToMessageId
   * @param {GwMessageStatus} status
   * @returns {number}
   */
  private sendMessageToTargetWindow(
    windowName: string,
    action: GwMessagesFromGW,
    data?: any,
    responseToMessageId: number | null = null,
    status: GwMessageStatus = GwMessageStatus.PENDING
  ): number {
    const targetWindowInfo: GwWindowInfo = this._crossOriginWindowsById[windowName];
    if (!targetWindowInfo) {
      throw new Error("Unable to find a target window with name: " + windowName);
    }

    const targetWindow = targetWindowInfo.targetWindow;
    if (!targetWindow) {
      throw new Error("Found null windowWindow reference when attempting to post message to: " + windowName);
    }

    // Note: cannot send Error via post message, it's not cloneable
    const messageId = this._nextId++;
    const messageData: GwMessageData = {
      gwMessageType: action,
      gwPayload: data instanceof Error ? data.message : data,
      gwStatus: status,
      gwMessageId: messageId,
      gwResponseToMessageId: responseToMessageId,
    };

    targetWindowInfo.targetWindow.postMessage(messageData, targetWindowInfo.windowOrigin);
    return messageId;
  }

  //==============================================
  //==== Private Helpers
  //==============================================

  private unregisterObsoleteEmbeddedWidgets(): void {
    gwUtil.forEach(this._crossOriginWindowsById, (windowInfo: GwWindowInfo, id: string) => {
      const el = gwUtil.getDomNode("#" + id);
      if (!el || !el.hasAttribute("data-gw-registered")) {
        delete this._crossOriginWindowsById[id];
        this.removeAllCrossOriginEventListenersFor(id);
      }
    });
  }

  private removeAllCrossOriginEventListenersFor(id: string): void {
    gwUtil.forEach(
      this._crossOriginEventListenersByBroadcasterThenEvent,
      (listenersByEvent: GwTypedMap<GwTypedMap<true>>, broadcaster: string) => {
        gwUtil.forEach(listenersByEvent, (listeners: GwTypedMap<true>, event: string) => {
          delete listeners[id];
          if (Object.keys(listeners).length === 0) {
            delete listenersByEvent[event];
          }
        });
        if (Object.keys(listenersByEvent).length === 0) {
          delete this._crossOriginEventListenersByBroadcasterThenEvent[broadcaster];
        }
      }
    );
  }

  /**
   * Called by orderDependentInit
   * 1. looks for EmbeddedWidgets in the DOM.
   * 2. reads various inline data attributes off of them.
   * 3. builds an iframe using the attributes
   * 4. initializes the iframe with an initial get or post request
   * 5. registers the iframe, so we can receive messages from it (and post them back)
   */
  private iterateEmbeddedWidgets(): void {
    gwUtil.forEachReverse(gwUtil.getDomNodes(".gw-EmbeddedWidget"), (el: HTMLDivElement) => {
      if (!el.hasAttribute("data-gw-registered")) {
        const name = el.getAttribute("data-gw-frame-name");
        const url = el.getAttribute("data-gw-url");
        const requestType = el.getAttribute("data-gw-request-type");

        if (!name || !url) {
          throw new Error("Attempting to load an EmbeddedWidget with a missing name or url url.\nName: " + name + "\nURL: " + url);
        }

        let logicalNameToIdMap: GwTypedMap<string> = {};
        let contextProviderMap: GwTypedMap<string> = {};

        const dataMap = el.getAttribute("data-gw-logical-names");
        if (dataMap) {
          logicalNameToIdMap = JSON.parse(dataMap);
        }

        const contextProvider = el.getAttribute("data-gw-context-provider");
        if (contextProvider != null) {
          contextProviderMap = JSON.parse(contextProvider);
        }

        const iframe = this.createIFrame(el);
        if (requestType === "POST") {
          this.createAndSubmitFormToIFrame(el, iframe, url, contextProviderMap);
        } else if (requestType === "GET") {
          this.submitGetToIFrame(iframe, url, contextProviderMap);
        } else {
          throw new Error("Attempting to load an EmbeddedWidget with unknown request type.\nrequestType: " + requestType);
        }

        const origin = el.getAttribute("data-gw-origin");
        this.registerWindow(el.id, origin || this.getOriginUrl(url), iframe.contentWindow!, logicalNameToIdMap);
        el.setAttribute("data-gw-registered", "true");
      }
    });
  }

  private createIFrame(parentElement: HTMLElement): HTMLIFrameElement {
    let iframe = parentElement.querySelector("iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = parentElement.id + "-iframe";
      iframe.className = "gw-embedded-widget-iframe";
      parentElement.appendChild(iframe);
    }
    return iframe;
  }

  private submitGetToIFrame(iframe: HTMLIFrameElement, url: string, contextProviderMap?: GwMap): void {
    let queryStr = "";
    if (contextProviderMap) {
      Object.keys(contextProviderMap).forEach((key, index) => {
        const separator = index === 0 ? "?" : "&";
        queryStr = queryStr + separator + key + "=" + contextProviderMap[key];
      });
    }
    iframe.src = url + queryStr;
  }

  private createAndSubmitFormToIFrame(parentElement: Element, iframe: HTMLIFrameElement, url: string, contextProviderMap?: GwMap): void {
    const iform = document.createElement("form");
    iform.setAttribute("method", "post");
    iform.setAttribute("target", iframe.name);
    iform.setAttribute("action", url);

    if (contextProviderMap) {
      Object.keys(contextProviderMap).forEach((key) => {
        const input = document.createElement("input");
        input.setAttribute("name", key);
        input.setAttribute("value", contextProviderMap[key]);
        iform.appendChild(input);
      });
    }
    const input1 = document.createElement("input");
    input1.setAttribute("type", "submit");
    input1.setAttribute("value", "test");
    iform.appendChild(input1);

    parentElement.appendChild(iform);
    iform.submit();
    parentElement.removeChild(iform);
  }

  private registerWindow(id: string, windowOrigin: string, targetWindow: Window, logicalNameToIdMap?: GwTypedMap<string>): void {
    this._crossOriginWindowsById[id] = { id, logicalNameToIdMap, targetWindow, windowOrigin };
  }

  private verifyOrigin(eventUrl: string, expectedOriginUrl: string): boolean {
    return expectedOriginUrl === "*" || eventUrl === expectedOriginUrl || eventUrl.indexOf(expectedOriginUrl + "/") === 0;
  }

  private getOriginUrl(fullURL: string): string {
    const urlPattern = /^(https?:\/\/[^\/]*)(\/.*)?/;
    const match = fullURL.match(urlPattern);
    if (match && match.length > 2) {
      return match[1];
    }
    return fullURL;
  }

  private translateLogicalNameToId(windowInfo: GwWindowInfo, logicalName: string): string {
    const map = windowInfo.logicalNameToIdMap;
    if (!map) {
      throw new Error("No logical name to ID map found for window. Ensure that the widget in the PCF contains one.");
    }
    if (!Object.prototype.hasOwnProperty.call(map, logicalName)) {
      throw new Error("Logical name to ID map for the embedded widget does not contain an entry for logical name: " + logicalName);
    }
    return map[logicalName];
  }

  private translateIdToLogicalName(windowInfo: GwWindowInfo, id: string): string {
    const map = windowInfo.logicalNameToIdMap;
    if (!map) {
      throw new Error("No logical name to ID map found for window. Ensure that the widget in the PCF contains one.");
    }
    for (const key of Object.keys(map)) {
      if (map[key] === id) {
        return key;
      }
    }
    throw new Error("Logical name to ID map for the embedded widget does not contain an entry for id: " + id);
  }

  private registerCustomEventHandlers(): void {
    gwUtil.addCustomEventListener("themeChange", (event: Event) => {
      this.sendGwNotificationEventToAllTargetWindows(GwNotificationType.THEME_CHANGED, { themeId: (event as CustomEvent).detail.themeId });
      return true;
    });
    gwUtil.addCustomEventListener("localeChanged", (event: Event) => {
      this.sendGwNotificationEventToAllTargetWindows(GwNotificationType.LOCALE_CHANGED, { locale: (event as CustomEvent).detail.locale });
      return true;
    });
  }
}

function receiveActionFromConfigManager(e: MessageEvent): void {
  const { source, data, origin } = e;

  /**
   * Ignore messages coming from inside the house, or from any windows that aren't the parent
   */
  if (origin === window.location.origin || source !== window.parent) {
    return;
  }

  const incomingMessage: { themeName: string; type: string; action: string } = JSON.parse(data);

  if (incomingMessage.type === "ACTION" && incomingMessage.action === "THEME_CHANGE" && incomingMessage.themeName) {
    const paramName = gwApp.THEME_NAME_SEARCH_PARAM;
    const params = new URLSearchParams(window.location.search);
    const themeInParam = params.get(paramName);

    if (themeInParam !== incomingMessage.themeName) {
      params.set(paramName, incomingMessage.themeName);
      const url = new URL(window.location.href);
      url.search = "?" + params;
      window.history.replaceState({ path: url.href }, "", url.href);
    }

    gwPrefPanel.immediatelySetNewThemeAndRefresh(convertConfigManagerThemeNameToPLThemeName(incomingMessage.themeName));
  }
}

export const gwCrossOriginInternal = new GwCrossOriginInternal();
