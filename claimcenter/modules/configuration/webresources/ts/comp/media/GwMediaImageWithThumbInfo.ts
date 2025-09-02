import {GwMediaImageInfo} from "./GwMediaImageInfo";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwMediaImageWithThumbInfo extends GwMediaImageInfo {
  constructor (jsonString: string) {
    super(jsonString);
  }

  get thumbUrl (): string {
    return this.data.thumbUrl;
  }
}
