import {GwRegisteredSystem} from "./util/GwRegisteredSystem";
import {GwDomNode} from "../types/gwTypes";
import {gwKeys} from "./events/gwKeys";
import {GwShortcutInfo} from "./GwShortcutInfo";
import {gwUtil} from "./util/gwUtil";

export class GwShortcuts extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwShortcuts";
  }

  private registerShortcut (widgetEl: GwDomNode, shortcutAttribute: string): void {
    const shortcutAttrib = widgetEl.getAttribute(shortcutAttribute);
    if (!shortcutAttrib) {
      return;
    }
    try {
      gwKeys.addServerKeyboardShortcut(new GwShortcutInfo(JSON.parse(shortcutAttrib)));
    } catch (e) {
      gwUtil.devlog("Failed to register shortcut for widget: ", widgetEl.id);
      return;
    }
  }

  // Looks for and registers any shortcuts for the given node
  registerShortcuts (widgetEl: GwDomNode): void {
    // Check for shortcut and default (default is treated as a shortcut for ENTER)
    for (const attribIterator of ["data-gw-shortcut", "data-gw-default"]) {
      if (widgetEl.hasAttribute(attribIterator)) {
        this.registerShortcut(widgetEl, attribIterator);
      }
    }
  }

}

export const gwShortcuts = new GwShortcuts();