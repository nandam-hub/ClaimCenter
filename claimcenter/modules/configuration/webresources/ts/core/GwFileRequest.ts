import { GwMap } from "../types/gwTypes";
import { gwEvents } from "./events/gwEvents";
import { gwPerfAnalyzer } from "./events/gwPerfAnalyzer";
import { gwPrefPanel } from "./gwPrefPanel";
import { gwAjax } from "./util/gwAjax";
import { gwUtil } from "./util/gwUtil";
import { formToArray } from "./gwFormSubmit";
import {gwMultiTab} from "./gwMultiTab";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwFileRequest {
  private static readonly REQUEST_ID_PARAM: string = "downloadRequestId";
  private static readonly STATUS_PARAM: string = "__downloadStatus";
  private static readonly WAIT_TILL_STATUS_REQUEST: number = 500;
  private static readonly NUMBER_OF_RETRY_ATTEMPTS: number = 10;

  private readonly _requestId: string = this.generateSimpleRequestId();
  private readonly _isInline: boolean;

  constructor(inline: boolean) {
    this._isInline = gwUtil.getUtilityFlag("gw-allow-inline-file-downloads") ? inline : false;
  }

  startDownloadRequestForParameters(parameters: GwMap): void {
    const paramKV = gwMultiTab.getSessionParamKeyValIfMultiTab();
    const contextParam = paramKV ? `?${paramKV.key}=${paramKV.value}` : ""
    this.submitForm("FileContents.do" + contextParam, parameters);
  }

  startDownloadRequestForEventSource(eventSource: string): void {
    if (eventSource) {
      gwPerfAnalyzer.startRequest(eventSource);
      gwUtil.setEventSource(eventSource);
    }

    this.submitForm("", {});
  }

  private getEnableUIEventsDuringFileDownload(): boolean {
    return !!gwPrefPanel.getPrefValueByPrefName("enableUIEventsDuringFileDownload");
  }

  private possiblyDisableEvents(): void {
    if (this.getEnableUIEventsDuringFileDownload()) {
      gwEvents.disableEvents();
    }
  }

  private possiblyEnableEvents(): void {
    if (this.getEnableUIEventsDuringFileDownload()) {
      gwEvents.enableEvents();
    }
  }

  /**
   * Current implementation simply alerts the user of the message
   * @param message
   * @private
   */
  private handleStatusError(message: string): void {
    window.alert(`File Error: ${message}.`);
  }

  /**
   * Submit main form
   * @param action: form action
   * @param parameters: additional parameters to submit
   */
  private submitForm(action: string, parameters: GwMap): void {
    const htmlForm: HTMLFormElement = $("#gw-root-form")[0] as HTMLFormElement;
    const tempForm = htmlForm.cloneNode(true) as HTMLFormElement;

    this.wrapWithParameters(tempForm, parameters, () => {
      const target = "formWindow" + this._requestId;
      const downloadWindow: Window | HTMLIFrameElement | null = this.createDownloadWindow(target);
      if (!downloadWindow) {
        console.error("Cannot open new window. Stop downloading");
        return;
      }

      tempForm.action = action;
      tempForm.target = target;

      document.body.appendChild(tempForm);

      // clone the form, run our formToArray to get custom values
      // Iterate all values, remove corresponding inputs on the form, create new ones with new values
      // then submit the temp form, and remove it from the DOM

      formToArray(htmlForm).forEach(({name, value, type}) => {
        tempForm.querySelectorAll(`[name='${name}']`).forEach((el) => {
          // Can get an ND error here because of the live nature of an Element List
          if (el.parentNode === tempForm) {
            tempForm.removeChild(el);
          }
        });

        if (Array.isArray(value) || value instanceof FileList) {
          Array.from(value as (string | File)[]).forEach((innerVal: File | string) => {
            this.createInput(tempForm, name, innerVal, type);
          });
        } else {
          this.createInput(tempForm, name, value as File | string, type);
        }
      });

      tempForm.submit();
      document.body.removeChild(tempForm);

      this.possiblyDisableEvents();
      this.checkDownloadStatus(downloadWindow, GwFileRequest.NUMBER_OF_RETRY_ATTEMPTS);

      gwUtil.clearEventParam();
      gwPerfAnalyzer.requestSent();
    });
  }

  private wrapWithParameters(form: HTMLFormElement, parameters: GwMap, formCode: () => void): void {
    const inputs = [];
    for (const param in parameters) {
      if (!Object.prototype.hasOwnProperty.call(parameters, param)) {
        continue;
      }

      inputs.push(this.createInput(form, param, parameters[param]));
    }

    inputs.push(this.createInput(form, GwFileRequest.REQUEST_ID_PARAM, this._requestId));

    formCode();

    inputs.forEach(($input) => {
      $input.remove();
    });
  }

  private createInput(form: HTMLFormElement, name: string, value: string | File, type: string = "hidden"): any {
    const $input = $("<input>", {
      name: name,
      value: value,
      type: type,
    });

    $(form).append($input);
    return $input;
  }

  private checkDownloadStatus(downloadWindow: Window | HTMLIFrameElement, numRetries: number = 0): void {
    setTimeout(() => {
      const parameters: GwMap = {};
      parameters[GwFileRequest.STATUS_PARAM] = this._requestId;
      gwAjax.ajaxRequest(
        parameters,
        (response: any) => {
          if (response.success || response.statusCode === "SUCCESS") {
            // now we can only close the window if it was an attachment
            // Because otherwise we might close the window the user is looking at the file in
            if (!this._isInline) {
              this.closeDownloadWindow(downloadWindow);
            }
            this.possiblyEnableEvents();
          } else if (response.statusCode === "ERROR") {
            this.handleStatusError(this.convertFileDownloadServerErrorHtmlToText(response.error));
            this.closeDownloadWindow(downloadWindow);
            this.possiblyEnableEvents();
          } else if (response.statusCode === "UNKNOWN") {
            if (numRetries > 0) {
              numRetries--;
              this.checkDownloadStatus(downloadWindow, numRetries);
            } else {
              this.handleStatusError("Exceeded maximum number of retry attempts determining download file status.");
              this.closeDownloadWindow(downloadWindow);
              this.possiblyEnableEvents();
            }
          }
        },
        (error) => {
          // status request failed, just close the window likely it does not contain anything interesting
          this.closeDownloadWindow(downloadWindow);
          gwEvents.enableEvents();
        }
      );
    }, GwFileRequest.WAIT_TILL_STATUS_REQUEST);
  }

  private createDownloadWindow(target: string): Window | HTMLIFrameElement | null {
    if (this._isInline) {
      return window.open("about:blank", target);
    } else {
      const iFrame = document.createElement("iframe");
      iFrame.name = target;
      iFrame.style.visibility = "hidden";
      document.body.appendChild(iFrame);
      return iFrame;
    }
  }

  private closeDownloadWindow(download: Window | HTMLIFrameElement): void {
    // Cannot just do instanceof Window here; on Edge/IE the result of window.open is not a Window(!)
    if (this._isInline) {
      (download as Window).close();
    } else {
      document.body.removeChild(download as HTMLIFrameElement);
    }
  }

  private convertFileDownloadServerErrorHtmlToText(html: string | null): string {
    if (html === null) {
      return this.getUnknownFileDownloadErrorMessage();
    }

    const div = gwUtil.createDiv("gw-hidden");
    gwUtil.dangerouslySetInnerHTML(div, html);

    // This grabs all the chunks of html that the user could click on to see an error message
    // Then hijacks all of the text and joins it as a string
    return Array.from(div.querySelectorAll("[data-gw-click*='gwMessages.highlight']"))
      .map((el) => el.textContent || this.getUnknownFileDownloadErrorMessage())
      .join(". ");
  }

  private getUnknownFileDownloadErrorMessage(): string {
    return "Unknown file download error";
  }

  private generateSimpleRequestId(): string {
    const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let id = "";

    for (let i = 0; i < 8; i++) {
      const pos = gwUtil.getRandomInt(0, possibleChars.length);
      id += possibleChars.charAt(pos);
    }

    return `${id}-${Date.now()}-${window.performance.now()}`;
  }
}
