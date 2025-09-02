import {GwDomNode, GwDomNodeList, GwMap} from "../../types/gwTypes";
import {gwUtil} from "./gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwDivBuilder {
  private _classes: string[] | undefined | null;
  private _attr: GwMap | undefined;
  private _styles: GwMap | undefined;
  private _children: GwDomNode[] | undefined;
  private _label: string | undefined;

  static create (): GwDivBuilder {
    return new GwDivBuilder();
  }

  // =====================================
  // == STATIC METHODS
  // =====================================
  static withClassArr (classes: string[]): GwDivBuilder {
    return new GwDivBuilder().withClassArr(classes);
  }

  static withClasses (...classes: string[]): GwDivBuilder {
    return new GwDivBuilder().withClassArr(classes);
  }

  static withId (id: string): GwDivBuilder {
    return new GwDivBuilder().withId(id);
  }

  static withChildren (...children: GwDomNode[]): GwDivBuilder {
    return new GwDivBuilder().withChildArr(children);
  }

  static withChildArr (children: GwDomNode[]): GwDivBuilder {
    return new GwDivBuilder().withChildArr(children);
  }

  static withLabel (text: string): GwDivBuilder {
    return new GwDivBuilder().withLabel(text);
  }

  static withAttrMap (attr: GwMap): GwDivBuilder {
    return new GwDivBuilder().withAttrMap(attr);
  }

  static withAttr (...attrKeyThenValue: string[]): GwDivBuilder {
    return new GwDivBuilder().withAttr.apply(this, attrKeyThenValue);
  }

// =====================================
// == INSTANCE METHODS
// =====================================
  withId (id: string): this {
    return this.withAttr("id", id);
  }

  withClasses (...classes: string[]): this {
    return this.withClassArr(classes);
  }

  withClassArr (classes: string[]): this {
    if (!this._classes) {
      this._classes = classes.slice(0);
    } else {
      this._classes = this._classes.concat(classes);
    }

    return this;
  }

  withAttrMap (attr: GwMap): this {
    this._attr = gwUtil.mapMerge(this._attr, attr);
    return this;
  }

  withAttr (...attrKeyThenValue: string[]): this {
    return this.withAttrMap(gwUtil.convertKeyValueArrayToMap(attrKeyThenValue));
  }

  withStyleMap (styles: GwMap): this {
    this._styles = gwUtil.mapMerge(this._styles, styles);
    return this;
  }

  withStyles (...stylesKeyThenValue: string[]): this {
    return this.withStyleMap(gwUtil.convertKeyValueArrayToMap(stylesKeyThenValue));
  }

  withChildArr (children: GwDomNodeList): this {
    if (!this._children) {
      this._children = gwUtil.copyArrayLike(children);
    } else {
      this._children = this._children.concat(gwUtil.copyArrayLike(children));
    }
    return this;
  }

  withChildren (...children: GwDomNode[]): this {
    return this.withChildArr(children);
  }

  withLabel (text: string): this {
    this._label = text;
    return this;
  }

  // =====================================
  // == BUILDER
  // =====================================
  build (): HTMLDivElement {
    return gwUtil.createDiv(this._classes, this._attr, this._styles, this._label, this._children);
  }
}
