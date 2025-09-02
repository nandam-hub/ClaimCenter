import {
  GwCrossOriginEvent,
  GwCrossOriginEventListenerCallback,
  GwCrossOriginEventName,
  GwCrossOriginWindowName,
  GwKeyValue,
  GwMessageData,
  GwMessageEvent,
  GwMessagesFromGW,
  GwMessageStatus,
  GwMessagesToGW,
  GwNotification,
  GwNotificationCallback,
  GwNotificationType,
} from "../types/gwCrossOriginTypes";
import { GwTypedMap } from "../types/gwTypes";

interface GwMessageAwaitingResponseInfo {
  messageId: number;
  fulfill?: (payload: GwKeyValue<any> | Error | null) => void;
  reject?: (payload: GwKeyValue<any> | Error | null) => void;
  timestamp: number;
}

/**
 * =================================
 * PRIMARY CLASS
 * =================================
 * This entire file is a stand alone implementation of the Gw cross origin window messaging system.
 * It's sole purpose is to be used in a cross origin window environment for embedded applications.
 *
 * This Static Class is the only API, and this file relies on no other imports (apart from some TypeScript
 * type definitions, shared with the internal APIs)
 *
 * If the external application plans to support browsers or environments that don't natively support es6 Promise,
 * then it will need a Promise polyfill. GwPromise.ts is one option, and is a stand alone polyfill.
 */
export abstract class GwCrossOriginExternal {
  private static nextMessageId: number = 1000;

  private static initialized: boolean = false;
  private static originForGwApp: string | undefined;
  private static readonly messagesAwaitingResponse: GwKeyValue<GwMessageAwaitingResponseInfo> = {};
  private static readonly crossOriginEventCallbackByBroadcasterThenEvent: GwKeyValue<GwKeyValue<GwCrossOriginEventListenerCallback>> = {};
  private static readonly gwNotificationListeners: GwKeyValue<GwNotificationCallback> = {};
  private static allowListedDomains: GwKeyValue<true> | "*" = {};
  private static ownerWindow: Window;
  private static messageEventListener: ((event: GwMessageEvent) => void) | undefined;

  private constructor() {
    throw new Error("Static class. Use GwCrossOriginExternal.init()");
  }

  //==============================================
  //==== INITIALIZATION
  //==============================================

  /**
   * Required Initializer for the GwCrossOriginExternal API.
   * Adds a 'message' event listener to the global window
   * @param {string} originForGwApp - the origin of the window (running the GW Application) that spawned this window
   * @param {Window} forcedOwnerWindow - primarily used for testing and mocking. Replaces all calls to the global window.
   */
  static init(originForGwApp: string, allowListedDomains: GwKeyValue<true> | "*", forcedOwnerWindow?: Window): void {
    this.ownerWindow = forcedOwnerWindow || window.parent;
    this.allowListedDomains = allowListedDomains;
    this.originForGwApp = originForGwApp;
    this.initialized = true;
    this.messageEventListener = this.receiveMessageFromGwApp.bind(this);
    window.addEventListener("message", this.messageEventListener!, false);
  }

  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Disables the API. Removing any setup done in the init method.
   */
  static kill(): void {
    this.initialized = false;
    this.originForGwApp = undefined;
    if (this.messageEventListener) {
      this.ownerWindow.removeEventListener("message", this.messageEventListener, false);
      this.messageEventListener = undefined;
    }
  }

  //==============================================
  //==== RECEIVE MESSAGES FROM GW APP
  //==============================================

  private static throwIfUntrustedOrigin(event: GwMessageEvent): void {
    if (this.ownerWindow !== event.source || this.originForGwApp !== event.origin) {
      throw new Error("Received untrusted message from origin: " + event.origin);
    }

    if (event.data.gwNonGwOriginIfAny) {
      if (this.allowListedDomains !== "*" && !this.allowListedDomains[event.data.gwNonGwOriginIfAny]) {
        throw new Error("Received message from trusted GW Application origin, but from an originating origin not on the allow list.");
      }
    }
  }

