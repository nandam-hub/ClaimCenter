/**
 * Simple class representing a coordinate pair. Has getters for x,y and w,h.
 * Has simple math methods for operating on multiple Vectors.
 * Has dot accessors for get, and none for set. As it's dangerous to send mutable objects around
 * that may be held as references.
 */
export class GwPoint {
  static readonly ZERO: GwPoint = new GwPoint(0, 0);

  private readonly _x: number;
  private readonly _y: number;
  private readonly _length: number;

  constructor (x: number, y: number) {
    this._x = x;
    this._y = y;

    this._length = Math.sqrt(this._x * this._x + this._y * this._y);
  }

  get x (): number {
    return this._x;
  }

  get y (): number {
    return this._y;
  }

  get length (): number {
    return this._length;
  }

  minus (point: GwPoint): GwPoint {
    return new GwPoint(this.x - point.x, this.y - point.y);
  }

  distanceToPoint (point: GwPoint): number {
    return Math.sqrt((this.x - point.x) * (this.x - point.x) + (this.y - point.y) * (this.y - point.y));
  }

  static getElTopLeftVector (el: HTMLElement): GwPoint {
    const bounds = el.getBoundingClientRect();
    return new GwPoint(bounds.left, bounds.top);
  }
}
