import { GwAjaxResponseStatus, GwDomNode, GwMap, GwTypedMap } from "../../types/gwTypes";
import { gwAjax } from "../util/gwAjax";
import { GwRegisteredSystem } from "../util/GwRegisteredSystem";
import { gwUtil } from "../util/gwUtil";
import { GwReflectionTrigger } from "./GwReflectionTrigger";
import { GwReflector } from "./GwReflector";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * Utility responsible for reflection functionality of the application.
 * See <Reflect> and <ReflectCondition> pcf elements
 *
 * There are two notions which are used in this class: trigger and reflector.
 * Both are wrappers around html elements with additional functionality.
 * A trigger provides functions to listen to change html native events and then dispatch events further to reflectors
 * A reflector provides a functionality to reflect values received from triggers to their internal HTML elements.
 */
export class GwReflection extends GwRegisteredSystem {
  getSystemName(): string {
    return "gwReflection";
  }

  readonly TRIGGER_IDS_PROP: string = "triggerIds";
  readonly REFLECTOR_ID_PROP: string = "reflectorId";
  readonly DIRECT_CHANGES_ONLY_PROP: string = "directChangesOnly";
  /**
   * Cache of trigger wrappers
   */
  private triggerCache: GwTypedMap<GwReflectionTrigger> = {};
  /**
   * This helps prevents cyclic loops of triggers. It can happen when a reflector and a trigger listen to each other.
   */
  private cycleEventsCache: GwTypedMap<boolean> = {};

  private changeListeners: GwMap = {};

  clearCache(): void {
    this.triggerCache = {};
    this.changeListeners = {};
  }

