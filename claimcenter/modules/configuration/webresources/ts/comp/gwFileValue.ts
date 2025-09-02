import { gwDisplayKey } from "../core/gwDisplayKey";
import { GwFileRequest } from "../core/GwFileRequest";
import { gwAjax } from "../core/util/gwAjax";
import { GwDivBuilder } from "../core/util/GwDivBuilder";
import { GwRegisteredSystem } from "../core/util/GwRegisteredSystem";
import { gwUtil } from "../core/util/gwUtil";
import { GwDomNode, GwEventType, GwMap, GwValueWidgetElement, HTMLInputEvent } from "../types/gwTypes";
import {gwMultiTab} from "../core/gwMultiTab";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwFileValue extends GwRegisteredSystem {
  static readonly BYTES_PER_MB: number = 1048576;

  getSystemName(): string {
    return "gwFileValue";
  }

  private readonly fileInputSuffix: string = "--file";
  private readonly fileTextSuffix: string = "--text";

  browseHandler(node: GwDomNode, args: GwMap, event: GwEventType): void {
    this.getFileInputOrThrow(args.id).click();

    event.preventDefault();
  }

  fileChangeHandler(valueWidget: GwValueWidgetElement, args: GwMap, event: GwEventType): void {
    const id = valueWidget.id;
    const input = this.getFileInput(id);
    if (!input || !input.files) {
      return;
    }

    this.uploadFiles(id, this.fileListAsArray(input.files), () => {
      this.clearFileInput(input);
      gwUtil.refresh();
    });
  }

  registerDropzone(dropzoneMap: GwMap): void {
    dropzoneMap.dropzoneElementIds.forEach((elementId: string) => {
      let node = gwUtil.getDomNodeOrThrow("#" + elementId);

      if (gwUtil.hasClass(node, "gw-ScreenWidget")) {
        node = this.addFileUploadAreaToScreenWidget(node, dropzoneMap.fileInputElementId);
      }

      node.setAttribute("data-gw-dragover", "gwFileValue.dragover");
      node.setAttribute("data-gw-drop", "gwFileValue.dropFileHandler sourceWidgetId:" + dropzoneMap.fileInputElementId);
    });
  }

  private addFileUploadAreaToScreenWidget(screenWidget: HTMLElement, fileInputElementId: string): HTMLDivElement {
    let outer = screenWidget.querySelector(".gw-fileUploadArea") as HTMLDivElement;
    if (outer) {
      return outer;
    }

    const inner = GwDivBuilder.withClasses("gw-fileUploadArea--inner")
      .withChildren(GwDivBuilder.withClasses("gw-label").withLabel(gwDisplayKey.get("Web.Client.Upload.DropFilesHere")).build())
      .build();

    inner.setAttribute("data-gw-dragenter", "gwFileValue.dragenter");
    inner.setAttribute("data-gw-dragleave", "gwFileValue.dragleave");
    inner.setAttribute("data-gw-dragend", "gwFileValue.dragend");

    const pasteTitle = GwDivBuilder.withClasses("gw-paste-title").withLabel(gwDisplayKey.get("Web.Client.Upload.PasteFilesHere")).build();
    const inputAttr = {
      "data-gw-input": "gwFileValue.input",
      "data-gw-paste": "gwFileValue.pasteFileHandler sourceWidgetId:" + fileInputElementId,
      placeholder: gwDisplayKey.get("Web.Client.Upload.PasteFilesHere"),
    };
    const pasteInput = gwUtil.createEl("input", "gw-paste-input gw-noTrack", inputAttr);
    const pasteSubtitle = GwDivBuilder.withClasses("gw-paste-subtitle")
      .withLabel(gwDisplayKey.get("Web.Client.Upload.PasteFilesHereSubtitle"))
      .build();
    const right = GwDivBuilder.withClasses("gw-fileUploadArea--right").withChildren(pasteTitle, pasteInput, pasteSubtitle).build();

    outer = GwDivBuilder.withClasses("gw-fileUploadArea").withChildren(inner, right).build();

    screenWidget.insertBefore(outer, screenWidget.firstChild);
    return outer;
  }

  input(node: HTMLInputElement, args: GwMap, e: HTMLInputEvent): void {
    node.value = "";
  }

  pasteFileHandler(node: GwDomNode, args: GwMap, event: ClipboardEvent): void {
    const clipboard = event.clipboardData;
    if (clipboard && clipboard.types && clipboard.types.length === 1 && clipboard.types[0] === "Files") {
      let files: File[] = Array.from(clipboard.items)
        .slice(0)
        .map((item: DataTransferItem) => {
          return item.getAsFile();
        })
        .filter<File>((possiblyNullFile: File | null): possiblyNullFile is File => {
          return !!possiblyNullFile;
        });

      if (files.length === 0) {
        files = Array.from(clipboard.files);
      }

      if (files.length === 0) {
        window.alert(gwDisplayKey.get("Web.Client.Alert.NoFilesFoundInClipboardPaste"));
      } else {
        this.handleNewFiles(args.sourceWidgetId, files);
      }
    } else {
      window.alert(gwDisplayKey.get("Web.Client.Alert.NoFilesFoundInClipboardPaste"));
    }
  }

  dropFileHandler(node: GwDomNode, args: GwMap, event: DragEvent): void {
    const innerFileUpload = node.querySelector(".gw-fileUploadArea--inner");
    if (innerFileUpload) {
      this.dragend(innerFileUpload as HTMLDivElement, args, event);
    }

    this.handleNewFiles(args.sourceWidgetId, this.fileListAsArray(event.dataTransfer ? event.dataTransfer.files : null));
  }

  private handleNewFiles(id: string, files: File[]): void {
    this.uploadFiles(id, files, () => {
      this.clearFileInput(this.getFileInputOrThrow(id));
      gwUtil.refresh();
    });
  }

  dragover(node: GwDomNode, args: GwMap, e: DragEvent): void {
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }

  dragenter(node: GwDomNode, args: GwMap, e: DragEvent): void {
    const fileUploadArea = gwUtil.getSelfOrFirstParentWithClass(node, ".gw-fileUploadArea--inner");
    if (!fileUploadArea) {
      return;
    }

    gwUtil.addClass(fileUploadArea, "gw-drag-hover");
  }

  dragleave(node: GwDomNode, args: GwMap, e: DragEvent): void {
    this.dragend(node, args, e);
  }

  dragend(node: GwDomNode, args: GwMap, e: DragEvent): void {
    const fileUploadArea = gwUtil.getSelfOrFirstParentWithClass(node, ".gw-fileUploadArea--inner");
    if (!fileUploadArea) {
      return;
    }

    gwUtil.removeClass(fileUploadArea, "gw-drag-hover");
  }

  private convertToMB(size: number): number {
    return Math.round((size / GwFileValue.BYTES_PER_MB) * 10) / 10;
  }

  private showAlert(messageText: string): void {
    alert(messageText);
  }

  private uploadSizeError(sizeLimit: number, tooBigFileNames: string[]): void {
    if (!tooBigFileNames || tooBigFileNames.length < 1) {
      return;
    }

    let errMsg = gwDisplayKey.get("Web.Client.Document.Upload.Failure.Size", tooBigFileNames.length, this.convertToMB(sizeLimit));
    const maxFilesInMsg = 20;
    const len = Math.min(tooBigFileNames.length, maxFilesInMsg);
    for (let i = 0; i < len; i++) {
      errMsg += "\n\t" + tooBigFileNames[i];
    }
    if (tooBigFileNames.length > maxFilesInMsg) {
      errMsg += "\n\t...";
    }
    this.showAlert(errMsg);
  }

  private uploadTotalSizeError(numRejectedFiles: number, totalSize: number, availableSpace: number): void {
    if (totalSize <= 0) {
      return;
    }
    this.showAlert(
      gwDisplayKey.get(
        "Web.Client.Document.Upload.Failure.TotalSize",
        numRejectedFiles,
        this.convertToMB(totalSize),
        this.convertToMB(availableSpace)
      )
    );
  }

  private uploadTotalCountError(numRejectedFiles: number, availableCount: number): void {
    if (numRejectedFiles <= 0) {
      return;
    }
    this.showAlert(gwDisplayKey.get("Web.Client.Document.Upload.Failure.TotalCount", numRejectedFiles, availableCount));
  }

  private uploadOtherError(otherErrors: number[]): void {
    const otherErrorCount = otherErrors.length;
    if (otherErrorCount < 1) {
      return;
    }

    let errMsg = "";
    const maxOtherErrorsInMsg = 20;
    otherErrors.length = maxOtherErrorsInMsg;
    otherErrors.forEach((otherError) => {
      if (errMsg.length !== 0) {
        errMsg += "\n";
      }
      errMsg += otherError;
    });

    if (otherErrorCount > maxOtherErrorsInMsg) {
      errMsg += "\n...";
    }

    // HTML encoding is unnecessary for showAlert()
    this.showAlert(errMsg);
  }

  private processUploadResponse(response: any): void {
    if (response.errors) {
      for (const errorGeneralIndex in response.errors.errorGeneral) {
        if (Object.hasOwnProperty.call(response.errors.errorGeneral, errorGeneralIndex)) {
          this.showAlert(response.errors.errorGeneral[errorGeneralIndex]);
        }
      }
      if (response.errors.errorReasonSize) {
        this.uploadSizeError(response.errors.errorReasonSize.sizeLimit, response.errors.errorReasonSize.files);
      }
      if (response.errors.errorReasonTotalSize) {
        if (response.errors.errorReasonTotalSize.rejectedDueToSizeCount) {
          this.uploadTotalSizeError(
            response.errors.errorReasonTotalSize.rejectedDueToSizeCount,
            response.errors.errorReasonTotalSize.spaceRequested,
            response.errors.errorReasonTotalSize.availableSpace
          );
        }
        if (response.errors.errorReasonTotalSize.rejectedDueToQuotaExceededCount) {
          this.uploadTotalCountError(
            response.errors.errorReasonTotalSize.rejectedDueToQuotaExceededCount,
            response.errors.errorReasonTotalSize.availableCount
          );
        }
      }
      if (response.errors.errorReasonOther) {
        this.uploadOtherError(response.errors.errorReasonOther);
      }
    }
    return response.success;
  }

  private verifyUploadFiles(fileWidgetId: string, files: File[]): boolean {
    const fileWidget = document.getElementById(fileWidgetId);
    if (fileWidget) {
      const uploadFileInfoJsonStr = fileWidget.getAttribute("data-gw-file-info");
      if (uploadFileInfoJsonStr) {
        const uploadFileInfo = JSON.parse(uploadFileInfoJsonStr);

        const filteredFiles = [];
        const tooBigFileNames = [];

        let totalSize = 0;

        // First calculate the total upload size of all files that
        // do not exceed the individual size limit
        const len = files.length;
        if (Object.prototype.hasOwnProperty.call(uploadFileInfo, "maxFileSize")) {
          for (let i = 0; i < len; i++) {
            if (files[i].size <= uploadFileInfo.maxFileSize) {
              filteredFiles[filteredFiles.length] = files[i];
              totalSize += files[i].size;
            } else {
              tooBigFileNames.push(files[i].name);
            }
          }
          // Show an alert for individual files too big
          if (tooBigFileNames.length > 0) {
            this.uploadSizeError(uploadFileInfo.maxFileSize, tooBigFileNames);
            return false;
          }
          // Don't bother continuing if no files qualified for upload
          if (filteredFiles.length <= 0) {
            gwUtil.devlog("Could not find any qualified files.");
            return false;
          }
        }

        // Reject the entire upload if the total size is too big
        // Note that 'availableSpace' may be less than 'totalSizeLimit' because of prior files
        // uploaded in this session that have not yet been committed.
        if (Object.prototype.hasOwnProperty.call(uploadFileInfo, "availableSpace") && totalSize > uploadFileInfo.availableSpace) {
          this.uploadTotalSizeError(filteredFiles.length, totalSize, uploadFileInfo.availableSpace);
          return false;
        }

        // Reject the entire upload if the total count is too big
        // Note that 'availableCount' may be less than 'countLimit' because of prior files
        // uploaded in this session that have not yet been committed.
        if (
          Object.prototype.hasOwnProperty.call(uploadFileInfo, "maxFileUploadCount") &&
          uploadFileInfo.maxFileUploadCount > 0 &&
          filteredFiles.length > uploadFileInfo.availableFileUploadCount
        ) {
          this.uploadTotalCountError(filteredFiles.length, uploadFileInfo.availableFileUploadCount);
          return false;
        }
      }
    }
    return true;
  }

  private uploadFiles(fileWidgetId: string, files: File[], completeCallback: () => unknown): void {
    if (!this.verifyUploadFiles(fileWidgetId, files)) {
      return;
    }

    const $fileText = $("#" + fileWidgetId + this.fileTextSuffix).first();
    $fileText.val(files.map((f) => f.name).join(" "));

    let fileUploadUrl = gwMultiTab.appendOrReplaceContextParamToUrlUsingLocationUrl(new URL(gwUtil.getUtilityInfo("fileUploadUrl")));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", fileUploadUrl);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.send(this.createFormData(fileWidgetId, files));
    xhr.addEventListener("load", () => {
      // TODO skwon: Any way we can determine whether it is actually json?  Response type?  Tie to return code?
      try {
        const data = JSON.parse(xhr.response);
        this.processUploadResponse(data);
        completeCallback();
        this.postOnChange(fileWidgetId);
      } catch(e) {
        window.alert(gwDisplayKey.get("Web.Client.UnexpectedFileUploadResponse") + " " + xhr.response.slice(0, 100) + "...");
      }
    });
  }

  handleDeferredDownload(parameters: GwMap): void {
    const isInline: boolean = gwUtil.getUtilityFlag("allow_inline_file_downloads") ? parameters.contentDisposition === "inline" : false;
    new GwFileRequest(isInline).startDownloadRequestForParameters({
      widgetId: parameters.fileInputElementId,
      contentDisposition: parameters.contentDisposition,
    });
  }

  downloadHandler(node: GwDomNode, args: GwMap, event: GwEventType): void {
    new GwFileRequest(args.inline === "true").startDownloadRequestForEventSource(args.id + args.suffix);
  }

  private postOnChange(fileWidgetId: string): void {
    const postOnChange = this.getFileInputOrThrow(fileWidgetId).getAttribute("data-gw-postOnChange");
    if (postOnChange === "refresh") {
      gwUtil.refresh(fileWidgetId);
    }
  }

  private getFileInput(fileWidgetId: string): HTMLInputElement | null {
    return gwUtil.getInputElement("#" + fileWidgetId + this.fileInputSuffix) as HTMLInputElement | null;
  }

  private getFileInputOrThrow(fileWidgetId: string): HTMLInputElement {
    const fileInput = this.getFileInput(fileWidgetId);
    if (fileInput === null) {
      throw new Error("Unable to locate file input widget for: " + fileWidgetId);
    }

    return fileInput;
  }

  private createFormData(widgetId: string, files: File[]): FormData {
    const fd = new FormData();
    fd.append("widgetId", widgetId);
    for (let i = 0; i < files.length; i++) {
      fd.append("fileContent", files[i]);
    }

    fd.append(gwUtil.CSRF_PARAM_NAME, gwAjax.getCsrfToken());
    return fd;
  }

  private clearFileInput(fileInput: HTMLInputElement): void {
    fileInput.setAttribute("value", "");
  }

  private fileListAsArray(files: FileList | null): File[] {
    return files ? Array.prototype.slice.call(files, 0) : [];
  }
}

export const gwFileValue = new GwFileValue();