  /**
   * The Primary Router for All Messages Received from the GW Application
   * It is bound the "message" event listener on the parent window.
   *
   * THERE IS NO REASON TO CALL THIS METHOD DIRECTLY
   * @param {GwMessageEvent} event
   */
  static receiveMessageFromGwApp(event: GwMessageEvent): void {
    if (!this.initialized) {
      return;
    }

    this.throwIfUntrustedOrigin(event);

    const data: GwMessageData = event.data;

    switch (data.gwMessageType) {
      case GwMessagesFromGW.VALUES:
        this.receiveValuesMessage(data);
        break;
      case GwMessagesFromGW.RESPONSE_FROM_NON_BLOCKING_SERVER_REQUEST:
        this.receiveNonBlockingServerRequestReponseMessage(data);
        break;
      case GwMessagesFromGW.CONFIRMATION_ONLY:
        this.receiveConfirmationOnlyMessage(data);
        break;
      case GwMessagesFromGW.RECEIVE_CROSS_ORIGIN_EVENT:
        this.receiveCrossOriginEvent(data);
        break;
      case GwMessagesFromGW.RECEIVE_GW_NOTIFICATION:
        this.receiveGwNotification(data);
        break;
      default:
        this.receiveNonConformingMessageTypeFromGwApp(event);
    }
  }

  /**
   * Helper. Retrieves GwMessageAwaitingResponseInfo while logging errors along the way
   * @param {GwMessageData} data
   * @returns {GwMessageAwaitingResponseInfo<any> | null}
   */
  private static getAwaitingInfoForCorrespondingMessageData(data: GwMessageData): GwMessageAwaitingResponseInfo | null {
    const responseToMessageId = data.gwResponseToMessageId;

    if (!responseToMessageId && responseToMessageId !== 0) {
      console.error("Received values payload with no responseToMessageId identifier: ", data);
      return null;
    }

    const info: GwMessageAwaitingResponseInfo = this.messagesAwaitingResponse[responseToMessageId];

    if ((window as any).GwTestEnv) {
      return info;
    }

    if (!info) {
      console.error(
        "Received values payload with a responseToMessageId: " +
          responseToMessageId +
          ". But could not locate a corresponding Promise. Data: ",
        data
      );
      return null;
    }

    return info;
  }

  /**
   * Promise Resolver.
   * Takes a GwMessageData object.
   * Locates locally stored promises relating the the message, and fires fulfil or reject based on message status.
   * @param {GwMessageData} data
   */
  private static receiveMessage(data: GwMessageData): void {
    const payload: GwKeyValue<any> | Error | null = data.gwPayload;
    const status: GwMessageStatus = data.gwStatus;

    const info: GwMessageAwaitingResponseInfo | null = this.getAwaitingInfoForCorrespondingMessageData(data);
    if (!info) {
      return;
    }

    const callback = status === GwMessageStatus.FAILED ? info.reject : info.fulfill;
    if (callback) {
      callback(payload);
    }
  }

  private static receiveNonBlockingServerRequestReponseMessage(data: GwMessageData): void {
    this.receiveMessage(data);
  }

  private static receiveValuesMessage(data: GwMessageData): void {
    this.receiveMessage(data);
  }

  private static receiveConfirmationOnlyMessage(data: GwMessageData): void {
    this.receiveMessage(data);
  }

  private static receiveCrossOriginEvent(data: GwMessageData): void {
    const ev: GwCrossOriginEvent = data.gwPayload;

    const events: GwTypedMap<GwCrossOriginEventListenerCallback> =
      this.crossOriginEventCallbackByBroadcasterThenEvent[ev.broadcasterWindowId];

    if (!events) {
      console.warn("Received cross origin event from a broadcast window not currently being listened to.");
      return;
    }

    const eventListenerCallback = events[ev.eventName] || events["*"];

    if (!eventListenerCallback) {
      console.warn(
        "Received cross origin event for an event type without a registered callback: " + ev.broadcasterWindowId + ":" + ev.eventName
      );
    }

    eventListenerCallback(ev);
  }