  hasTriggered(id: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.cycleEventsCache, id);
  }

  setHasTriggered(id: string): void {
    this.cycleEventsCache[id] = true;
  }

  resetCycleEventsCache(): void {
    this.cycleEventsCache = {};
  }

  notifyTriggerChange(id: string): void {
    if (Object.prototype.hasOwnProperty.call(this.changeListeners, id)) {
      this.changeListeners[id]();
    }
  }

  isReflectionTrigger(node: GwDomNode): boolean {
    return node.hasAttribute("data-gw-reflection-trigger");
  }

  /**
   * For each reflector widget, wrap it into a reflector class, find all of its triggers, wrap them into trigger classes,
   * cache them, then add change listeners to those triggers
   */
  initForNode(widgetEl: GwDomNode): void {
    if (widgetEl.hasAttribute("data-gw-reflection")) {
      const reflectionInfo = this.parseReflectionInfo(widgetEl.getAttribute("data-gw-reflection")!);
      const reflector = new GwReflector(widgetEl, reflectionInfo);
      const triggerIds = this.extractTriggerIds(reflectionInfo);
      const triggers: GwReflectionTrigger[] = [];

      triggerIds.split(",").forEach((triggerId) => {
        const triggerNode = gwUtil.getDomNode("#" + triggerId);
        if (triggerNode) {
          const trigger = this.triggerify(triggerNode);
          triggers.push(trigger);
          trigger.addChangeListener((isDirectChange: boolean) => {
            if (reflector.shouldReflect(isDirectChange)) {
              this.triggerChangeListener(trigger, triggers, reflector);
            }
          });
        } else {
          gwUtil.devlog("No node found for trigger id: " + triggerId, widgetEl);
        }
      });
    }
  }

  private parseReflectionInfo(stringValue: string): GwMap {
    const values = stringValue.split(";");
    if (values.length !== 3) {
      throw new Error("unable to extract reflection information from the string: " + stringValue);
    }

    const reflectionInfo: GwMap = {};
    values.forEach((val) => {
      const info = val.split(":");
      if (info.length !== 2) {
        throw new Error("unable to extract reflection information property from the string: " + val);
      }
      reflectionInfo[info[0]] = info[1];
    });

    return this.validateInfo(reflectionInfo);
  }

  private validateInfo(reflectionInfo: GwMap): GwMap {
    if (!Object.prototype.hasOwnProperty.call(reflectionInfo, this.TRIGGER_IDS_PROP)) {
      throw new Error("triggerIds property is missing in " + reflectionInfo);
    }
    if (!Object.prototype.hasOwnProperty.call(reflectionInfo, this.REFLECTOR_ID_PROP)) {
      throw new Error("reflectorId property is missing in " + reflectionInfo);
    }
    if (!Object.prototype.hasOwnProperty.call(reflectionInfo, this.DIRECT_CHANGES_ONLY_PROP)) {
      throw new Error("directChangesOnly property is missing in " + reflectionInfo);
    }
    return reflectionInfo;
  }

  private extractTriggerIds(reflectionInfo: GwMap): string {
    return reflectionInfo[this.TRIGGER_IDS_PROP];
  }

  /**
   * Handles a trigger change. Sends a request to the server to get the reflected value , based on the trigger value.
   */
  private triggerChangeListener(trigger: GwReflectionTrigger, allTriggers: GwReflectionTrigger[], reflector: GwReflector): void {
    const requestObject = {
      activeTriggerId: trigger.id,
      allTriggerValues: allTriggers.reduce((map: GwMap, itrTrigger) => {
        map[itrTrigger.id] = itrTrigger.getValue();
        return map;
      }, {}),
      reflectorId: reflector.id,
    };

    const requestParams: GwMap = {};
    requestParams["__reflect"] = JSON.stringify(requestObject);
    gwAjax.ajaxRequest(
      requestParams,
      this.handleReflectionResponse.bind(this, trigger, allTriggers, reflector),
      this.handleReflectionError.bind(this)
    );
  }

  /**
   * Handles a response from the server with the reflected value.
   */
  private handleReflectionResponse(trigger: GwMap, allTriggers: GwMap[], reflector: GwReflector, response: GwMap): void {
    const mapExpression = (reflectionValue: GwMap) => {
      if (reflectionValue.isJavascript) {
        return this.evalExpression(trigger, allTriggers, reflector, reflectionValue.value);
      } else {
        return reflectionValue.value;
      }
    };

    if (Object.prototype.hasOwnProperty.call(response, "reflectorValues")) {
      if (Object.prototype.hasOwnProperty.call(response.reflectorValues, "OPTIONS")) {
        reflector.reflectOptions(mapExpression(response.reflectorValues["OPTIONS"]));
      }
      if (Object.prototype.hasOwnProperty.call(response.reflectorValues, "MASK")) {
        reflector.reflectMask(mapExpression(response.reflectorValues["MASK"]));
      }
      if (Object.prototype.hasOwnProperty.call(response.reflectorValues, "VALUE")) {
        reflector.reflectValue(mapExpression(response.reflectorValues["VALUE"]));
      }
      if (Object.prototype.hasOwnProperty.call(response.reflectorValues, "AVAILABLE")) {
        reflector.reflectAvailable(mapExpression(response.reflectorValues["AVAILABLE"]));
      }
      if (Object.prototype.hasOwnProperty.call(response.reflectorValues, "CUSTOM")) {
        this.evalExpression(trigger, allTriggers, reflector, response.reflectorValues["CUSTOM"].value);
      }
    } else {
      console.error("unable to parse reflection response");
    }
  }

  /**
   * Reflection expressions which start with "javascript:" need to be executed on the client side, the server returns
   * such expression unchanged as a javascript code. These expression may include following symbols: TRIGGER_INDEX,
   * REFLECTOR, VALUE, VALUE1, .... , VALUEn (n - number of triggers). All these symbols need to be initialized in a
   * local context.
   *
   * All of that is done in this function.
   */
  private evalExpression(trigger: GwMap, allTriggers: GwMap[], reflector: GwMap, expression: string): any {
    const VALUE = trigger.getValue();

    let TRIGGER_INDEX = -1;

    const REFLECTOR = reflector.widget;
    if (allTriggers) {
      for (let index = 0; index < allTriggers.length; index++) {
        eval("var VALUE" + (index + 1) + " = allTriggers[index].getValue();"); //
      }

      TRIGGER_INDEX = allTriggers.indexOf(trigger);
    }

    return eval(expression);
  }

  private handleReflectionError(
      response: any,
      errorType: GwAjaxResponseStatus,
      httpErrorString: string | null
  ): boolean {
    // Do nothing to the reflection error message until we figure out where to display this message.
    // Possible exception could happen during reflection is validation errors.
    if (errorType === GwAjaxResponseStatus.FATAL_ERROR) {
      gwUtil.devlog(response.exceptionText);
      return true;
    }
    return false;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////// TRIGGER STUFF /////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Returns trigger from the cache
   */
  getTriggerById(id: string): GwReflectionTrigger {
    return this.triggerCache[id];
  }

  /**
   * Wrap trigger node into a trigger wrapper class.
   */
  private triggerify(triggerNode: GwDomNode): GwReflectionTrigger {
    const triggerId = triggerNode.id;

    // check the cache first
    let trigger = this.getTriggerById(triggerId);
    if (trigger) {
      return trigger;
    }

    trigger = this.wrapWithEventListener(new GwReflectionTrigger(triggerNode));
    this.triggerCache[trigger.id] = trigger;
    this.markAsTrigger(triggerNode);
    return trigger;
  }

  private markAsTrigger(triggerNode: GwDomNode): void {
    triggerNode.setAttribute("data-gw-reflection-trigger", "data-gw-reflection-trigger");
  }

  private wrapWithEventListener(trigger: GwReflectionTrigger): GwReflectionTrigger {
    this.changeListeners[trigger.id] = trigger.internalDispatchChangeEvent.bind(trigger);
    return trigger;
  }
}

export const gwReflection = new GwReflection();
