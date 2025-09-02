import {GwDomNode, GwMap} from "../types/gwTypes";
import {GwRegisteredSystem} from "../core/util/GwRegisteredSystem";
import {GwFileRequest} from "../core/GwFileRequest";
import {gwUtil} from "../core/util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwNoteBody extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwNoteBody";
  }

  downloadDocument (triggerNode: GwDomNode, args: GwMap): void {
    new GwFileRequest(true).startDownloadRequestForParameters({
      widgetId: args.id,
      docId: args.docId,
      contentDisposition: gwUtil.getUtilityFlag("allow_inline_file_downloads") ? "inline" : "attachment"
    });
  }
}

export const gwNoteBody = new GwNoteBody();