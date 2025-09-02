import {GwDomNode, GwMap} from "../types/gwTypes";
import {GwRegisteredSystem} from "../core/util/GwRegisteredSystem";
import {gwUtil} from "../core/util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwPaging extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwPaging";
  }

  page (pagingButtonNode: GwDomNode, pageArgs: GwMap): void {
    gwUtil.setEventParam(pageArgs.id, pageArgs.page);
    gwUtil.fireEvent(pageArgs.id);
  }

  parent (pagingButtonNode: GwDomNode, pageArgs: GwMap): void {
    gwUtil.setEventParam(pageArgs.id, "parent");
    gwUtil.fireEvent(pageArgs.id);
  }

  child (pagingButtonNode: GwDomNode, pageArgs: GwMap): void {
    gwUtil.setEventParam(pageArgs.id, "child");
    gwUtil.fireEvent(pageArgs.id);
  }
}

export const gwPaging = new GwPaging();