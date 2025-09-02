/**
 * This file contains test utilities to help with automated testing of the client side of Pebbles e.g. via Selenium
 */
import { gwApp } from "../plApp";
import { GwDomNode, GwEventType, GwMap } from "../types/gwTypes";
import { gwEvents } from "./events/gwEvents";
import { gwAjax } from "./util/gwAjax";
import { GwRegisteredSystem } from "./util/GwRegisteredSystem";
import { gwUtil } from "./util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwTest extends GwRegisteredSystem {
  getSystemName(): string {
    return "gwTest";
  }
  private readyCounter: number | undefined = undefined;
  private timeoutReadyCounter: number = 0;
  private animationFrameReadyCounter: number = 0;

  private readonly logOptions: string[] = ["showDevLogs", "showEventLogs", "showTraceInLogs"];
  private readonly eventFieldsToBeLogged: string[] = [
    "type",
    "key",
    "keyCode",
    "target",
    "relatedTarget",
    "shiftKey",
    "ctrlKey",
    "altKey",
    "metaKey",
    "repeat",
    "screenX",
    "screenY",
  ];

  private originalConsoleLogFunction: ((...args: any[]) => void) | null = null;
  private savedLogOutput: string = "";

  /**
   * Used for making sure the UI has settled from any previous action when testing the UI. Callers should first
   * call this method, which will return a non negative and non zero count value. Then they should call isUiReady
   * repeatedly with the count returned by this method as its argument, until it returns true
   * @returns {number}
   */
  prepareForUiReady(): number {
    if (this.readyCounter === undefined) {
      this.readyCounter = 0;
    }
    const newCount = ++this.readyCounter;

    setTimeout(() => {
      this.timeoutReadyCounter = newCount;
    }, 0);

    requestAnimationFrame(() => {
      this.animationFrameReadyCounter = newCount;
    });

    return newCount;
  }

  /**
   * Used for making sure the UI has settled from any previous action when testing the UI. Callers should first
   * call this prepareForUiReady, which will return a non negative and non zero count value. Then they should call
   * this method repeatedly with the count returned by prepareForUiReady as its argument, until it returns true
   * @returns {boolean}
   */
  isUiReady(count: number): boolean {
    // The "undefined" case can happen if there has been a full page reload since prepareForUiReady was called
    return (
      (this.readyCounter === undefined || (this.timeoutReadyCounter >= count && this.animationFrameReadyCounter >= count)) &&
      gwEvents.areEventsEnabled() &&
      !gwAjax.hasPendingAjaxRequests()
    );
  }

  private elementToString(el: GwDomNode): string {
    let result = "<" + el.tagName.toLowerCase();
    for (let i = 0; i < el.attributes.length; i++) {
      const attribute = el.attributes[i];
      if (attribute.specified) {
        if (attribute.value !== undefined) {
          result += " " + attribute.name + '="' + attribute.value + '"';
        } else {
          result += " " + attribute.name;
        }
      }
    }
    result += ">";
    return result;
  }

  private svgElementToString(el: SVGElement): string {
    let parent = el.parentElement;
    while (parent != null && !parent.hasAttribute("id") && parent !== document.body) {
      parent = parent.parentElement;
    }
    return "SVG" + el.className + (parent != null ? "parent: " + this.elementToString(parent) : "");
  }

  private eventToString(event: GwEventType): string {
    let result = "Event: ";
    gwUtil.forEach(this.eventFieldsToBeLogged, (field) => {
      const fieldValue = (event as any)[field];
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== false) {
        result += " " + field + "=" + this.formatLogArgument(fieldValue);
      }
    });

    return result;
  }

  private formatLogArgument(arg: any): string {
    if (arg instanceof HTMLElement) {
      // Custom handling for HTML elements, transform to tag format
      return this.elementToString(arg);
    } else if (arg instanceof SVGElement) {
      return this.svgElementToString(arg);
    } else if (arg === document) {
      return arg.toString();
    } else if (arg instanceof Object) {
      if (arg.type && arg.target) {
        // Events don't stringify as JSON so use a custom approach
        return this.eventToString(arg);
      } else {
        return JSON.stringify(arg);
      }
    } else {
      return "" + arg;
    }
  }

  private appendToSavedLog(...args: any[]): void {
    gwUtil.forEach(args, (arg, key, coll, i) => {
      if (i === 0) {
        this.savedLogOutput += arg;
      } else {
        this.savedLogOutput += ", " + this.formatLogArgument(arg);
      }
    });

    this.savedLogOutput += "\n";
  }

  /**
   * Call to start recording logs to a string that can be returned by a later call to stopRecordingLogs. The
   * argument to this function is an object containing boolean fields corresponding to the application logging
   * to be turned on while logs are being recorded.
   *
   * If logs are already being recorded then calling this function will change what is being logged, according
   * to the logsToEnable argument, but will not affect what's already been recorded.
   *
   * @param logsToEnable object specifying which logging to turn on: showDevLogs, showEventLogs, showTraceInLogs
   */
  startRecordingLogs(logsToEnable: GwMap): void {
    gwUtil.forEach(this.logOptions, (option) => ((gwApp as any)[option] = Boolean(logsToEnable[option])));

    if (!this.originalConsoleLogFunction) {
      this.originalConsoleLogFunction = console.log;
      (window.console as any).log = this.appendToSavedLog.bind(this);
    }
  }

  /**
   * Call to stop recording logs and turn off any application logging turned on by startRecording logs. If logs
   * are not being recorded then calling this function still turns off any application logging but will just return
   * the empty string.
   * @returns {string} string containing all the log messages generated since startRecordingLogs was called
   */
  stopRecordingLogs(): string {
    const result = this.savedLogOutput;
    gwUtil.forEach(this.logOptions, (option) => ((gwApp as any)[option] = false));
    if (this.originalConsoleLogFunction) {
      (window.console as any).log = this.originalConsoleLogFunction;
      this.originalConsoleLogFunction = null;
      this.savedLogOutput = "";
    }
    return result;
  }
}

export const gwTest = new GwTest();
