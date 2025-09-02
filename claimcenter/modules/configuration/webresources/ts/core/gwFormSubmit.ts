import { gwDateValue } from "../comp/dates/gwDateValue";
import { gwApp } from "../plApp";
import { GwAjaxResponseStatus, GwInputElement, GwMap, GwPartialReloadReason } from "../types/gwTypes";
import { gwEvents } from "./events/gwEvents";
import { gwPerfAnalyzer } from "./events/gwPerfAnalyzer";
import { gwConfig } from "./gwConfig";
import { gwDisplayKey } from "./gwDisplayKey";
import { gwForm } from "./gwForm";
import { gwInputs, GwInputValue } from "./inputs/gwInputs";
import { gwAjax } from "./util/gwAjax";
import { gwUtil } from "./util/gwUtil";
import {GwMultiTab, gwMultiTab} from "./gwMultiTab";

const bodyPattern = /^\s*<div.*id='gw-body'/;

const handleResponse = (data: string | GwMap): void => {
  gwPerfAnalyzer.responseReceived();

  /**
   * We are replacing the entire body with a single string
   */
  if (typeof data === "string") {
    if (!!data.match(bodyPattern)) {
      gwUtil.replaceTarget("#gw-body", data, false);
      gwApp.fireAfterGwBodyReplace();
      return;
    }
  } else {
    /**
     * If there are response targets, then we are going to only replace individual elements
     */
    if (data.targets) {
      // If this is a partial page refresh, then we wrap the updater in a timeout, to let the renderer
      // TODO: not sure if this timeout is worth the possible oddness
      setTimeout(() => {
        const length = data.targets.length;
        if (length === 0) {
          // Nothing has changed
          gwUtil.devlog("Response.targets had a length of 0: ", data);
          gwApp.fireAfterPartialPageReload({ reason: GwPartialReloadReason.REPLACE_ITEMS, ids: [] });
          return;
        }
        gwUtil.replaceTargets(0, 0, 40 / length, data.targets, false);
      }, 0);
    }

    if (data.errorpage) {
      gwUtil.replaceTarget("#gw-body", data.errorpage, false);
      gwEvents.enableEvents();
      gwEvents.clearQueuedInternalClick();
    }
    return;
  }

  gwApp.fireAfterPartialPageReload({ reason: GwPartialReloadReason.ERROR });
  gwAjax.handleFailedRequest(data, GwAjaxResponseStatus.UNEXPECTED_RESPONSE, "unexpected_response");
};

let namedNoFormInputs: GwMap = {};

function revertNamedNoFormInputs(): void {
  gwUtil.forEach(namedNoFormInputs, (type, id) => {
    const el = document.getElementById(id) as HTMLInputElement;
    if (el) {
      el.type = type;
    }
  });

  namedNoFormInputs = {};
}

function beforeSerialize(formEl: HTMLFormElement) {
  namedNoFormInputs = {};
  gwUtil.forEach(formEl.querySelectorAll("input[name][id].gw-noForm"), (node) => {
    namedNoFormInputs[node.id] = node.type;
    node.type = "hidden";
  });
}

