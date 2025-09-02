import {GwMediaImageWithThumbInfo} from "./GwMediaImageWithThumbInfo";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwMediaImageWithExifDataInfo extends GwMediaImageWithThumbInfo  {
  private readonly _hasExifData: boolean;
  constructor (jsonString: string) {
    super(jsonString);
    this._hasExifData = this.data.exifJSONString && this.data.exifJSONString.length > 0;
  }

  hasExifData (): boolean {
    return this._hasExifData;
  }

  get listInfoTitle (): string | undefined {
    return this.data.listInfoTitle;
  }

  get listedInfo (): string[] | undefined {
    return this.data.listedInfo;
  }

  get lat (): string | undefined {
    return this.data.lat;
  }

  get long (): string | undefined {
    return this.data.long;
  }

  get fileName (): string | undefined {
    return this.data.fileName;
  }

  get exifJSONString (): string | undefined {
    return this.data.exifJSONString;
  }

  get paragraphInfo (): string | undefined {
    return this.data.paragraphInfo;
  }

}
