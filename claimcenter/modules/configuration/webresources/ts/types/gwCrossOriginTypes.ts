export type GwKeyValue<T> = { [key: string]: T };

/**
 * Types used by embedded widgets when communicating with InsuranceSuite via the GwCrossOriginExternal API
 */
export const enum GwMessagesToGW {
  SET_VALUES,
  GET_VALUES,
  FIRE_ACTION,
  NON_BLOCKING_SERVER_REQUEST,
  BROADCAST_CROSS_ORIGIN_EVENT,
  ADD_CROSS_ORIGIN_EVENT_LISTENER,
  REMOVE_CROSS_ORIGIN_EVENT_LISTENER
}

export const enum GwMessagesFromGW {
  VALUES,
  RESPONSE_FROM_NON_BLOCKING_SERVER_REQUEST,
  CONFIRMATION_ONLY,
  RECEIVE_CROSS_ORIGIN_EVENT,
  RECEIVE_GW_NOTIFICATION
}

export const enum GwNotificationType {
  LOCALE_CHANGED,
  THEME_CHANGED,
  GENERAL
}

export const enum GwMessageStatus {
  SUCCEEDED,
  WARNING,
  FAILED,
  PENDING,
  NONE
}

export interface GwMessageData {
  [key: string]: any;

  gwMessageType: GwMessagesFromGW | GwMessagesToGW;
  gwPayload: any;
  gwStatus: GwMessageStatus;
  gwMessageId: number;
  gwResponseToMessageId: number | null;
  gwNonGwOriginIfAny?: string;
}

export interface GwMessageEvent extends MessageEvent {
  data: GwMessageData;
}

export interface GwNotification {
  type: GwNotificationType;
  timestamp: number;
  info: any;
}

export type GwNotificationCallback = (notification: GwNotification) => void;

export interface GwCrossOriginEvent {
  eventName: GwCrossOriginEventName;
  broadcasterWindowId: GwCrossOriginWindowName;
  timestamp: number;
  info: any;
}

export type GwCrossOriginEventListenerCallback = (eventInfo: GwCrossOriginEvent) => void;
export type GwCrossOriginWindowName = string;
export type GwCrossOriginEventName = string;
export type GwCrossOriginEventRequest = {
  broadcasterWindowName: GwCrossOriginWindowName;
  eventName: GwCrossOriginEventName;
};
