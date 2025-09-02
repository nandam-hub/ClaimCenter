import { gwFileValue } from "../comp/gwFileValue";
import { gwApp } from "../plApp";
import { GwMap } from "../types/gwTypes";
import { gwConfirm } from "./gwConfirm";
import { gwFocus } from "./gwFocus";
import { gwStorage } from "./gwStorage";
import { GwOrderDependentInitializableSystem } from "./util/GwOrderDependentInitializableSystem";
import { gwUtil } from "./util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export enum GwClientCommand {
  REDIRECT = "REDIRECT",
  POPUP = "POPUP",
  REGISTER_DROPZONES = "REGISTER_DROPZONES",
  DEFERRED_DOWNLOAD = "DEFERRED_DOWNLOAD",
  FOCUS = "FOCUS",
}

export class GwOps extends GwOrderDependentInitializableSystem {
  getSystemName(): string {
    return "gwOps";
  }

  orderSpecificInit(): void {
    this.processClientOps();
  }

  processClientOps(): void {
    const clientCommands = gwUtil.getUtilityJson("gw-clientCommands");
    if (clientCommands) {
      clientCommands.forEach((clientCommand: GwMap) => {
        this.handleCommand(clientCommand.command, clientCommand.args);
      });
    }
  }

  handleCommand(command: GwClientCommand, args: GwMap): void {
    switch (command) {
      case GwClientCommand.REDIRECT:
        this.redirect(args.method, args.url, args.postParams, args.isMultiClusterNav, args.isLogout);
        break;
      case GwClientCommand.POPUP:
        this.popup(args.url, args.target, JSON.parse(args.properties || "{}"));
        break;
      case GwClientCommand.REGISTER_DROPZONES:
        gwFileValue.registerDropzone(args);
        break;
      case GwClientCommand.DEFERRED_DOWNLOAD:
        gwFileValue.handleDeferredDownload(args);
        break;
      case GwClientCommand.FOCUS: {
        const focusNode = gwUtil.getDomNode("#" + args.focusId);
        if (focusNode) {
          gwFocus.setFocusFromServer(focusNode);
        }
        break;
      }
      default:
        gwUtil.devlog("Encountered unknown client command: ", command);
    }
  }

  redirect(method: string, url: string, parameters: GwMap, isMultiClusterNav: string, isLogout: boolean): void {
    if (isLogout) {
      gwStorage.clearStorage();
    }

    // Possibly set up an onbeforeunload handler so user has a chance to cancel navigating
    // away. If the user does cancel then the Edge browser will throw an exception
    const preventUnloadAlert = isMultiClusterNav === "true" || gwConfirm.lastEventWasConfirmed();
    gwApp.prepareForExitPointNavigation(preventUnloadAlert);
    if (method === "POST") {
      const form = document.createElement("form");
      form.action = url;
      form.method = "POST";
      form.target = "_top";

      if (parameters) {
        for (const name in parameters) {
          if (Object.prototype.hasOwnProperty.call(parameters, name)) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = parameters[name];
            form.appendChild(input);
          }
        }
      }

      document.body.appendChild(form);
      try {
        form.submit();
      } catch (e) {
        // Ignore; caused by cancellation of onbeforeunload confirmation on Edge
      }
      document.body.removeChild(form);
    } else {
      try {
        window.location.href = url;
      } catch (e) {
        // Ignore; caused by cancellation of onbeforeunload confirmation on Edge
      }
    }
  }

  popup(url?: string, target?: string, properties: Record<string, string> = {}): void {
    const propertyMap = { ...properties };

    const width: number | null = parseInt(propertyMap.width) || null;
    const height: number | null = parseInt(propertyMap.height) || null;

    // We use "popup" in PCFs to mean "not a redirect"
    // But we only distinguish between a new url in a tab vs a new window "popup"
    // Based on if the user has specified a width and height or not
    // So if the user has not specified a width and a height we need to ensure to NOT provide a window features map
    // As providing any properties on the features map, is interpreted by the browser as us having set popup=true
    if (!width || !height) {
      window.open(url, target || "_blank");
    } else {
      propertyMap.scrollbars = "true";
      propertyMap.resizable = "true";
      propertyMap.popup = "true";

      const featureString = gwUtil.mapToKeyValueString(propertyMap);
      window.open(url, target || "_blank", featureString);
    }
  }
}

export const gwOps = new GwOps();
