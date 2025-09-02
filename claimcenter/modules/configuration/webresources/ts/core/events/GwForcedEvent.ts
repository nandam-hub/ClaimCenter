export class GwForcedEvent implements Event {
  static isGwForcedEvent (obj: Event | GwForcedEvent): obj is GwForcedEvent {
    return (<GwForcedEvent>obj).isForcedEvent !== undefined;
  }

  readonly target: HTMLElement;
  readonly currentTarget: HTMLElement;
  readonly type: string;
  readonly relatedTarget: HTMLElement;
  readonly bubbles: boolean = false;
  readonly isForcedEvent: boolean = true;
  readonly cancelable: boolean = false;
  readonly defaultPrevented: boolean = true;
  readonly isTrusted: boolean = true;
  readonly returnValue: any = 0;
  readonly srcElement: HTMLElement | null = null;
  readonly timeStamp: number = -1;
  readonly scoped: boolean = false;
  readonly initEvent: any = null;
  cancelBubble: boolean = false;
  eventPhase: number = -1;
  button: number = -1;
  AT_TARGET: number = -1;
  BUBBLING_PHASE: number = -1;
  CAPTURING_PHASE: number = -1;

  composed: boolean = false;
  NONE: number = 0;

  constructor (target: HTMLElement, type: string, relatedTarget?: HTMLElement, currentTarget?: HTMLElement) {
    this.target = target;
    this.type = type;
    this.relatedTarget = relatedTarget || target;
    this.currentTarget = currentTarget || target;

    if (type === "click") {
      this.button = 0;
    }
  }

  composedPath(): EventTarget[] {
    return [];
  }

  stopPropagation (): void {
    // NOOP;
  }

  preventDefault (): void {
    // NOOP;
  }

  stopImmediatePropagation (): void {
    // NOOP;
  }

  deepPath (): EventTarget[] {
    return [];
  }
}
