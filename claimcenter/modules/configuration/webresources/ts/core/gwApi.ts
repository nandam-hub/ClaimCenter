import {gwUtil} from "./util/gwUtil";
import {GwMap, GwPartialReloadDetails} from "../types/gwTypes";
import {gwInputs} from "./inputs/gwInputs";
import {ErrorCallback, gwAjax, SuccessCallback} from "./util/gwAjax";
import {GwRegisteredSystem} from "./util/GwRegisteredSystem";
import {GwInitializableSystem} from "./util/GwInitializableSystem";

/**
 * Interface describing the get/set API for getting and setting input values. These operations were available via
 * the gw.api.Util object in 8.0.x/9.0.x. Now they're directly available via gw.api but the gw.api.Util object is
 * still present for backwards compatibility. Both gw.api and gw.api.Util implement this interface
 */
export interface GwGetSetApi {

  /**
   * Return the value of a detail view input element
   * If the internal call throws an error, this method will catch and return the error as the value
   * @param {String} id full id of the input element
   * @returns {String|Array} the client side value of the input element
   */
  getValue (id: string): any | any[] | Error;

  /**
   * Return the values of multiple detail view input elements
   * If the internal call throws an error, this method will catch and return the error as the value
   * @param {Array} ids array of full ids of the input element
   * @returns {Array} array of the client side values of the input elements
   */
  getValues (ids: string[]): any[] | Error;

  /**
   * Set the value of a detail view input element
   * Returns true/false depending on the success of the internal method call.
   * If the internal method call throw an error, this method will catch it and return the error
   *
   * The set/get value methods are often invoked by content within an PCF TemplatePanel, which
   * automatically converts a PCF element reference to its client side id for the JavaScript call.
   * For example,
   *
   *   <TemplatePanel>
   *     <TemplatePanelContents>
   *       <ReferencedWidget widget="colorCode"/>
   *       <![CDATA[
   *         <script>
   *           selectColor(color) {
   *             gw.api.setValue('${colorCode}', color);
   *           }
   *         </script>
   *       ...
   *       ]]>
   *     </TemplatePanelContents>
   *   </TemplatePanel>
   *
   * @param {String} id full id of the input element
   * @param {boolean} forceChangeEvent if true then fire a JavaScript change event after changing the input value
   * @param {String|Array} value new client side value of the input element
   */
  setValue (id: string, value: string | any[], forceChangeEvent: boolean): boolean | Error;

  /**
   * Set the value of multiple detail view input elements
   * Returns true/false depending on the success of the internal method call.
   * If the internal method call throw an error, this method will catch it and return the error
   * @param {Object} valuesById map of new input values, keyed by the full id of the corresponding input
   * @param {boolean} forceChangeEvent if true then fire a JavaScript change event after changing each input value
   */
  setValues (valuesById: GwMap, forceChangeEvent: boolean): boolean | Error;
}

/**
 * Public API for use by customer code, accessed via gw.api - for example gw.api.getValue(id)
 */
export class GwApi implements GwGetSetApi {

  private _util: GwGetSetApi | null = null;

  /**
   * Add an error handler that will be called if there is an error when the client makes an AJAX call to
   * the server (the majority of UI interactions cause AJAX calls). The error handler will be given three
   * arguments: the XMLHttpRequest object, an error type string and an optional HTTP error string.
   *
   * The handler should return true if it has handled the error, in which case any further error handling
   * is aborted. If it returns any other result, or throws an exception, normal error handling will continue.
   *
   * The request object can be used to examine the status code and response data. It is actually a jQuery
   * jqXHR, see the jQuery documentation for details.
   *
   * The error type string will be one of null, "timeout", "error", "abort", "parsererror" or
   * "unexpected_response". These are mainly the standard jQuery strings but "unexpected_response" is
   * Guidewire specific. It is used if the request succeeded but returned content that does not look
   * like a normal Guidewire response. This can happen, for example, if a customer uses a proxy layer
   * between the client and server, and that layer sometimes sends its own response. Note that in the
   * case of a redirect the browser will automatically redirect the AJAX request, so any redirection
   * will have already happened by the time the error handler is called.
   *
   * The HTTP error string, if present, will be the error string returned by the server when it returned
   * a non 2xx response code.
   *
   * Adding the same handler multiple times has no effect, the handler will only be added once
   *
   * @param errorHandler a that takes a request, error type and optional HTTP error string and
   *   returns a boolean
   *
   * @return the handler; may be useful when adding an anonymous
   */
  addServerErrorHandler (errorHandler: ErrorCallback): ErrorCallback {
    return gwAjax.addServerErrorHandler(errorHandler);
  }

  /**
   * Remove a previously added server error handler. The argument should be a handler previously
   * given as an argument to addServerErrorHandler. If the handler is not a, or is a
   * that was never added or has already been removed, then this method has no effect.
   */
  removeServerErrorHandler (errorHandler: ErrorCallback): void {
    gwAjax.removeServerErrorHandler(errorHandler);
  }

