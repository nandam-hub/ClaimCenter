import {gw} from "../gw";
import {GwMap} from "../../types/gwTypes";
import {GwInitializableSystem} from "./GwInitializableSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export abstract class GwWebsocketSystem extends GwInitializableSystem {
  constructor () {
    super();
    if (this.availableToWebSocket()) {
      gw.registerWebsocketSystem(this);
    }
  }

  protected availableToWebSocket (): boolean {
    return true;
  }

  abstract onWebSocket (info: GwMap): void;
}