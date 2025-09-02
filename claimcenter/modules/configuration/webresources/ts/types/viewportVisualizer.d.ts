export interface VisualViewportEventMap {
    resize: Event;
    scroll: Event;
}

export interface VisualViewport extends EventTarget {
    onresize: ((this: VisualViewport, ev: Event) => any) | null;
    onscroll: ((this: VisualViewport, ev: Event) => any) | null;
    readonly offsetLeft: number;
    readonly offsetTop: number;
    readonly pageLeft: number;
    readonly pageTop: number;
    readonly width: number;
    readonly height: number;
    readonly scale: number;
    addEventListener<K extends keyof VisualViewportEventMap>(
        type: K,
        listener: (this: VisualViewport, ev: VisualViewportEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof VisualViewportEventMap>(
        type: K,
        listener: (this: VisualViewport, ev: VisualViewportEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare const VisualViewport: {
    prototype: VisualViewport;
    new (): VisualViewport;
};

declare global {
    interface Window {
        readonly visualViewport: VisualViewport;
    }
}
