import {GwInitializableSystem} from "./util/GwInitializableSystem";
import {gwUtil} from "./util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * Sends "ping" requests to other clusters to keep their sessions alive. We do this on
 * every server request, so that if we talk to our server (and "touch" our session) we'll
 * also touch all the remote sessions as well. The ping request is implemented as an image
 * "source" GET. This is a way to cause a cross origin HTTP request, with cookies, that does
 * not require CORS.
 */
export class GwMultiClusterKeepAlive extends GwInitializableSystem {

  getSystemName (): string {
    return "gwMultiClusterKeepAlive";
  }

  init (): void {
    this.pingKeepAliveUrls();
  }

  private pingKeepAliveUrls (): void {
    const ignore = () => {/* do nothing */};
    const urls = gwUtil.getUtilityJson("gw-keepAlive") as string[];
    gwUtil.forEach(urls, (url: string) => {
      const image = new Image();
      image.onload = image.onerror = ignore;
      // Tack a timestamp onto the end of the URL to defeat any caching
      const separator = url.indexOf("?") >= 0 ? "&" : "?";
      image.src = url + separator + "timestamp=" + Date.now();
    });
  }

}

export const gwMultiClusterKeepAlive = new GwMultiClusterKeepAlive();
