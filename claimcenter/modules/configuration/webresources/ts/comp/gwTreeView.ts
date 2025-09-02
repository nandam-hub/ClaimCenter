import {GwDomNode, GwMap} from "../types/gwTypes";
import {gwEvents} from "../core/events/gwEvents";
import {GwRegisteredSystem} from "../core/util/GwRegisteredSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwTreeView extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwTreeView";
  }

  /**
   * Handles commands for TreeViews - Expanding, Collapsing, Selecting
   */
  treeViewAction (treeViewNode: GwDomNode, args: GwMap): void {
    const treeViewInput = $("#gw-util--treeview");
    treeViewInput.attr("name", args.id);
    treeViewInput.val(args.act + ";" + args.nodeId);

    gwEvents.methods.fireEvent(treeViewNode, args, undefined, () => {
      // Reset treeview form field
      treeViewInput.attr("name", "gw-util--treeview");
      treeViewInput.val("");
    });
  }
}

export const gwTreeView = new GwTreeView();