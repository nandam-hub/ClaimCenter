import {GwMap} from "../types/gwTypes";
import {gwUtil} from "./util/gwUtil";
import {gw} from "./gw";
import {GwInitializableSystem} from "./util/GwInitializableSystem";
import {gwApp} from "../plApp";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * Websocket System
 * Any other client system, defined by its lowercase property name on the gw global object, meaning gw.currency, gw.ProgressValue etc
 * can implement a method named onWebSocket on its own object, ie: gw.currency.onWebSocket
 * and that method will be called with the data.info from the server message if the data.system name matches.
 * ie: data = {system: currency, info: blah}, so: gw.currency.websocket(data.info);
 * @type {{}}
 */
export class GwWebsocket extends GwInitializableSystem {
  getSystemName (): string {
    return "gwWebsocket";
  }

  private sendQueue: string[] = [];
  private errorCount: number = 0;
  private readonly systemNameReg: RegExp = /^(WS_)|(_)/g;
  private socket: WebSocket | null = null;

  init (isFullPageReload: boolean): void {
    this.askServerForSocket();
  }

  private getSocket (): WebSocket {
    if (this.socket === null) {
      throw new Error("asked for unavailable web socket");
    }

    return this.socket;
  }

  private getSocketURI(): string {
    let url = "ws://";
    const protocol = window.location.protocol;
    if (protocol === "https:" || protocol === "wss:") {
      url = "wss://";
    }
    url += window.location.hostname;
    if (window.location.port) {
      url += (":" + window.location.port);
    }

    if (window.location.pathname) {
      const pathChunks = window.location.pathname.split("/");
      const encodedChunk = encodeURI(pathChunks[1] || "");
      if (encodedChunk) {
        url += ("/" + encodedChunk);
      }
    }
    url += "/websocket";

    return encodeURI(url);
  }

  /**
   * @private
   * Builds the URL to make the socket upgrade request.
   * If there's an existing socket, then tests what state it's in before deciding what to do.
   */
  private askServerForSocket (): void {
    if (!gwApp.enableWebsocket) {
      return;
    }

    if (gwUtil.onLoginPage()) {
      return;
    }

    if (this.getSocket().readyState <= 1) { // CONNECTING OR OPEN
      return;
    }

    if (this.getSocket().readyState === 2) { // CLOSING
      this.asyncAskForSocketAndCountErrors();
      return;
    }

    this.socket = new WebSocket(this.getSocketURI());

    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onmessage = this.onMessageFromServer.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onerror = this.onError.bind(this);
  }

  private asyncAskForSocketAndCountErrors (): void {
    if (this.errorCount++ < 3) {
      setTimeout(this.askServerForSocket.bind(this), 1000);
    } else {
      this.errorCount = 0;
    }
  }

  private clearQueue (): void {
    if (this.sendQueue.length > 0) {
      gwUtil.forEach(this.sendQueue, (jsonData) => {
        this.getSocket().send(jsonData);
      });
    }

    this.sendQueue = [];
  }

  private onOpen (): void {
    gwUtil.devlog("Socket Open");
    this.clearQueue();
  }

  private onClose (): void {
    gwUtil.devlog("Socket Closed. This is normal if you are not logged in.");
    this.asyncAskForSocketAndCountErrors();
  }

  private onError (): void {
    gwUtil.devlog("Socket Error");
  }

  /**
   * @private
   * parses the event data into system<String> and info<Object(Map)>
   *     then calls gw[system].onWebSocket(info)
   * @param event
   */
  private onMessageFromServer (event: MessageEvent): void {
    const data = JSON.parse(event.data);
    let system = data.system;

    if (!system) {
      gwUtil.devlog("data object for error: ", data);
      throw new Error("No system string found on above data object.");
    }
    if (!data.info) {
      gwUtil.devlog("data object for error: ", data);
      throw new Error("No info object found on above data object.");
    }

    const info = JSON.parse(data.info);
    system = system.replace(this.systemNameReg, "").toLowerCase();

    if (system === "test" || system === "echo") {
      gwUtil.devlog("Websocket Log Message: ", info);
      return;
    }

    const systemObj = gw.sockets[system];
    if (!gwUtil.hasValue(systemObj)) {
      throw new Error("ERROR: no system object in memory at property: " + system);
    }

    systemObj.onWebSocket(info);
  }

  private encodeSystemAndInfoForTransport (system: string, info: GwMap): string {
    const data = {
      system: system,
      info: info
    };
    return JSON.stringify(data);
  }

  /**
   * infoMap is required to be an object (hashmap). This allows the server to generically process the info
   * and get it to the correct system far more easily.
   * @param system
   * @param infoMap
   */
  sendInfoToServer (system: string, infoMap: GwMap): void {
    if (!this.socket) {
      return;
    }
    const jsonData = this.encodeSystemAndInfoForTransport(system, infoMap);

    if (this.socket.readyState !== 1) {
      this.sendQueue.push(jsonData);
    } else {
      this.clearQueue();
      this.socket.send(jsonData);
    }
  }

  // =========== TEST AND DEV METHODS

  echo (): void {
    this.sendInfoToServer("WS_ECHO", {echobackfromserver: "echo back from server"});
  }
}

export const gwWebsocket = new GwWebsocket();