  private static receiveGwNotification(data: GwMessageData): void {
    const notification: GwNotification = data.gwPayload;

    const callback: GwNotificationCallback = this.gwNotificationListeners[notification.type];
    if (callback) {
      callback(notification);
    }
  }

  private static receiveNonConformingMessageTypeFromGwApp(event: MessageEvent): void {
    const possibleCustomMethodName = (this as any)[event.data.gwMessageType];

    if (typeof possibleCustomMethodName === "function") {
      (this as any)[possibleCustomMethodName](event);
      return;
    }

    console.warn(
      "--- Received MessageEvent from GwApp without a gwMessageType that matched a method on GwCrossOriginExternal.\n" +
        "--- This is likely an Error.\n" +
        "--- However, receiveNonConformingMessageTypeFromGwApp can be overridden in GwCrossOriginExternal.\n" +
        "--- This allows custom logic based on any MessageEvent that does not implement GwMessageEvent. But consider MessageType.FIRE_CUSTOM_EVENT instead."
    );
  }

  //==============================================
  //==== SEND MESSAGES TO GW APP
  //==============================================

  /**
   * Private Primary router for all outgoing messages to the Gw Application.
   * @param {GwMessagesToGW} messageType
   * @param payload
   * @param {number | null} responseToMessageId
   * @returns {Promise<any>}
   */

