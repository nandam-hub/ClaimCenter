import { gwEvents } from "../core/events/gwEvents";
import { gw } from "../core/gw";
import { gwDisplayKey } from "../core/gwDisplayKey";
import { gwFocus } from "../core/gwFocus";
import { gwAjax } from "../core/util/gwAjax";
import { GwDivBuilder } from "../core/util/GwDivBuilder";
import { GwInitializableSystem } from "../core/util/GwInitializableSystem";
import { gwUtil } from "../core/util/gwUtil";
import { GwDomNode, GwMap, GwPartialReloadDetails, HTMLInputEvent } from "../types/gwTypes";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwMediaUploader extends GwInitializableSystem {
  private readonly MAX_FILES: number = 50;
  private mediaUploadersByIdFileMap: GwMap = {};
  private readonly validImageFileTypes: GwMap = {
    "image/jpeg": true,
    "image/pjpeg": true,
    "image/png": true,
  };

  private nextRowIndex: number = 0;

  init(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    if (isFullPageReload) {
      this.mediaUploadersByIdFileMap = {};
    } else {
      //TODO: not sure about the UX of this. Possible memory leaks versus being able to update and navigate without losing imports
      //this.garbageCollectMediaUploaderFiles();
    }
  }

  getSystemName(): string {
    return "gwMediaUploader";
  }

  /**
   * Not currently used. Leaving in case we decide there's a memory leak problem
   * @param {GwDomNode} node
   * @param {GwMap} args
   * @param {HTMLInputEvent} e
   */
  // private garbageCollectMediaUploaderFiles (): void {
  //   const uploadWidgets = gwUtil.getDomNodes(".gw-MediaUploaderWidget");
  //   const idMap: GwMap = {};
  //   gwUtil.forEach(uploadWidgets, (node) => {
  //     idMap[node.id] = true;
  //   });
  //
  //   gwUtil.forEach(this.mediaUploadersByIdFileMap, (val, key) => {
  //     if (!idMap[key]) {
  //       delete this.mediaUploadersByIdFileMap[key];
  //     }
  //   });
  // }

  chooserChanged(node: GwDomNode, args: GwMap, e: HTMLInputEvent): void {
    const container = this.getContainerWidget(node);
    this.newFilesAdded(container, e.target.files);
    gwEvents.closeAllTemporaryUIElements();
  }

  drop(node: GwDomNode, args: GwMap, e: DragEvent): void {
    const container = this.getContainerWidget(node);
    this.newFilesAdded(container, e.dataTransfer ? e.dataTransfer.files : null);
  }

  dragover(node: GwDomNode, args: GwMap, e: DragEvent): void {
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }

  private processFileSize(num: number): string {
    if (num < 1024) {
      return num + " b";
    } else if (num > 1024 && num < 1048576) {
      return (num / 1024).toFixed(1) + " KB";
    } else {
      return (num / 1048576).toFixed(1) + " MB";
    }
  }

  private isValidImageFileType(file: File): boolean {
    return !!this.validImageFileTypes[file.type];
  }

  private clearFileListForContainer(container: GwDomNode): void {
    const chooser = this.getChooser(container);
    chooser.setAttribute("value", "");
    chooser.value = "";
    chooser.type = "file";

    delete this.mediaUploadersByIdFileMap[container.id];

    gwUtil.forEachReverse(gwUtil.getDomNodes(".gw-MediaUploader--file-row", container), (el) => {
      gwUtil.removeNode(el);
    });
  }

  private getNumFilesSelectedForContainer(container: GwDomNode): number {
    const fileMap = this.mediaUploadersByIdFileMap[container.id];
    if (fileMap) {
      return Object.keys(fileMap).length;
    }

    return 0;
  }

  private addNewFilesToPreviewList(container: GwDomNode, files: FileList): void {
    const previewListInner = this.getPreviewListInner(container);

    let foundAValidFile = false;
    const invalidFiles: File[] = [];
    gwUtil.forEach(files, (file) => {
      if (Object.prototype.hasOwnProperty.call(this.validImageFileTypes, file.type)) {
        foundAValidFile = true;
        previewListInner.appendChild(this.validateBuildAndCachePreviewRowFromFile(container, file));
      } else {
        invalidFiles.push(file);
      }
    });

    if (foundAValidFile) {
      gwUtil.addClass(previewListInner, "gw-hasPreviewRows");
    }

    if (invalidFiles.length > 0) {
      let errMessage = gwDisplayKey.get("Web.Client.MediaUploader.InvalidFiles");
      gwUtil.forEach(invalidFiles, (file) => (errMessage += "\n--" + file.name));
      window.alert(errMessage);
    }
  }

  private exifDoneProcessing(img: any, containerId: string, rowId: string, exifData: GwMap): void {
    const row = document.getElementById(rowId);
    if (!row) {
      return;
    }

    gwUtil.removeClass(row, "gw-loading");

    const exifCell = row.querySelector(".gw-exif-data");
    if (!exifCell) {
      return;
    }

    let exifInnerTable: HTMLDivElement;

    if (exifData && Object.keys(exifData).length > 0) {
      exifInnerTable = gwUtil.createDiv("gw-exif-table");
      gwUtil.forEach(exifData, (val, key) => {
        if (!gwUtil.hasValue(key)) {
          return;
        }
        let finalValue;
        if (gwUtil.hasValue(val)) {
          if (Array.isArray(val)) {
            finalValue = val.join(",");
          } else {
            finalValue = val.toString();
          }
        } else {
          finalValue = "-";
        }

        const valEl = GwDivBuilder.withClasses("gw-exif-cell-val").withLabel(finalValue).build();
        const keyEl = GwDivBuilder.withClasses("gw-exif-cell-key").withLabel(key).build();
        const tr = GwDivBuilder.withClasses("gw-exif-row").withChildren(keyEl, valEl).build();
        exifInnerTable.appendChild(tr);
      });
    } else {
      exifInnerTable = GwDivBuilder.withClasses("gw-no-exif-data").withLabel("-").build();
    }

    exifCell.appendChild(exifInnerTable);
    gwUtil.removeClass(exifCell as GwDomNode, "gw-loading");
  }

  private buildFilePreviewRow(
    isValidFile: boolean,
    rowId: string,
    fileName: string,
    imageEl: HTMLImageElement | null,
    fileSize: string,
    modDate: Date,
    hasInput: boolean
  ): HTMLDivElement {
    const row = gwUtil.createDiv(["gw-MediaUploader--file-row", isValidFile ? "gw-loading" : "gw-invalid-file"], { id: rowId });

    row.appendChild(
      GwDivBuilder.withClasses("gw-delete")
        .withAttr("tabindex", "0", "data-gw-click", "gwMediaUploader.deleteRow")
        .withChildren(gwUtil.createDiv("gw-icon"))
        .build()
    );

    row.appendChild(
      GwDivBuilder.withClasses("gw-filename")
        .withLabel(fileName || "-")
        .build()
    );
    const previewEl = GwDivBuilder.withClasses("gw-preview", "gw-loading").withChildren(gwUtil.createDiv("gw-loader")).build();
    if (isValidFile && imageEl) {
      previewEl.appendChild(imageEl);
    }
    row.appendChild(previewEl);
    row.appendChild(
      GwDivBuilder.withClasses("gw-file-size")
        .withLabel(fileSize || "-")
        .build()
    );
    row.appendChild(
      GwDivBuilder.withClasses("gw-mod-date")
        .withLabel(modDate.toDateString() || "-")
        .build()
    );

    row.appendChild(GwDivBuilder.withClasses("gw-exif-data", "gw-loading").withChildren(gwUtil.createDiv("gw-loader")).build());

    if (hasInput) {
      row.appendChild(GwDivBuilder.withClasses("gw-info-input-wrapper").withChildren(gwUtil.createEl("textarea", "gw-info-input")).build());
    }

    return row;
  }

  private validateBuildAndCachePreviewRowFromFile(container: GwDomNode, file: File): HTMLDivElement {
    const isValidFileType = this.isValidImageFileType(file);
    const containerId = container.id;
    let mediaFilesForContainer = this.mediaUploadersByIdFileMap[containerId];
    if (!mediaFilesForContainer) {
      this.mediaUploadersByIdFileMap[containerId] = mediaFilesForContainer = {};
    }

    const rowId = isValidFileType ? containerId + "_" + this.nextRowIndex++ : "";

    let image: HTMLImageElement | null = null;
    if (isValidFileType) {
      mediaFilesForContainer[rowId] = file;
      image = document.createElement("img");
      const srcUrl = window.URL.createObjectURL(file);
      image.src = srcUrl;

      image.onload = () => {
        (gw.globals.EXIF as any).buildDataAsync(image, gwMediaUploader.exifDoneProcessing.bind(gwMediaUploader, image, containerId, rowId));
        window.URL.revokeObjectURL(srcUrl);
        const preview = gwUtil.getSelfOrFirstParentWithClass(image, "gw-preview");
        if (preview) {
          gwUtil.removeClass(preview, "gw-loading");
        }
      };
    }

    return this.buildFilePreviewRow(
      isValidFileType,
      rowId,
      file.name,
      image,
      this.processFileSize(file.size),
      new Date(file.lastModified),
      container.hasAttribute("data-gw-has-input")
    );
  }

  private newFilesAdded(container: GwDomNode, files: FileList | null): void {
    if (!files) {
      return;
    }

    this.addNewFilesToPreviewList(container, files);
    this.updateButtons(container);
  }

  private getContainerWidget(childNode: GwDomNode): GwDomNode {
    const container = gwUtil.getSelfOrFirstParentWithClass(childNode, "gw-MediaUploaderWidget");
    if (!container) {
      throw new Error("Unable to locate container for element: " + childNode.id);
    }

    return container;
  }

  private getChooser(containerWidget: GwDomNode): HTMLInputElement {
    const el = containerWidget.querySelector(".gw-MediaUploader--choose");
    if (!el) {
      throw new Error("Unable to locate chooser for containerWidget: " + containerWidget.id);
    }

    return el as HTMLInputElement;
  }

  private getUploadButton(containerWidget: GwDomNode): GwDomNode {
    const el = containerWidget.querySelector(".gw-MediaUploader--upload");
    if (!el) {
      throw new Error("Unable to locate upload button for containerWidget: " + containerWidget.id);
    }

    return el as HTMLInputElement;
  }

  private getClearButton(containerWidget: GwDomNode): GwDomNode {
    const el = containerWidget.querySelector(".gw-header-delete");
    if (!el) {
      throw new Error("Unable to locate clear button for containerWidget: " + containerWidget.id);
    }

    return el as HTMLDivElement;
  }

  private getImportButton(containerWidget: GwDomNode): GwDomNode {
    const el = containerWidget.querySelector(".gw-MediaUploader--import");
    if (!el) {
      throw new Error("Unable to locate import button for containerWidget: " + containerWidget.id);
    }

    return el as HTMLInputElement;
  }

  private getPasteFilesInput(containerWidget: GwDomNode): HTMLInputElement {
    const el = containerWidget.querySelector(".gw-paste-target");
    if (!el) {
      throw new Error("Unable to locate paste files input for containerWidget: " + containerWidget.id);
    }

    return el as HTMLInputElement;
  }

  private getPreviewListInner(containerWidget: GwDomNode): GwDomNode {
    const el = containerWidget.querySelector(".gw-MediaUploader--files--inner");
    if (!el) {
      throw new Error("Unable to locate preview list for containerWidget: " + containerWidget.id);
    }

    return el as HTMLInputElement;
  }

  // ==========================

  private updateButtons(container: GwDomNode): void {
    const fileCount = this.getNumFilesSelectedForContainer(container);
    gwUtil.conditionalAddRemoveClass(fileCount > 0, container.querySelector(".gw-no-files-selected") as HTMLDivElement, "gw-hidden");

    const uploadButton = this.getUploadButton(container);
    const clearButton = this.getClearButton(container);
    const importButton = this.getImportButton(container);
    const pastFilesInput = this.getPasteFilesInput(container);

    if (container.hasAttribute("data-gw-uploading")) {
      gwUtil.conditionalAddRemoveAttr(true, [uploadButton, clearButton, importButton, pastFilesInput], "aria-disabled", "true");
      return;
    }

    gwUtil.conditionalAddRemoveAttr(fileCount <= 0, [uploadButton, clearButton], "aria-disabled", "true");
    gwUtil.conditionalAddRemoveAttr(fileCount >= this.MAX_FILES, [importButton, pastFilesInput], "aria-disabled", "true");

    if (fileCount >= this.MAX_FILES) {
      pastFilesInput.value = " ";
    } else {
      pastFilesInput.value = "";
    }
  }

  clear(node: GwDomNode, args: GwMap, e: Event): void {
    const container = this.getContainerWidget(node);
    this.clearFileListForContainer(container);
    this.updateButtons(container);
  }

  deleteRow(node: GwDomNode, args: GwMap, e: Event): void {
    node.setAttribute("aria-disabled", "true");
    const row = gwUtil.getSelfOrFirstParentWithClass(node, "gw-MediaUploader--file-row");
    if (!row) {
      return;
    }
    gwUtil.addClass(row, "gw-deleted");

    const container = this.getContainerWidget(row);
    if (!container) {
      return;
    }

    const rows = this.mediaUploadersByIdFileMap[container.id];
    delete rows[row.id];

    window.setTimeout(() => {
      // If focus is still on the delete button we are about to remove, then punt it to another row
      if (document.activeElement === node) {
        const nextRow = $(row).next(".gw-MediaUploader--file-row")[0] || $(row).prev(".gw-MediaUploader--file-row")[0];
        gwUtil.removeNode(row);
        this.updateButtons(container);

        if (!gwFocus.forceFocusIgnoreIfNull(gwUtil.getDomNode(".gw-delete", nextRow))) {
          gwFocus.restoreLastFocusNodeIfAvailable(true);
        }
      }
    }, 200);
  }

  private uploadComplete(containerId: string, e: Event): void {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    this.clearFileListForContainer(container);
    this.uploadCompletedErroredOrAborted(containerId, e);
  }

  private uploadProgress(containerId: string, e: ProgressEvent): void {
    if (e.lengthComputable) {
      //const percentComplete = e.loaded / e.total; //TODO: not implemented
    }
  }

  private uploadError(containerId: string, e: ProgressEvent): void {
    console.log("Upload File Error: " + containerId);
    this.uploadCompletedErroredOrAborted(containerId, e);
  }

  private uploadAbort(containerId: string, e: ProgressEvent): void {
    console.log("Upload Aborted: " + containerId);
    this.uploadCompletedErroredOrAborted(containerId, e);
  }

  private uploadCompletedErroredOrAborted(containerId: string, e: Event): void {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    container.removeAttribute("data-gw-uploading");
    this.updateButtons(container);
  }

  input(node: HTMLInputElement, args: GwMap, e: HTMLInputEvent): void {
    node.value = "";
  }

  filesPasted(node: GwDomNode, args: GwMap, e: ClipboardEvent): void {
    const container = this.getContainerWidget(node);
    this.newFilesAdded(container, e.clipboardData ? e.clipboardData.files : null);
  }

  upload(node: GwDomNode, args: GwMap, e: ProgressEvent): void {
    const container = this.getContainerWidget(node);
    const containerId = container.id;
    const files = this.mediaUploadersByIdFileMap[containerId];
    if (!files) {
      return;
    }

    const valueWidgetId = args.id;

    const formData = new FormData();
    formData.append("widgetId", valueWidgetId);
    gwUtil.forEach(files, (file) => {
      formData.append("fileContent", file);
    });

    formData.append(gwUtil.CSRF_PARAM_NAME, gwAjax.getCsrfToken());

    const xhr = new XMLHttpRequest();

    xhr.addEventListener("load", this.uploadComplete.bind(this, containerId));
    xhr.addEventListener("progress", this.uploadProgress.bind(this, containerId));
    xhr.addEventListener("error", this.uploadError.bind(this, containerId));
    xhr.addEventListener("abort", this.uploadAbort.bind(this, containerId));

    xhr.open("POST", gwUtil.getUtilityInfo("fileUploadUrl"));
    xhr.send(formData);

    container.setAttribute("data-gw-uploading", "true");
    this.updateButtons(container);
  }
}

export const gwMediaUploader = new GwMediaUploader();
