import { GwPoint } from "../GwPoint";
import { gwUtil } from "./gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwPathBuilder {
  private value: string = "";
  private lastCommand: string = "";
  private lastArgs: number[] = [];
  private mutable: boolean = true;

  static create(x: number, y: number): GwPathBuilder {
    return new GwPathBuilder().moveTo(x, y);
  }

  private addSegment(type: string, args: IArguments | number[]): this {
    if (!this.mutable) {
      throw new Error("Unable to add path segment to immutable path builder");
    }
    this.lastCommand = type;
    this.lastArgs = [];

    this.value += " " + type;

    gwUtil.forEach(args, (val) => {
      this.lastArgs.push(val);
      this.value += ` ${val}`;
    });

    return this;
  }

  // =====================================
  // == HELPERS
  // =====================================
  repeatLast(nTimes: number = 1): this {
    for (nTimes; nTimes > 0; nTimes--) {
      this.addSegment(this.lastCommand, this.lastArgs);
    }
    return this;
  }

  getPath(): string {
    return "" + this.value;
  }

  makeImmutable(): void {
    this.mutable = false;
  }

  toString(): string {
    return this.getPath();
  }

  private degreesToRads(angleInDegrees: number): number {
    return ((angleInDegrees - 90) * Math.PI) / 180.0;
  }

  private polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): GwPoint {
    const angleInRadians = this.degreesToRads(angleInDegrees);

    return new GwPoint(centerX + radius * Math.cos(angleInRadians), centerY + radius * Math.sin(angleInRadians));
  }

  // =====================================
  // == PEN
  // =====================================
  moveBy(x: number, y: number): this {
    return this.addSegment("m", [x, y]);
  }

  moveTo(x: number, y: number): this {
    return this.addSegment("M", [x, y]);
  }

  // =====================================
  // == LINE
  // =====================================
  lineBy(x: number, y: number): this {
    return this.addSegment("l", [x, y]);
  }

  lineTo(x: number, y: number): this {
    return this.addSegment("L", [x, y]);
  }

  hLineBy(x: number): this {
    return this.addSegment("h", [x]);
  }

  hLineTo(x: number): this {
    return this.addSegment("H", [x]);
  }

  vLineBy(y: number): this {
    return this.addSegment("v", [y]);
  }

  vLineTo(y: number): this {
    return this.addSegment("V", [y]);
  }

  // =====================================
  // == CUBICS
  // =====================================
  cubicBy(cX1: number, cY1: number, cX2: number, cY2: number, x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("c", arguments);
  }

  cubicTo(cX1: number, cY1: number, cX2: number, cY2: number, x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("C", arguments);
  }

  reflectCubicBy(cX1: number, cY1: number, x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("s", arguments);
  }

  reflectCubicTo(cX1: number, cY1: number, x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("S", arguments);
  }

  // =====================================
  // == QUADS
  // =====================================
  quadBy(cX1: number, cY1: number, x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("q", arguments);
  }

  quadTo(cX1: number, cY1: number, x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("Q", arguments);
  }

  reflectQuadBy(x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("t", arguments);
  }

  reflectQuadTo(x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("T", arguments);
  }

  // =====================================
  // == ARC
  // =====================================
  arcBy(radiusX: number, radiusY: number, xRotate: number, largeArc: 0 | 1, sweep: 0 | 1, x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("a", arguments);
  }

  arcTo(radiusX: number, radiusY: number, xRotate: number, largeArc: 0 | 1, sweep: 0 | 1, x: number, y: number): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("A", arguments);
  }

  arcAlongCircle(cx: number, cy: number, radius: number, endAngle: number, largeArcFlag: 0 | 1 = 0): this {
    const end: GwPoint = this.polarToCartesian(cx, cy, radius, endAngle);
    return this.addSegment("A", [radius, radius, 0, largeArcFlag, 1, end.x, end.y]);
  }

  lineToDegreeOnCircle(x: number, y: number, radius: number, degrees: number): this {
    const pt = this.polarToCartesian(x, y, radius, degrees);
    return this.lineTo(pt.x, pt.y);
  }

  // =====================================
  // == CLOSE
  // =====================================
  close(): this {
    // eslint-disable-next-line prefer-rest-params
    return this.addSegment("Z", arguments);
  }

  moveToStart(): this {
    return this.close();
  }
}
