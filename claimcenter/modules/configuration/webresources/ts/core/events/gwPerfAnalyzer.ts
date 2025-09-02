/**
 * Collects information for the server side PerfAnalyzer, which tracks total request/response time across both
 * server and client. Communication is via the "reqMon" input. The value of the input is a JSON array containing
 * details of a request/response timing. Each request also has a unique id which the server stores in a data
 * attribute on the "reqMon" input so the client can store it in the JSON array returned to the server.
 */
import {gwUtil} from "../util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwPerfAnalyzer {
  private enabled: boolean = false;
  private eventId: string = "-1";
  // Time stamps are elapsed time since page was loaded, not UTC
  private requestStartTimeStamp: number = -1;
  private requestSentTimeStamp: number = -1;
  private responseReceivedTimeStamp: number = -1;

  /**
   * Array of information sent back to the server, contains:
   * [eventId, requestPrepElapsed, serverRequestElapsed, responseProcessElapsed, responseDoneTime, requestId, agent]
   */
  private infoArray: any[] | null = null;

  private getPerfInput (): HTMLInputElement | null {
    return gwUtil.getDomNodeByName("reqMon") as HTMLInputElement | null;
  }

  private getPerfInputOrThrow (): HTMLInputElement {
    const node = this.getPerfInput();
    if (!node) {
      throw new Error("Found null perf input element");
    }

    return node;
  }

  elapsed (earlier: number, later: number): number {
    return earlier && later ? Math.round(later - earlier) : 0;
  }

  startRequest (requestEventId: string): void {
    this.enabled = !!this.getPerfInput();
    if (!this.enabled) {
      return;
    }

    if (this.infoArray) {
      const node = this.getPerfInput();
      if (!node) {
        return;
      }

      // Send results from previous request along with this request
      node.setAttribute("value", JSON.stringify(this.infoArray));
      this.infoArray = null;
    }

    this.eventId = requestEventId;
    this.requestStartTimeStamp = performance.now();
  }

  requestSent (): void {
    if (!this.enabled) {
      return;
    }

    this.requestSentTimeStamp = performance.now();
  }

  responseReceived (): void {
    if (!this.enabled) {
      return;
    }

    this.responseReceivedTimeStamp = performance.now();
  }

  responseProcessed (): void {
    if (!this.enabled) {
      return;
    }

    const responseProcessedTimeStamp = performance.now();
    const requestPrepElapsed = this.elapsed(this.requestStartTimeStamp, this.requestSentTimeStamp);
    const serverRequestElapsed = this.elapsed(this.requestSentTimeStamp, this.responseReceivedTimeStamp);
    const responseProcessElapsed = this.elapsed(this.responseReceivedTimeStamp, responseProcessedTimeStamp);
    const responseProcessedTimeUTC = Math.round(performance.timing.navigationStart + responseProcessedTimeStamp);
    const perfInputRequestId = this.getPerfInputOrThrow().dataset.gwRequestId;

    this.infoArray = [
      this.eventId,
      requestPrepElapsed,
      serverRequestElapsed,
      responseProcessElapsed,
      responseProcessedTimeUTC,
      perfInputRequestId,
      window.navigator.userAgent
    ];
  }
}

export const gwPerfAnalyzer = new GwPerfAnalyzer();
