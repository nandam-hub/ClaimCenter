import {GwClassIdTagOrNode, GwDomNode, GwMap} from "../types/gwTypes";
import {gwUtil} from "./util/gwUtil";
import {GwRegisteredSystem} from "./util/GwRegisteredSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwAnimation extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwAnimation";
  }

  /**
   * Stores the event handler functions for animationend by animation name.
   * We do this so that we don't have to worry about adding and removing event listeners per element,
   * but we also add the listeners dynamically so that creating new animations don't require updating
   * a fixed list of names here.
   * @type {{}}
   */
  private readonly animationEndEventListeners: GwMap = {};

  private getAnimClass (name: string): string {
    if (name.indexOf(".gw-animation--") >= 0) {
      return name;
    }
    return "gw-animation--" + name;
  }

  /**
   * Adds the classname for the animation to the element.
   * If we haven't already registered a global listener for the animation name, then it builds the method
   * and adds an event listener to document.body
   * @param el
   * @param className
   * @param animName
   */
  private processElForAnimation (el: GwDomNode, className: string, animName: string): void {
    gwUtil.addClass(el, className);

    // We've already added an event listener for this animation name to the window, so no reason to do anything else
    if (this.animationEndEventListeners[animName]) {
      return;
    }

    this.animationEndEventListeners[animName] = (event: AnimationEvent) => {
      this.killAnimation(animName, event.target as GwDomNode);
    };

    document.body.addEventListener("animationend", this.animationEndEventListeners[animName]);
  }

  /**
   * Adds the animation class for a a css keyframed animation, and sets up an event listener, if not already setup,
   * to fire killAnimation on the element when the animation completes.
   *
   * This allows a given element to have n number of unique animations loaded on it, but obviously only one
   * of a given animation. Meaning, adding the same animation twice does not stack them. Instead, it will kill
   * the current animation, then fire a settimeout to queue the animation again from the start.
   */
  addAnimation (classIdTagOrNode: GwClassIdTagOrNode, animName: string): void {
    const els = gwUtil.getDomNodes(classIdTagOrNode);
    const className = this.getAnimClass(animName);

    gwUtil.forEach(els, (el) => {
      // Special Exception for inner actions, as it looks odd to animate over the drop down arrow
      if (gwUtil.hasClass(el, "gw-action--inner") || gwUtil.hasClass(el, "gw-action--expand-button")) {
        el = $(el).parents(".gw-action--outer")[0];
      }

      if (gwUtil.hasClass(el, className)) {
        this.killAnimation(animName, el);
        setTimeout(this.addAnimation.bind(this, el, animName), 0);
        return;
      }

      this.processElForAnimation(el, className, animName);
    });
  }

  /**
   * Called automatically by the animationend listener created via animation.addAnimation, but can be manually called in the event
   * of an animation being infinite.
   * @param animName
   * @param el
   */
  killAnimation (animName: string, el: GwDomNode | null): void {
    if (!el) {
      return;
    }

    gwUtil.removeClass(el, this.getAnimClass(animName));
  }
}

export const gwAnimation = new GwAnimation();