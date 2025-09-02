import {gwUtil} from "./util/gwUtil";
import {GwRegisteredSystem} from "./util/GwRegisteredSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwInternalTools extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwInternalTools";
  }

  showPcfStructure (): void {
    window.open(
        gwUtil.getCurrentUrlWithNewHandlerName("locinfo"),
      "locinfo"
    );
  }

  showFullPcfStructure (): void {
    window.open(
        gwUtil.getCurrentUrlWithNewHandlerName("fulllocinfo"),
      "fulllocinfo"
    );
  }

  reloadPCF (): void {
    gwUtil.fireEvent("_reloadPCF_");
  }

  /* TODO These two should go away once we support shortcuts from the server. They are registered in TabBar.pcf */
  goToInternalTools (): void {
    gwUtil.fireEvent("TabBar-InternalToolsHiddenLink_act");
  }

  goToProfiler (): void {
    gwUtil.fireEvent("TabBar-ProfilerHiddenLink_act");
  }

  editCurrentPageInStudio (): void {
    $.get(gwUtil.getCurrentUrlWithNewHandlerName("editpcf"));
  }
}

export const gwInternalTools = new GwInternalTools();