export function gwFormSubmit(formEl: HTMLFormElement) {
  beforeSerialize(formEl);

  const searchParams = new URLSearchParams();
  searchParams.set(gwUtil.CSRF_PARAM_NAME, gwAjax.getCsrfToken());

  if (gwMultiTab.isMultiTabEnabled()) {
    const multiTabOwnerInfo = gwMultiTab.doFormSubmitStep();
    if (multiTabOwnerInfo) {
      // console.log("IS SENDING ID: " + multiTabOwnerInfo.value.slice(0, 4));
      searchParams.set(multiTabOwnerInfo.key, multiTabOwnerInfo.value);
    }
  }

  formToArray(formEl).forEach((nameAndValue) => {
    const { name, value } = nameAndValue;
    if (Array.isArray(value) || value instanceof FileList) {
      Array.from(value as (string | File)[]).forEach((innerVal: File | string) => searchParams.append(name, innerVal as any));
    } else {
      searchParams.set(name, value as any);
    }
  });

  const abortController = new AbortController();
  let responseReceived: boolean = false;

  window
    .fetch(
      ((window.location.href || "").match(/^([^#]+)/) || [])[1], //clear hash
      {
        method: "POST",
        body: searchParams,
        signal: abortController.signal,
      }
    )
    .then(async (response: Response) => {
      responseReceived = true;

      if (response.ok) {
        let data: string | GwMap = await response.text();
        if (data.startsWith("<!DOCTYPE html>")) {
          // The user has multiple tabs open, logged out of another one, and then clicked a form based action in this one,
          // Just punt them back to the log in page
          window.location.reload();
          return;
        }
        if (!data.match(bodyPattern)) {
          data = JSON.parse(data);
        }

        handleResponse(data);
      } else {
        // need to send errorType on with the method called here for the handlers
        gwApp.fireAfterPartialPageReload({ reason: GwPartialReloadReason.ERROR });
        gwAjax.onRequestError(abortController.signal.aborted ? "timeout" : "error", response.statusText, undefined, response);
        gwEvents.clearQueuedInternalClick();
      }
    })
    .catch((err) => {
      responseReceived = true;
      gwApp.fireAfterPartialPageReload({ reason: GwPartialReloadReason.ERROR });
      gwAjax.onRequestError(abortController.signal.aborted ? "timeout" : "error", err, undefined, {});
      gwEvents.clearQueuedInternalClick();
    })
    .finally(() => {
      revertNamedNoFormInputs();
    });

  const possiblyTimeoutServerRequest = () => {
    window.setTimeout(() => {
      if (abortController && !abortController.signal.aborted && !responseReceived) {
        const shouldKeepWaiting: boolean = window.confirm(
          gwDisplayKey.get("Web.Client.HTTPRequestKeepWaiting", gwConfig.serverTimeoutSeconds())
        );

        if (shouldKeepWaiting) {
          possiblyTimeoutServerRequest();
        } else {
          abortController.abort();
        }
      }
    }, gwConfig.serverTimeoutMillis());
  };

  possiblyTimeoutServerRequest();
}

interface IFormNameAndValue {
  name: string;
  value: GwInputValue | File | FileList;
  type?: string;
}

/**
 * Cribbed from jqueryForm:
 * MIT license
 * https://github.com/jquery-form/form#license
 * @param formEl
 */
export function formToArray(formEl: HTMLFormElement): IFormNameAndValue[] {
  const keyValues: Record<string, IFormNameAndValue> = {};

  Array.from(formEl.elements)
    .filter<HTMLInputElement>((el: Element): el is HTMLInputElement => {
      return el && !!(el as HTMLInputElement).name;
    })
    .forEach((el) => {
      if (el.disabled) {
        if (el.type === "checkbox" && el.checked) {
          // Then we are going to allow the checkbox to go to the server
          // So that we don't convert a null value in the POST into a false
          // When the checkbox value is actually true, but disabled
        } else {
          // Otherwise ignore disabled elements
          return;
        }
      }

      const name = el.name;
      const value = fieldValue(el);

      if (el.type === "file") {
        const files = el.files;

        if (files && files.length) {
          if (files.length === 1) {
            keyValues[name] = { name, value: files[0], type: "file" };
          } else {
            keyValues[name] = { name, value: files, type: "file" };
          }
        } else {
          keyValues[name] = { name, value: "", type: "file" };
        }
        // This is an important check, because we don't want to send up things we have determined to be "null"
        // Most specifically relating to the unchecked radio buttons, that the fieldValue method
        // Returns a null value for
      } else if (gwUtil.hasValue(value)) {
        if (gwDateValue.isDateTimeElement(el)) {
          const dateValueWidget = gwForm.findEnclosingValueWidget(el);
          if (!dateValueWidget) {
            throw new Error("Unable to locate Value widget for date element");
          }

          const dateValueInputName = dateValueWidget.id;

          if (!keyValues[dateValueInputName]) {
            const fourParts = gwDateValue.getFourPartEditableValue(dateValueWidget);
            // Value added just for the update handler to parse
            keyValues[dateValueInputName + "_era"] = { name: dateValueInputName + "_era", value: fourParts[0], type: el.type };
            keyValues[dateValueInputName + "_date"] = { name: dateValueInputName + "_date", value: fourParts[1], type: el.type };
            keyValues[dateValueInputName + "_time"] = { name: dateValueInputName + "_time", value: fourParts[2], type: el.type };
            keyValues[dateValueInputName + "_ampm"] = { name: dateValueInputName + "_ampm", value: fourParts[3], type: el.type };

            // This combined value goes up in the post so that the html diff adapter can use it to determine a value diff
            // But it's ignored by the update handler, which just uses the individually named inputs, including
            // the _date suffix manually created above
            const value = gwDateValue.getPostToServerValue(dateValueWidget);
            keyValues[dateValueInputName] = { name: dateValueInputName, value, type: el.type };
          }
        } else if (gwInputs.isCheckbox(el)) {
          // This callout for checkboxes here is to ensure that the HTMLDiff adapter
          // Which compares the output of the last rendered value, to the parameter that goes up with the form
          // to determine diff. So if we send up "on", then it's always marked as diffed from the rendered value "true"
          const nameAndValue: { name: string; value: string; type?: string } = {
            name,
            value: value === "on" ? "true" : (value as string),
            type: el.type,
          };
          //CheckboxGroups send down multiple checkboxes all with the same name
          //So if the keyValues map already has an entry for this name, we need to turn the value into an array, if it isn't already
          //NOTE: at this point, we could have just made all values array values, and only ever appended to the form, but that
          //opens up another can with the native form elements that already have arrays as values.
          //Or we could go back to just pushing all instances of names into the array, but the complexity of the date widget moved us away from that.
          if (keyValues[name]) {
            const existingNameAndValue = keyValues[name];

            if (!Array.isArray(existingNameAndValue.value)) {
              const existingValue = existingNameAndValue.value as string;
              const newArrayValue = [existingValue];
              existingNameAndValue.value = newArrayValue;
            }

            existingNameAndValue.value.push(nameAndValue.value);
          } else {
            keyValues[name] = nameAndValue;
          }
        } else {
          keyValues[name] = { name, value, type: el.type };
        }
      }
    });

  return Object.values(keyValues);
}

/**
 * Cribbed from jqueryForm:
 * MIT license
 * https://github.com/jquery-form/form#license
 * @param el
 */
function fieldValue(el: GwInputElement): GwInputValue {
  const name = el.name;
  if (!name) {
    return null;
  }

  const elType = el.type;

  // We explicitly allow disabled checkboxes to go up
  if (elType !== "checkbox") {
    if (el.disabled) {
      return null;
    }
  }

  if (elType === "reset" || elType === "button") {
    return null;
  }

  if (elType === "checkbox" || elType === "radio") {
    if ((el as HTMLInputElement).checked) {
      return el.value;
    } else {
      return null;
    }
  }

  if (elType === "submit" || elType === "image") {
    return null;
  }

  if (el instanceof HTMLSelectElement) {
    if (el.selectedIndex === -1) {
      return null;
    } else {
      const selectedValues: string[] = [];

      Array.prototype.forEach.call(el.options, (op: HTMLOptionElement) => {
        if (op.selected && !op.disabled) {
          selectedValues.push(op.value);
        }
      });

      if (el.hasAttribute("multiple")) {
        return selectedValues;
      } else {
        return selectedValues[0];
      }
    }
  } else {
    return "" + el.value;
  }
}
