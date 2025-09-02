import {GwDomNode, GwMap, HTMLCheckboxElement} from "../types/gwTypes";
import {GwRegisteredSystem} from "../core/util/GwRegisteredSystem";
import {gwUtil} from "../core/util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwInputGroup extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwInputGroup";
  }

  toggle (widget: GwDomNode, args: GwMap): void {
    const checkboxValueWidgetRenderId = args.checkboxValueWidgetRenderId;
    const expanded = (widget.querySelector("input") as HTMLCheckboxElement).checked;
    if (expanded) {
      // If the input group has already been expanded on the client at least once, then we only make the change locally
      if (widget.hasAttribute("data-gw-client-toggle")) {
        this.expandGroup(checkboxValueWidgetRenderId);
      } else {
        // if the input group is not yet expanded, meaning the client has never seen the contents, then we fire a POC
        gwUtil.refresh();
      }
    } else {
      this.collapseGroup(checkboxValueWidgetRenderId);
      widget.setAttribute("data-gw-client-toggle", "true");
    }
  }

  private expandGroup (checkboxValueWidgetRenderId: string): void {
    this.toggleGroup(checkboxValueWidgetRenderId, true);
  }

  private collapseGroup (checkboxValueWidgetRenderId: string): void {
    this.toggleGroup(checkboxValueWidgetRenderId, false);
  }

  private toggleGroup (checkboxValueWidgetRenderId: string, expand: boolean = false): void {
    const groupId = checkboxValueWidgetRenderId.replace("-_checkbox", "");
    gwUtil.conditionalAddRemoveClass(!expand, "#" + groupId, ".gw-InputGroup--collapsed");
  }
}

export const gwInputGroup = new GwInputGroup();
