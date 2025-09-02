import { GwMap, GwTypedMap } from "../types/gwTypes";
import { GwApi } from "./gwApi";
import { GwDraggableSystem } from "./util/GwDraggableSystem";
import { GwRegisteredSystem } from "./util/GwRegisteredSystem";
import { GwWebsocketSystem } from "./util/GwWebsocketSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * One exception is the TypeScript/JavaScript API exposed via gw.api; see GwApi for details
 */
export class Gw {
  private _api: GwApi | null = null;
  readonly draggable: GwTypedMap<GwDraggableSystem> = {};
  readonly sockets: GwTypedMap<GwWebsocketSystem> = {};

  displaykeyvalues: GwMap | null = null;

  get globals(): GwTypedMap<{ getSystemName(): string }> {
    return GwRegisteredSystem.registeredSystems;
  }

  registerDraggableSystem(draggable: GwDraggableSystem): void {
    if (Object.prototype.hasOwnProperty.call(this.draggable, draggable.getSystemName())) {
      throw new Error(
        "Attempting to register a draggable system object with a system name that's already been registered: " + draggable.getSystemName()
      );
    }

    this.draggable[draggable.getSystemName()] = draggable;
  }

  registerWebsocketSystem(socketSystem: GwWebsocketSystem): void {
    if (Object.prototype.hasOwnProperty.call(this.sockets, socketSystem.getSystemName())) {
      throw new Error(
        "Attempting to register a socket system object with a system name that's already been registered: " + socketSystem.getSystemName()
      );
    }

    this.sockets[socketSystem.getSystemName()] = socketSystem;
  }

  get api(): GwApi {
    if (this._api === null) {
      this._api = new GwApi();
    }
    return this._api;
  }
}

export const gw = new Gw();
(window as any).gw = gw;
