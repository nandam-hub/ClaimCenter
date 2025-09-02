import {GwMap} from "../../types/gwTypes";
import {gwUtil} from "../util/gwUtil";
import {GwOrderDependentInitializableSystem} from "../util/GwOrderDependentInitializableSystem";
import {gwFocus} from "../gwFocus";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export enum GwServerEventEnum {
  STARTED_EDITING = "STARTED_EDITING",
  CANCELED_EDITING = "CANCELED_EDITING",
  COMMITTED = "COMMITTED",
  FAILED_COMMITTING = "FAILED_COMMITTING"
}

export class GwServerEvents extends GwOrderDependentInitializableSystem {
  getSystemName (): string {
    return "gwServerEvents";
  }

  orderSpecificInit (): void {
    this.processServerEvents();
  }

  processServerEvents (): void {
    const serverEvents = gwUtil.getUtilityJson("gw-serverEvents");
    if (serverEvents) {
      serverEvents.forEach((serverEvent: GwMap) => {
        this.handleEvent(serverEvent.event, serverEvent.args);
      });
    }
  }

  handleEvent (event: GwServerEventEnum, args: GwMap): void {
    switch (event) {
      case GwServerEventEnum.STARTED_EDITING:
        this.onStartEditing(args);
        break;
      case GwServerEventEnum.CANCELED_EDITING:
        break;
      case GwServerEventEnum.COMMITTED:
        break;
      case GwServerEventEnum.FAILED_COMMITTING:
        break;
      default:
        throw new Error("Received unknown Server Event: " + event);
    }
  }

  onStartEditing (args: GwMap): void {
    const target = args.target;
    let container;

    if (target === "Worksheet") {
      container = gwUtil.getDomNode("#gw-south-panel");
    } else {
      container = gwUtil.getDomNode("#gw-center-bottom-section");
    }
    if (container) {
      const firstInput = $(":input", container).first()[0];
      if (firstInput) {
        gwFocus.setFocusFromServer(firstInput);
      }
    }
  }
}

export const gwServerEvents = new GwServerEvents();
