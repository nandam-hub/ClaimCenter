import {GwDomNode, GwMap, GwPartialReloadDetails, GwTypedMap} from "../../types/gwTypes";
import {gwUtil} from "../../core/util/gwUtil";
import {gwModalClientOverlay} from "../gwModalClientOverlay";
import {GwInitializableSystem} from "../../core/util/GwInitializableSystem";
import {gwStorage} from "../../core/gwStorage";
import {GwMediaImageWithExifDataInfo} from "./GwMediaImageWithExifDataInfo";
import {GwDivBuilder} from "../../core/util/GwDivBuilder";
import {gw} from "../../core/gw";
import {gwTooltips} from "../../core/gwTooltips";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwMediaGallery extends GwInitializableSystem {
  private readonly MAKE_SECONDARY_EXIF_LOOKUPS: boolean = false;

  /**
   * Prebuilt gallery entries by: galleryId -> pageNumber -> imageDiv
   */
  private readonly galleryData: GwTypedMap<HTMLDivElement[][]> = {};

  init (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    this.buildGalleries();
  }

  getSystemName (): string {
    return "gwMediaGallery";
  }

  first (el: GwDomNode): void {
    this.pagingButtonClicked("first", el);
  }

  prev (el: GwDomNode): void {
    this.pagingButtonClicked("prev", el);
  }

  next (el: GwDomNode): void {
    this.pagingButtonClicked("next", el);
  }

  last (el: GwDomNode): void {
    this.pagingButtonClicked("last", el);
  }

  private pagingButtonClicked (buttonType: "first" | "prev" | "last" | "next", buttonEl: GwDomNode): void {
    const gallery = this.getGalleryFromEl(buttonEl);
    let finalPageNum = 1;
    const currentPage = this.getStoredPageNumberForGallery(gallery.id);
    const furthestPage = this.getLastPageNum(gallery.id);

    if (buttonType === "prev") {
      finalPageNum = currentPage - 1;
    } else if (buttonType === "next") {
      finalPageNum = currentPage + 1;
    } else if (buttonType === "last") {
      finalPageNum = furthestPage;
    }

    if (finalPageNum < 1) {
      finalPageNum = 1;
    } else if (finalPageNum > furthestPage) {
      finalPageNum = furthestPage;
    }

    this.storePageNumberForGallery(gallery.id, finalPageNum);
    this.updatePagingWidgetForGallery(gallery);
    this.showGalleryPage(gallery.id, finalPageNum);
  }

  private getGalleryFromEl (el: GwDomNode): HTMLDivElement {
    const galleryEl = gwUtil.getSelfOrFirstParentWithClass(el, "gw-MediaGalleryWidget");
    if (!galleryEl) {
      throw new Error("Unable to locate MediaGalleryWidget parent");
    }

    return galleryEl as HTMLDivElement;
  }

  private buildGalleries (): void {
    gwUtil.forEachReverse(gwUtil.getDomNodesByAttr("data-gw-media-gallery-build"), (gallery) => {
      this.buildGallery(gallery);
    });
  }

  private buildGallery (gallery: GwDomNode): void {
    if (!gallery.id) {
      throw new Error("Media Gallery wrapper requires a valid id: " + gallery.id);
    }

    const jsonNodes = gwUtil.getDomNodesByAttr("data-gw-media-image-json", undefined, gallery);

    const pageSize: number = (+(gallery.getAttribute("data-gw-page-size") || 0) || jsonNodes.length);

    this.galleryData[gallery.id] = [];

    let currentPageNum = 1;
    let currentEntryCount = 0;

    this.galleryData[gallery.id][1] = [];

    gwUtil.forEach(jsonNodes, (jsonDiv) => {
      currentEntryCount++;

      if (currentEntryCount > pageSize) {
        currentEntryCount = 1;
        currentPageNum++;
        this.galleryData[gallery.id][currentPageNum] = [];
      }

      this.galleryData[gallery.id][currentPageNum].push(this.buildGalleryImageEntry(jsonDiv));
    });

    this.showGalleryPage(gallery.id, this.getStoredPageNumberForGallery(gallery.id));

    gallery.removeAttribute("data-gw-media-gallery-build");
  }

  private buildGalleryImageEntry (jsonNode: GwDomNode): HTMLDivElement {
    const jsonString: string | null = jsonNode.getAttribute("data-gw-media-image-json");
    if (jsonString == null || jsonString.length === 0) {
      throw new Error("Attempting to build a gallery node without the data-gw-media-image-json property");
    }

    const mediaData = new GwMediaImageWithExifDataInfo(jsonString);

    // =====================================
    // == MAIN IMAGE
    // =====================================
    const top = gwUtil.createDiv("gw-GalleryTile--top");
    const middle = gwUtil.createDiv("gw-GalleryTile--middle");
    const bottom = gwUtil.createDiv("gw-GalleryTile--bottom");

    const galleryTile = GwDivBuilder.withClasses("gw-GalleryTile").withChildren(top, middle, bottom).build();

    if (mediaData.hasExifData()) {
      galleryTile.setAttribute("data-gw-exif", mediaData.exifJSONString!);
    }

    // =====================================
    // == BADGE
    // =====================================
    if (mediaData.badgeLabel || mediaData.badgeStyleCss) {
      top.appendChild(GwDivBuilder.withClasses("gw-GalleryTile--badge", mediaData.badgeStyleCss).withLabel(mediaData.badgeLabel).build());
    }

    // =====================================
    // == IMAGE
    // =====================================
    const image = gwUtil.createEl("img", null, {src: mediaData.thumbUrl, onload: "gwMediaGallery.onThumbLoad(event)", onerror: "gwMediaGallery.onThumbError"});

    const wrapperAttr = {"data-gw-click": "gwMediaGallery.thumbClick url:" + mediaData.url};
    const imageWrapper = GwDivBuilder.withClasses("gw-GalleryTile--thumb", "gw-loading").withAttrMap(wrapperAttr).withChildren(image).build();
    top.appendChild(imageWrapper);

    // =====================================
    // == LIST INFO
    // =====================================

    middle.appendChild(GwDivBuilder.withClasses("gw-GalleryTile--title").withLabel((mediaData.listInfoTitle || mediaData.fileName || "-").trim()).build());

    // =====================================
    // == BOTTOM SECTION
    // =====================================

    if (mediaData.listedInfo) {
      const listedHolder = gwUtil.createDiv("gw-GalleryTile--key-values");

      const listedInfoArr = mediaData.listedInfo;

      for (let i = 1; i < listedInfoArr.length; i += 2) {
        const key = GwDivBuilder.withClasses("gw-GalleryTile--key").withLabel(listedInfoArr[i - 1]).build();
        const value = GwDivBuilder.withClasses("gw-GalleryTile--value").withLabel(listedInfoArr[i]).build();
        gwTooltips.addTooltip(value, listedInfoArr[i]);

        const keyValue = GwDivBuilder.withClasses("gw-GalleryTile--key-value").withChildren(key, value).build();
        listedHolder.appendChild(keyValue);
      }

      bottom.appendChild(listedHolder);
    }

    if (mediaData.paragraphInfo) {
      bottom.appendChild(GwDivBuilder.withClasses("gw-GalleryTile--paragraph").withLabel(mediaData.paragraphInfo).build());
    }

    return galleryTile;
  }

  private storePageNumberForGallery (galleryId: string, pageNum: number): void {
    gwStorage.set("GW_MEDIA_GALLERY." + galleryId + ".pageNum", pageNum);
  }

  private getStoredPageNumberForGallery (galleryId: string): number {
    return +(gwStorage.get("GW_MEDIA_GALLERY." + galleryId + ".pageNum") || 1);
  }

  private showGalleryPage (galleryId: string, pageNum: number): void {
    if (pageNum < 1) {
      throw new Error("Cannot page a gallery to page number less than 1: " + pageNum);
    }

    const gallery = document.getElementById(galleryId);

    if (!gallery) {
      throw new Error("Unable to locate gallery being paged.");
    }

    let entriesForPage: HTMLDivElement[] = this.galleryData[galleryId][pageNum];

    // If this page didn't have any entries, then walk down until we find one that does
    while (!entriesForPage && pageNum > 0) {
      pageNum--;
      entriesForPage = this.galleryData[galleryId][pageNum];
    }

    this.storePageNumberForGallery(galleryId, pageNum);
    const galleryEntriesHolder = gwUtil.getDomNodeOrThrow(".gw-MediaGallery--gallery", gallery);

    gwUtil.clearInnerHTML(galleryEntriesHolder);

    gwUtil.forEach(entriesForPage, (div) => {
      galleryEntriesHolder.appendChild(div);
    });

    this.updatePagingWidgetForGallery(gallery);
  }

  private updatePagingWidgetForGallery (gallery: GwDomNode): void {
    const pagingWidget = gwUtil.getDomNode(".gw-MediaGallery--paging", gallery);
    if (!pagingWidget) {
      return;
    }

    const pageNum = this.getStoredPageNumberForGallery(gallery.id);
    if (pageNum === 0) {
      gwUtil.addClass(pagingWidget, "gw-hidden");
      return;
    }

    const first = gwUtil.getDomNodeOrThrow(".gw-paging--first", pagingWidget);
    const prev = gwUtil.getDomNodeOrThrow(".gw-paging--prev", pagingWidget);
    const next = gwUtil.getDomNodeOrThrow(".gw-paging--next", pagingWidget);
    const last = gwUtil.getDomNodeOrThrow(".gw-paging--last", pagingWidget);
    const pageNumEl = gwUtil.getDomNodeOrThrow(".gw-paging--number", pagingWidget) as HTMLDivElement;

    gwUtil.conditionalAddRemoveAttr(pageNum === 1, first, "aria-disabled", "true");
    gwUtil.conditionalAddRemoveAttr(pageNum === 1, prev, "aria-disabled", "true");

    const lastPageNum = this.getLastPageNum(gallery.id);
    gwUtil.dangerouslySetInnerHTML(pageNumEl, `${pageNum}/${lastPageNum}`);
    gwUtil.conditionalAddRemoveAttr(pageNum === lastPageNum, next, "aria-disabled", "true");
    gwUtil.conditionalAddRemoveAttr(pageNum === lastPageNum, last, "aria-disabled", "true");
  }

  private getLastPageNum (galleryId: string): number {
    const galleryArr = this.galleryData[galleryId];
    if (!galleryArr) {
      throw new Error("Attempting to get last page number for a gallery with no data in memory.");
    }

    return galleryArr.length - 1;
  }

  onThumbLoad (e: Event): void {
    gwUtil.removeClass(this.getThumbContainerFromImg(e || event), "gw-loading");
  }

  onThumbError (e: Event): void {
    gwUtil.addClass(this.getThumbContainerFromImg(e || event), "gw-error");
  }

  thumbClick (node: GwDomNode, args: GwMap, e: Event): void {

    this.showModalGalleryTile(this.getGalleryTileEl(node), args.url);
  }

  private getThumbContainerFromImg (e: Event): GwDomNode {
    const img = e.currentTarget;
    if (!img) {
      throw new Error("Unable to locate thumb container from null image.");
    }

    const thumb = gwUtil.getSelfOrFirstParentWithClass(img as HTMLImageElement, "gw-GalleryTile--thumb");

    if (!thumb) {
      throw new Error("Unable to locate thumb container from image element.");
    }

    return thumb;
  }

  private showModalGalleryTile (galleryTileEl: GwDomNode, fullSizeImageUrl: string): void {
    const wrapper = gwUtil.createDiv("gw-GalleryTile--modal");
    const leftDiv = gwUtil.createDiv("gw-GalleryTile--modal-img gw-loading");
    const image = gwUtil.createEl("img", "gw-modal-image", {src: fullSizeImageUrl});

    leftDiv.appendChild(image);
    wrapper.appendChild(leftDiv);

    gwModalClientOverlay.openWithElementContainer(wrapper);

    const exifJSON = galleryTileEl.getAttribute("data-gw-exif");

    image.onload = () => {
      gwUtil.removeClass(leftDiv, "gw-loading");
      if (exifJSON && exifJSON.length > 0) {
        try {
          const parsedJSON = JSON.parse(exifJSON);
          this.buildMetaDataSectionOfModalImage(wrapper, parsedJSON);
        } catch (e) {
          // no-op
        }
      } else if (this.MAKE_SECONDARY_EXIF_LOOKUPS) {
        (gw.globals.EXIF as any).buildDataAsync(image, gwMediaGallery.buildMetaDataSectionOfModalImage.bind(gwMediaGallery, wrapper));
      }
    };
  }

  private getGalleryTileEl (childNode: GwDomNode): GwDomNode {
    const media = gwUtil.getSelfOrFirstParentWithClass(childNode, "gw-GalleryTile");
    if (!media) {
      throw new Error("Unable to locate media object from child node");
    }

    return media;
  }

  private buildMetaDataSectionOfModalImage (wrapper: HTMLDivElement, tagData: GwMap): void {
    const rightDiv = gwUtil.createDiv("gw-GalleryTile--modal-data");
    const table = document.createElement("table");
    table.classList.add("gw-tag-data-table");

    rightDiv.appendChild(table);

    wrapper.appendChild(rightDiv);

    gwUtil.forEach(tagData, (val, key) => {
      const row = document.createElement("tr");
      table.appendChild(row);
      const keyCell = document.createElement("td");
      const valueCell = document.createElement("td");
      keyCell.classList.add("gw-key-cell");
      valueCell.classList.add("gw-value-cell");
      keyCell.textContent = key;
      valueCell.textContent = val;
      row.appendChild(keyCell);
      row.appendChild(valueCell);
    });
  }
}

export const gwMediaGallery = new GwMediaGallery();
