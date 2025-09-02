import {GwDomNode, GwMap} from "../types/gwTypes";
import {gwEvents} from "../core/events/gwEvents";
import {GwInitializableSystem} from "../core/util/GwInitializableSystem";
import {gwUtil} from "../core/util/gwUtil";
import {gwAjax} from "../core/util/gwAjax";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwProgressValue extends GwInitializableSystem {
  getSystemName (): string {
    return "gwProgressValue";
  }

  private readonly currentPollTargets: GwMap = {};
  private _interval: number = -1;

  /**
   * Hard coded interval at which the client checks to see if there are any targets for polling the server
   * @type {number}
   */
  readonly pollInterval: number = 2000;

  /**
   * Searches for progress bars that need to update
   */
  init (): void {
    const progressValueWidgets = $(".gw-ProgressValueWidget").not("[aria-disabled=true]");
    if (progressValueWidgets) {
      gwUtil.forEach(progressValueWidgets, this.checkProgress.bind(this));
      this.startInterval();
    } else {
      // Reset the current set of poll targets as there are no accessible progress
      // value widgets on the current page
      gwUtil.forEach(this.currentPollTargets, (pollTarget) => {
        this.resetProgressInfo(pollTarget.id);
      });
      window.clearInterval(this._interval);
    }
  }

  /**
   * Checks to see if there are any targets for which to poll the server for progress updates.
   * Double checks the list of polling targets and resets polling information if it finds the targets
   * are no longer available on the current page.
   */
  private pollProgressWidgets (): void {
    const pollTargetKeys = Object.keys(this.currentPollTargets);
    let foundTargets = false;

    gwUtil.forEach(pollTargetKeys, (targetKey) => {
      const targetElems = $("#" + targetKey + ".gw-ProgressValueWidget").not("[aria-disabled=true]");
      if (targetElems.length > 0) {
        // Found at least one viable target
        foundTargets = true;
      } else {
        this.resetProgressInfo(targetKey);
      }
    });

    if (foundTargets) {
      this.requestProgressInputUpdates({ids: pollTargetKeys});
    } else {
      window.clearInterval(this._interval);
    }
  }

  private requestProgressInputUpdates (updateTargets: any): void {
    const requestParams: GwMap = {};
    requestParams["__progressinput"] = JSON.stringify(updateTargets);
    gwAjax.ajaxRequest(requestParams, this.updateProgressInputs.bind(this));
  }

  private updateProgressInputs (updateReqResponse: GwMap): void {
    // Parse ids and progress percents from response
    const progressInputUpdates = updateReqResponse.results;
    if (progressInputUpdates) {
      progressInputUpdates.forEach(this.setProgressWidgetProgress.bind(this));
    } else {
      gwUtil.devlog("Did not receive any results from requestProgressInputUpdates");
    }
  }

  private setProgressWidgetProgress (update: GwMap): GwDomNode | null {
    const id = update.id;

    const el = $("#" + id + ".gw-ProgressValueWidget").not("[aria-disabled=true]")[0];
    if (!el) {
      this.resetProgressInfo(id);
      return null;
    }

    let progressPercent = update.percentDone;

    progressPercent = parseInt(progressPercent);
    progressPercent = Math.min(progressPercent, 100);
    el.setAttribute("data-gw-percent", "" + progressPercent);

    this.updateProgressBar(el, progressPercent);
    this.updateStatus(el, update.status);
    this.checkProgress(el);
    return el;
  }

  private updateProgressBar (el: GwDomNode, progressPercent: number): void {
    const bar = el.querySelector(".gw-progress--bar") as HTMLElement;
    if (bar) {
      bar.style.width = progressPercent + "%";
      gwUtil.conditionalAddRemoveClass(progressPercent === 0, bar, "gw-progress--bar-empty");
      gwUtil.conditionalAddRemoveClass(progressPercent === 100, bar, "gw-progress--bar-full");
    }
    const valNode = el.querySelector(".gw-progress--bar-label") as HTMLElement;
    if (valNode) {
      gwUtil.dangerouslySetInnerHTML(valNode, progressPercent + "%");
      gwUtil.conditionalAddRemoveClass(progressPercent < 30, valNode, "gw-progress--shifted-label");
    }
  }

  private updateStatus (el: GwDomNode, status: string): void {
    if (!gwUtil.hasValue(status)) {
      return;
    }
    const statusEl = el.querySelector(".gw-progress--status-label");
    if (statusEl) {
      statusEl.textContent = status; //NOTE: was innerHTML, it's possible someone somewhere was sending rendered HTML from the server here, but I can't find a place, so for now, this is safer
    }
  }

  /**
   * Check in polling targets to see if a disabledEvents call has been triggered for the corresponding progress input.
   * Used to prevent calling disabledEvents multiple times for a progress input that is configured with an action on
   * completion.  Also used during cleanup of orphaned progress input polling requests.
   * @param targetKey
   * @returns {boolean}
   */
  private disabledEventsTriggered (targetKey: string): boolean {
    const info = this.currentPollTargets[targetKey] || {};
    return !!info.disabledEvents;
  }

  /**
   * Clean up progress input state for a given progress input target.
   * @param targetKey
   */
  private resetProgressInfo (targetKey: string): void {
    // eventDisabled was called for target but the target is no longer on the page.
    // Need to send an enable event otherwise the lock counter will never get decremented.
    if (this.disabledEventsTriggered(targetKey)) {
      gwEvents.enableEvents();
    }
    // Remove any poll targets not on the current screen - e.g. the user has navigated away
    delete this.currentPollTargets[targetKey];
  }

  private parseInfo (progressValueWidget: GwDomNode): GwMap {
    const info: GwMap = {};
    info.id = progressValueWidget.id;
    info.percent = $(progressValueWidget).attr("data-gw-percent");
    info.action = $(progressValueWidget).attr("data-gw-action");
    return info;
  }

  /**
   * Checks the status for a given progress input on the current page.  If the progress input is configured
   * with an action on completion, triggers the event when the progress input is complete.
   * @param pvw ProgressInput element.
   */
  private checkProgress (pvw: GwDomNode): void {
    const info = this.parseInfo(pvw);
    const done = info.percent >= 100;

    if (done) {
      if (info.action) {
        // If action configured for the targeted progress input, fire the action now that progress is done.
        gwUtil.fireEvent(info.action);
        if (this.disabledEventsTriggered(info.id)) {
          // Send an enableEvents call if disabledEvents had been triggered
          // (probably only happens if the progress bar comes in completed...)
          gwEvents.enableEvents();
        }
      } else {
        if (this.currentPollTargets[info.id]) {
          gwUtil.refresh();
        }
      }
      delete this.currentPollTargets[info.id];
    } else {
      this.currentPollTargets[info.id] = this.currentPollTargets[info.id] || info;
      if (info.action) {
        // Progress inputs with actions disable events until progress is done.
        // If we haven't already, disableEvents.
        if (!this.disabledEventsTriggered(pvw.id)) {
          this.currentPollTargets[pvw.id].disabledEvents = true;
          gwEvents.disableEvents();
        }
      }
    }
  }

  private startInterval (): void {
    window.clearInterval(this._interval);
    this._interval = window.setInterval(this.pollProgressWidgets.bind(this), this.pollInterval);
  }
}

export const gwProgressValue = new GwProgressValue();