  /**
   * For use by a template panel, to call the panel's server side action handler with the given JSON
   * object as its argument. This will cause a full UI refresh.
   */
  submitTemplateAction (templatePanelId: string, json: GwMap): void {
    gwUtil.setEventParam("templateJson", JSON.stringify(json));
    gwUtil.fireEvent(templatePanelId + "_templateAction");
  }

  /**
   * For use by a template panel, to call the panel's server side update handler with the given JSON
   * object as its argument. This will not block or refresh the UI, and the success
   * will be called with the result of the update handler. The optional error handler will be called
   * if the call to the server fails for any reason. The error handler should be used to do any template
   * specific clean up, but does not need to display any message; the normal server error handler will
   * be called once it returns.
   */
  updateTemplate (templatePanelId: string, json: GwMap,
                  success: SuccessCallback,
                  error?: ErrorCallback): void {
    const parameters: GwMap = {
      __templatePanelId: templatePanelId,
      templateJson: JSON.stringify(json)
    };

    gwAjax.ajaxRequest(parameters, success, error);
  }

  /**
   * Return the value of a detail view input element
   * If the internal call throws an error, this method will catch and return the error as the value
   * @param {String} id full id of the input element
   * @returns {String|Array} the client side value of the input element
   */
  getValue (id: string): any | any[] | Error {
    let val: any;
    try {
      val = gwInputs.getValueById(id);
    } catch (e) {
      gwUtil.devlog((e as Error).message);
      val = e;
    }

    return val;

  }

  /**
   * Return the values of multiple detail view input elements
   * If the internal call throws an error, this method will catch and return the error as the value
   * @param {Array} ids array of full ids of the input element
   * @returns {Array} array of the client side values of the input elements
   */
  getValues (ids: string[]): any[] | Error {
    let val: any;
    try {
      val = gwInputs.getValuesByIds(ids);
    } catch (e) {
      val = e;
      gwUtil.devlog((e as Error).message);
    }

    return val;
  }

  /**
   * Set the value of a detail view input element
   * Returns true/false depending on the success of the internal method call.
   * If the internal method call throw an error, this method will catch it and return the error
   *
   * The set/get value methods are often invoked by content within an PCF TemplatePanel, which
   * automatically converts a PCF element reference to its client side id for the JavaScript call.
   * For example,
   *
   *   <TemplatePanel>
   *     <TemplatePanelContents>
   *       <ReferencedWidget widget="colorCode"/>
   *       <![CDATA[
   *         <script>
   *           selectColor(color) {
   *             gw.api.setValue('${colorCode}', color);
   *           }
   *         </script>
   *       ...
   *       ]]>
   *     </TemplatePanelContents>
   *   </TemplatePanel>
   *
   * @param {String} id full id of the input element
   * @param {boolean} forceChangeEvent if true then fire a JavaScript change event after changing the input value
   * @param {String|Array} value new client side value of the input element
   */
  setValue (id: string, value: string | any[], forceChangeEvent: boolean = true): boolean | Error {
    let val: boolean | Error;

    try {
      val = gwInputs.setValueById(id, value, forceChangeEvent);
    } catch (e) {
      gwUtil.devlog((e as Error).message);
      val = e as Error;
    }

    return val;
  }

  /**
   * Set the value of multiple detail view input elements
   * Returns true/false depending on the success of the internal method call.
   * If the internal method call throw an error, this method will catch it and return the error
   * @param {Object} valuesById map of new input values, keyed by the full id of the corresponding input
   * @param {boolean} forceChangeEvent if true then fire a JavaScript change event after changing each input value
   */
  setValues (valuesById: GwMap, forceChangeEvent: boolean = true): boolean | Error {
    let val: boolean | Error;

    try {
      val = gwInputs.setValuesByIds(valuesById, forceChangeEvent);
    } catch (e) {
      gwUtil.devlog((e as Error).message);
      val = e as Error;
    }

    return val;
  }

  /**
   * For backwards compatibility with previous version the getValue, getValues, setValue and setValues functions
   * are available under gw.api.Util. For example gw.api.getValue(id) and gw.api.Util.getValue(id) are equivalent,
   * though new code should prefer just gw.api.getValue(id)
   */
  get Util (): GwGetSetApi {
    if (this._util === null) {
      this._util = {
        getValue: this.getValue.bind(this),
        getValues: this.getValues.bind(this),
        setValue: this.setValue.bind(this),
        setValues: this.setValues.bind(this)
      };
    }
    return this._util;
  }

  /**
   * Register a singleton "system" object. System objects appear in the gw.globals map under the name given by their
   * getSystemName method. They can also be referenced in "event descriptors", for example data-gw-click="x.y" would
   * call method "y" on the system registered under name "x".
   *
   * System objects can also have an init method. If they do then this method is called after every page reload.
   *
   * @param system a non null singleton with a getSystemName method and, optionally, an init method
   */
  registerGlobalSystem (system: { getSystemName (): string, init? (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void }): void {
    GwRegisteredSystem.register(system);
    if (this.hasInit(system)) {
      GwInitializableSystem.register(system);
    }
  }

  /** User defined type guard, determines if system has an init method */
  private hasInit (system: { getSystemName (): string, init? (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void })
      : system is { getSystemName (): string, init (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void } {
    return "init" in system;
  }

}
