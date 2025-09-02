import {GwMap} from "../../types/gwTypes";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwMediaImageInfo {
  protected readonly data: GwMap;
  constructor (jsonString: string) {
    try {
      this.data = JSON.parse(jsonString);
    } catch (e) {
      console.error("Invalid JSON provided to GwMediaImageInfo:", jsonString);
      this.data = {};
    }
  }

  get url (): string {
    return this.data.url;
  }

  get badgeLabel (): string {
    return this.data.badgeLabel;
  }

  get badgeStyleCss (): string {
    return this.data.badgeStyleCss || "";
  }

  get objectFitCss (): string {
    return this.data.objectFitCss;
  }

  get imageStyleCss (): string {
    return this.data.imageStyleCss;
  }

  get altText (): string {
    return this.data.altText;
  }

}