  private static sendMessage(messageType: GwMessagesToGW, payload: any, responseToMessageId: number | null = null): Promise<any> {
    if (!this.ownerWindow) {
      return Promise.reject(
        new Error("Attempting to send a message to a null GwApp window. Ensure that this window was spawned by a Guidwire Application.")
      );
    }

    const messageId = this.nextMessageId++;

    const data: GwMessageData = {
      gwMessageType: messageType,
      gwPayload: payload,
      gwStatus: GwMessageStatus.PENDING,
      gwMessageId: messageId,
      gwResponseToMessageId: responseToMessageId,
    };

    const messageAwaitingResponse: GwMessageAwaitingResponseInfo = {
      messageId,
      timestamp: window.performance.now(),
    };
    this.messagesAwaitingResponse[messageId] = messageAwaitingResponse;

    try {
      const promise = new Promise((fulfill, reject) => {
        messageAwaitingResponse.fulfill = fulfill;
        messageAwaitingResponse.reject = reject;
      });
      this.ownerWindow.postMessage(data, this.originForGwApp!);
      return promise;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Tells the GW Application to update the DOM Elements (for the widgets whose IDs correspond to the logical name mapping), with new values.
   * NOTE: this does not automatically update server values for the elements. Only the values in the DOM in the GW Application.
   * If the Page is in readonly mode, or the user cancels the changes, the changes will be lost.
   *
   * See: GwCrossOriginExternal.fireActionOnServer, or GwCrossOriginExternal.makeNonBlockingServerRequest for direct
   * communication with the Gw Application Server.
   *
   * The returned promise is only for confirmation that the message was successful
   *
   * @param {GwValueMap} logicalNameToValueMap - 'Logical Names' are exposed as a mapping in EmbeddingWidget API.
   * And correspond to a set of widget IDs in a given instance of the EmbeddingWidget. ie:
   * Logical Name: AddressLine1 => WidgetId-page9-panel8-addresssection7-addressline1.
   * Ligical Name: ZipCode => WidgetId-page9-panel8-addresssection7-zipcode.
   * See the PCF fields for EmbeddingWidget
   * @returns {Promise<GwValueMap>}
   */

  static setValues(logicalNameToValueMap: GwKeyValue<string>): Promise<GwKeyValue<string>> {
    return this.sendMessage(GwMessagesToGW.SET_VALUES, logicalNameToValueMap);
  }

  /**
   * Returns the values of the corresponding widgets as currently represented in the DOM.
   * Note: this returns the values as currently represented in the DOM. These values COULD be different
   * from the persisted server values for any number of reasons: the user modified them locally, client reflection
   * modified them, etc.
   *
   * The returned promise will contain the values when fulfilled
   * @param {string[]} logicalNames - 'Logical Names' are exposed as a mapping in EmbeddingWidget API.
   * And correspond to a set of widget IDs in a given instance of the EmbeddingWidget. ie:
   * Logical Name: AddressLine1 => WidgetId-page9-panel8-addresssection7-addressline1.
   * Ligical Name: ZipCode => WidgetId-page9-panel8-addresssection7-zipcode.
   * See the PCF fields for EmbeddingWidget
   * @returns {Promise<GwValueMap>}
   */

  static getValues(logicalNames: string[]): Promise<GwKeyValue<string>> {
    return this.sendMessage(GwMessagesToGW.GET_VALUES, logicalNames);
  }

  /**
   * Calls the Embedded Widget's server side ACTION HANDLER with the given JSON
   * object as its argument. This will cause a full UI refresh.
   *
   * The returned promise is only for confirmation that the message was successful, not the result of the action on the server
   * @param {string} jsonPayload
   * @returns {Promise<any>}
   */

  static fireActionOnServer(payload: GwKeyValue<any>): Promise<any> {
    return this.sendMessage(GwMessagesToGW.FIRE_ACTION, payload);
  }

  /**
   * Calls the Embedded Widget's server side UPDATE HANDLER with the given object
   * object as its argument. This will not block or refresh the GW Application UI.
   *
   * NOTE: The Promise returned by this method will contain the payload from this request.
   */

  static makeNonBlockingServerRequest(payload: GwKeyValue<any>): Promise<any> {
    return this.sendMessage(GwMessagesToGW.NON_BLOCKING_SERVER_REQUEST, payload);
  }

  /**
   * Subscribe to another External Cross Origin window's messages.
   * Imagine that the Gw Application has 2 embedded iframe's. The Blue Window, and the Red Window.
   * Blue window can broadcast a custom cross origin event. Let's say "GO_BANANAS". And include some information: {numberOfBananas: 12}
   * Blue window will send that package to the GwApplication via broadcastCrossOriginEvent.
   * Red window will never hear about this message.
   *
   * But if Red Window calls addCrossOriginEventListener, passing "redWindow" and "GO_BANANAS" then the Gw Application
   * will route the message event to the blue window, and call the provided callback function.
   *
   * Like get/set values this function uses logical names, as given to the embedded widget via
   * the EmbeddedWidgetRef element. Though in this case the logical names refer to another
   * embedded widget rather than to an input.
   *
   * NOTE: to receive messages from any other external windows, they must be explicitly allow listed via the
   * GwCrossOriginExternal.init method, either by domain, or by specifying a wildcard domain.
   *
   * The returned promise is only for confirmation that the message was successful
   * @param broadcasterWindowName the logical name of the window you want to listen to
   * @param {string} eventName name of the event, or "*" to listen to any event
   * @param {GwEventInfoCallback} callback
   * @returns {Promise<any>}
   */

  static addCrossOriginEventListener(
    broadcasterWindowName: GwCrossOriginWindowName,
    eventName: GwCrossOriginEventName,
    callback: GwCrossOriginEventListenerCallback
  ): Promise<any> {
    let currentlyListenedToEvents = (this.crossOriginEventCallbackByBroadcasterThenEvent[broadcasterWindowName] =
      this.crossOriginEventCallbackByBroadcasterThenEvent[broadcasterWindowName] || {});

    if (currentlyListenedToEvents["*"]) {
      return Promise.reject(
        new Error(
          "There is already an 'all' listener (`*`) for this broadcaster. Remove it before adding any other listeners: " +
            broadcasterWindowName +
            ":" +
            eventName
        )
      );
    }

    if (currentlyListenedToEvents[eventName]) {
      return Promise.reject(
        new Error("Cannot register multiple callbacks for the same broadcaster and event: " + broadcasterWindowName + ":" + eventName)
      );
    }

    if (eventName === "*" && Object.keys(currentlyListenedToEvents).length > 0) {
      console.warn(
        "Adding an 'all' listener of '*' to a broadcaster that already has more specific listener. All specific listeners will be removed. In order to avoid this warning, remove known listeners manually before adding."
      );
      currentlyListenedToEvents = this.crossOriginEventCallbackByBroadcasterThenEvent[broadcasterWindowName] = {};
    }

    currentlyListenedToEvents[eventName] = callback;

    return this.sendMessage(GwMessagesToGW.ADD_CROSS_ORIGIN_EVENT_LISTENER, { broadcasterWindowName, eventName });
  }

  /**
   * Removes the Cross Origin Event Listener from the GW Application window
   * See GwCrossOriginExternal.addCrossOriginEventListener.
   *
   * Like get/set values this function uses logical names, as given to the embedded widget via
   * the EmbeddedWidgetRef element. Though in this case the logical names refer to another
   * embedded widget rather than to an input.
   *
   * The returned promise is only for confirmation that the message was successful
   * @param broadcasterWindowName the logical name of the window you want to stop listening to
   * @param {string} eventName name of the event, or "*" if registerd to listen to any event
   * @returns {Promise<any>}
   */

  static removeCrossOriginEventListener(broadcasterWindowName: GwCrossOriginWindowName, eventName: GwCrossOriginEventName): Promise<any> {
    const byBroadcaster = this.crossOriginEventCallbackByBroadcasterThenEvent[broadcasterWindowName];

    if (byBroadcaster) {
      if (eventName === "*") {
        delete this.crossOriginEventCallbackByBroadcasterThenEvent[broadcasterWindowName];
      } else {
        delete byBroadcaster[eventName];
      }
    }

    return this.sendMessage(GwMessagesToGW.REMOVE_CROSS_ORIGIN_EVENT_LISTENER, { broadcasterWindowName, eventName });
  }

  /**
   * Broadcasts a Cross Origin Event (Message) to the GW Application client. The GW Application then routes the message event
   * and information package on to any other embedded windows in the application that are listening to the origin and event name.
   * See GwCrossOriginExternal.addCrossOriginEventListener.
   *
   * @param {string} eventName
   * @returns {Promise<any>}
   */

  static broadcastCrossOriginEvent(eventName: GwCrossOriginEventName, info: any): Promise<any> {
    if (eventName.length === 0 || eventName === "*") {
      return Promise.reject(
        new Error("Illegal eventName passed to fireCrossOriginEvent. Cannot be empty or the single `*` character: " + eventName)
      );
    }

    return this.sendMessage(GwMessagesToGW.BROADCAST_CROSS_ORIGIN_EVENT, { eventName, info });
  }

  /**
   * The Gw Application sends 'events' for some predefined client related notifications, such as the Theme Changing, or the Locale changing.
   * There is also a GENERAL category that exists mainly for future proofing. Additional events may be configured in the future.
   * @param {GwNotificationType} notificationType
   * @param {GwNotificationCallback} callback
   */
  static addCallbackForGwNotificationType(notificationType: GwNotificationType, callback: GwNotificationCallback): void {
    if (this.gwNotificationListeners[notificationType]) {
      throw new Error(
        "Attempting to load multiple callbacks for notification type: " +
          notificationType +
          ". call removeCallbackBackForGWNotificationType first."
      );
    } else if (this.gwNotificationListeners["*"]) {
      throw new Error("Attempting to load a notification listener when their is already a * listener. New listener: " + notificationType);
    }
    this.gwNotificationListeners[notificationType] = callback;
  }

  /**
   * The Gw Application sends 'events' for some predefined client related notifications, such as the Theme Changing, or the Locale changing.
   * There is also a GENERAL category that exists mainly for future proofing. Additional events may be configured in the future.
   * @param {GwNotificationType} notificationType
   * @param {GwNotificationCallback} callback
   */
  static removeCallbackForGwNotificationType(notificationType: GwNotificationType): void {
    if (!this.gwNotificationListeners[notificationType]) {
      console.warn("Attempting to remove a non existent notification listener for: " + notificationType);
    }
    delete this.gwNotificationListeners[notificationType];
  }
}
