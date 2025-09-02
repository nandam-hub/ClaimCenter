import { GwIterationCallback, GwTypedMap, GW_BREAKER } from "../../types/gwTypes";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwSet {
  private _map: GwTypedMap<boolean> = {};
  private _count: number = 0;

  constructor(values?: string[]) {
    if (values) {
      this.add(values);
    }
  }

  static create(...values: string[]): GwSet {
    return this.createFromArray(values);
  }

  static createFromArray(values: string[]): GwSet {
    return new GwSet(values);
  }

  add(...values: string[]): GwSet;
  add(values: string[]): GwSet;
  add(set: GwSet): GwSet;
  add(values: GwSet | string[] | string): this {
    for (let i = 0; i < arguments.length; i++) {
      // eslint-disable-next-line prefer-rest-params
      const arg = arguments[i];

      if (typeof arg === "string") {
        this._add(arg);
      } else {
        arg.forEach((val: string) => this._add(val));
      }
    }

    return this;
  }

  private _add(value: string): void {
    if (!this.has(value)) {
      this._count++;
      this._map[value] = true;
    }
  }

  remove(...values: string[]): GwSet;
  remove(values: string[]): GwSet;
  remove(set: GwSet): GwSet;
  remove(values: GwSet | string[] | string): this {
    for (let i = 0; i < arguments.length; i++) {
      // eslint-disable-next-line prefer-rest-params
      const arg = arguments[i];

      if (typeof arg === "string") {
        this._remove(arg);
      } else {
        arg.forEach((val: string) => this._remove(val));
      }
    }

    return this;
  }

  private _remove(value: string): this {
    if (this.has(value)) {
      this._count--;
      delete this._map[value];
    }

    return this;
  }

  has(...values: string[]): boolean;
  has(values: string[]): boolean;
  has(set: GwSet): boolean;
  has(values: GwSet | string[] | string): boolean {
    let hasAll = true;
    for (let i = 0; i < arguments.length; i++) {
      // eslint-disable-next-line prefer-rest-params
      const arg = arguments[i];

      if (typeof arg === "string") {
        if (!this._has(arg)) {
          return false;
        }
      } else {
        arg.forEach((val: string) => {
          if (!this._has(val)) {
            hasAll = false;
            return GW_BREAKER;
          }
          return;
        });
      }
    }

    return hasAll;
  }

  hasAny(...values: string[]): boolean;
  hasAny(values: string[]): boolean;
  hasAny(set: GwSet): boolean;
  hasAny(values: GwSet | string[] | string): boolean {
    let hasAny = false;
    for (let i = 0; i < arguments.length; i++) {
      // eslint-disable-next-line prefer-rest-params
      const arg = arguments[i];

      if (typeof arg === "string") {
        if (this._has(arg)) {
          return true;
        }
      } else {
        arg.forEach((val: string) => {
          if (this._has(val)) {
            hasAny = true;
            return GW_BREAKER;
          }
          return;
        });
      }
    }

    return hasAny;
  }

  private _has(value: string): boolean {
    return !!this._map[value];
  }

  hasOwnProperty(): never {
    throw new Error("Calling hasOwnProperty on a GwSet probably means you are not using it correctly. Use .has() or .forEach()");
  }

  clear(): GwTypedMap<boolean> {
    const map = this._map;
    this._map = {};
    this._count = 0;
    return map;
  }

  copy(): GwSet {
    return GwSet.createFromArray(Object.keys(this._map));
  }

  count(): number {
    return this._count;
  }

  size(): number {
    return this._count;
  }

  equals(setB: GwSet): boolean {
    if (this.size() !== setB.size()) {
      return false;
    }

    return this.has(setB);
  }

  forEach(cb: GwIterationCallback): string[] {
    // Iterate over the keys of the object so that we can mutate during iteration
    const keys = this.toArray();
    for (let i = 0; i < keys.length; i++) {
      cb(keys[i], "" + i, keys, i);
    }

    return keys;
  }

  toArray(): string[] {
    return Object.keys(this._map);
  }
}
