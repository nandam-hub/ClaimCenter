import {
  GwDomNode, GwEventType, GwKeyboardNavigation, GwMap,
  HTMLTextInputElement
} from "../../types/gwTypes";
import {GwInitializableSystem} from "../util/GwInitializableSystem";
import {gwNavigation} from "../gwNavigation";
import {gwUtil} from "../util/gwUtil";
import {gwFocus} from "../gwFocus";
import {gwAjax} from "../util/gwAjax";
import {gwHelpText} from "../gwHelpText";
import {gwInputSystems} from "./gwInputSystems";
import {gwInputs} from "./gwInputs";
import {GwDivBuilder} from "../util/GwDivBuilder";
import {gwEvents} from "../events/gwEvents";
import {gwKeys} from "../events/gwKeys";
import {gwForm} from "../gwForm";
import {GwEventDescription} from "../events/GwEventDescription";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 *
 * System for providing the autocomplete entries drop down.
 * Makes ajax requests on a delay to retrieve possible entries.
 *
 * Keymap:
 * up: move up in entry selection dropdown
 * down: move down in entry selection dropdown
 * right: remove selection range, move cursor position to end, close autocomplete
 * left: revert input value and close autocomplete
 * escape: revert input value and close autocomplete
 * enter: remove selection range, move cursor position to end, close autocomplete, possibly fire post on change
 * click on entry in dropdown: same as enter key
 */
export class GwAutocomplete extends GwInitializableSystem implements GwKeyboardNavigation {
  getSystemName (): string {
    return "gwAutocomplete";
  }

  private timeoutKey: number = -1;
  /**
   * The delay after the last keypress before the autocomplete will be refreshed and rendered
   * @type {number}
   */
  private readonly autocompleteDelay: number = 500;
  /**
   * Caches the last value we sent a request to the server for, preventing a new
   * autocomplete request on focus if the value hasn't changed and the autocomplete
   * is still visible.
   * @type {string}
   */
  private autocompletedValueCache: string | null = null;
  /**
   * The current entry in the autocomplete dropdown when using arrow keys to navigate up and down
   * @type {object}
   */
  private currentAutocompleteEntry: GwDomNode | null = null;
  /**
   * Keeps track of the current autocomplete input element
   * @type {boolean}
   */
  private autocompleteInput: HTMLTextInputElement | null = null;
  /**
   * Keeps track of the current autocomplete div element
   * @type {boolean}
   */
  private autocompleteDiv: HTMLDivElement | null = null;

  init (isFullPageReload: boolean): void {
    if (isFullPageReload) {
      gwNavigation.registerNavFunction((node) => {
        return node.hasAttribute("data-gw-input-for-autocomplete");
      }, gwAutocomplete);
    }
  }

  private cancelAnyPendingAutocomplete (): void {
    if (this.timeoutKey >= 0) {
      clearTimeout(this.timeoutKey);
      this.timeoutKey = -1;
    }
  }

  /**
   * Called when an autocomplete input gets focus
   * @param {HTMLTextInputElement} input autocomplete input that just got focus
   * @param {GwEventDescription} eventDescription event description, from data-gw-focus attribute
   * @param {FocusEvent} event focus event
   */
  autocompleteOnFocus (input: HTMLTextInputElement, eventDescription: GwEventDescription, event: FocusEvent): void {
    if (this.isFocusEventCausedByAutocompleteEntry(event)) {
      return;
    }
    this.autocompletedValueCache = null;
    this.currentAutocompleteEntry = null;
    this.autocompleteInput = null;
    this.autocompleteDiv = null;
    this.cancelAnyPendingAutocomplete();
  }

  /**
   * @public
   * Fetches and Renders autocomplete information for the given node. Called when an autocomplete
   * input first gets focus (via autocompleteOnFocus) and then whenever its value changes
   * @param input the input node that needs to be autocompleted
   * @param bypassCharThreshold whether to bypass the character threshold which prevents autocomplete from returning too many candidates
   */
  autocomplete (input: HTMLTextInputElement, bypassCharThreshold: boolean = false): void {
    this.cancelAnyPendingAutocomplete();
    this.timeoutKey = window.setTimeout(this.fetchAutocompleteData.bind(this, input.name || input.id, bypassCharThreshold), this.autocompleteDelay);
  }

  private inputTabbed (): void {
    this.closeAutocomplete();
  }

  private addTabListenerToInput (): void {
    if (this.autocompleteInput) {
      this.autocompleteInput.setAttribute("data-gw-key", "gwAutocomplete.tabOrEnterKeyPressed key:9|13 enableDefault:true");
    }
  }

  private removeTabListenerFromInput (): void {
    if (this.autocompleteInput) {
      this.autocompleteInput.setAttribute("data-gw-key", gwEvents.complexAttributeTransforms["data-gw-autocomplete"]["data-gw-key"]);
    }
  }

  /**
   * @private
   * Builds the request object to send a request for autocomplete results
   * @param widgetId the renderId of the widget being autocompleted
   * @param bypassCharThreshold whether to bypass the character threshold which prevents autocomplete from returning too many candidates
   */
  private fetchAutocompleteData (widgetId: string, bypassCharThreshold: boolean = false): void {
    this.timeoutKey = -1;
    const input = gwUtil.getDomNodeByName(widgetId) as HTMLTextInputElement;
    if (!input) {
      return;
    }
    const valueWidget = gwForm.findEnclosingValueWidget(input);
    if (!valueWidget) {
      return;
    }

    const inputValue = gwInputSystems.getValueWithMaskTrimmed(input);
    const minChars = +gwUtil.getDatasetPropOrDefault(valueWidget, "gwCharThreshold", "1");
    if (inputValue.length < minChars && !bypassCharThreshold) {
      this.closeAutocomplete();
      return;
    }

    if (this.autocompletedValueCache !== inputValue) {
      this.autocompletedValueCache = inputValue;

      const requestObject: GwAutoCompleteRequest = {textSoFar: inputValue, caretPos: input.selectionStart || 0, widgetId, additionalArgs: {}};

      const dependentFieldNames = gwUtil.getDatasetPropOrDefault(valueWidget, "gwDependantFields").split(",");
      if (dependentFieldNames[0]) {
        for (let i = 0; i < dependentFieldNames.length; i++) {
          const fieldName = dependentFieldNames[i];
          const fieldInput = gwUtil.getDomNodeByName(fieldName) as HTMLInputElement;
          if (fieldInput) {
            requestObject.additionalArgs[fieldName] = fieldInput.value;
          }
        }
      }

      const requestParams: GwMap = {};
      requestParams["__autocomplete"] = JSON.stringify(requestObject);

      gwAjax.ajaxRequest(requestParams,
          this.renderAutocompleteData.bind(this, widgetId, inputValue),
          this.handleAutocompleteError.bind(this, widgetId)
      );
    }
  }

  /**
   * @private
   * Handles a server response for autocomplete, creates the autocomplete elements under the input, or
   * destroys them if they are visible but there's nothing to show
   * @param widgetName the id of the autocomplete widget
   * @param originalInputValue the autocomplete input's value at the time the server request was made
   * @param data the data from the server
   */
  private renderAutocompleteData (widgetName: string, originalInputValue: string, data: GwMap): void {
    if (data.results.length > 0) {
      this.createAutocompleteEntries(widgetName, originalInputValue, data.results);
    } else {
      this.destroyAutocompleteEntriesIfVisible(widgetName);
    }
  }

  /**
   * @private
   * Create autocomplete entries matching the given result list under the input widget with the given name.
   * @param widgetName name of the autocomplete widget
   * @param originalInputValue the autocomplete input's value at the time the server request was made
   * @param results a non empty list of autocomplete results
   */
  private createAutocompleteEntries (widgetName: string, originalInputValue: string, results: any[]): void {
    this.autocompleteInput = gwUtil.getDomNodeByAttr("name", widgetName) as HTMLTextInputElement;
    const input = this.autocompleteInput;

    // If the input does not have focus, then the user tabbed in, then tabbed out before this response came back, so bail
    if (input && document.activeElement === input && gwInputSystems.getValueWithMaskTrimmed(input) === originalInputValue) {
      // Remove the focus tag, then put it back when the element is blurred. This allows us to click to select without popping the panel back up.
      input.removeAttribute("data-gw-focus");
      input.setAttribute("data-gw-blur", "gwAutocomplete.autocompleteInputBlurred");
      input.setAttribute("data-gw-input-for-autocomplete", "true");
      const $parent = $(input).parent();
      $parent.addClass("gw-autocomplete--container");

      if (this.autocompleteDiv) {
        gwUtil.clearInnerHTML(this.autocompleteDiv);
      } else {
        this.autocompleteDiv = gwUtil.createDivWithId("gw-autocomplete");
      }

      $parent.append(this.autocompleteDiv);

      const valueWidget = gwForm.findEnclosingValueWidget(input);
      const styleMarkup = valueWidget && valueWidget.hasAttribute("data-gw-autocomplete-markup");
      for (let i = 0; i < results.length; i++) {
        const entryDiv = GwDivBuilder.withClasses("gw-autocomplete--entry").build();

        const displayText = results[i].displayText;
        if (styleMarkup) {
          gwUtil.dangerouslySetInnerHTML(entryDiv, this.replaceStyles(displayText));
        } else {
          entryDiv.textContent = displayText;
        }

        entryDiv.dataset.gwEntryValue = results[i].text;
        entryDiv.dataset.gwClick = "gwAutocomplete.clickAutocompleteEntry";
        entryDiv.tabIndex = -1;
        this.autocompleteDiv.appendChild(entryDiv);
      }

      this.renderAutocomplete();
      this.currentAutocompleteEntry = null;
      this.setCurrentAutocompleteEntry("down");
      this.setInputBasedOnCurrentEntry();
    }
  }

  private setInputBasedOnCurrentEntry (): void {
    if (!this.autocompleteInput || !this.currentAutocompleteEntry) {
      return;
    }

    const input = this.autocompleteInput;

    let currentValue = gwInputSystems.getValueWithMaskTrimmed(input);

    if (input.selectionStart && input.selectionEnd &&
        input.selectionStart < input.selectionEnd &&
        input.selectionEnd >= currentValue.length) {
      currentValue = currentValue.substring(0, input.selectionStart);
    }

    let entryValue = this.currentAutocompleteEntry.dataset.gwEntryValue || "";
    // If the entry value is shorter than the currentvalue, then the user has modified
    // the currentValue during the round trip back from the server.
    // [OR]
    // the entry value back from the server has had its whitespace trimmed
    // such that it no longer matches the input
    // [OR]
    // the client trimmed the whitespace somewhere when it sent the value back
    // to the server in the first place.
    if (entryValue.length < currentValue.length) {
      entryValue = currentValue;
    }

    this.setInputValue(entryValue);
    gwInputSystems.setSelectionRange(input, currentValue.length, entryValue.length);
  }

  private setInputValue (text: string): void {
    if (this.autocompleteInput) {
      gwInputs.setValueOnTextInputElement(this.autocompleteInput, text, undefined, false, "autocomplete");
    }
  }

  /**
   * Renders autocomplete using the input as a reference to position
   * Attempts to align it to the left edge of the input it's displayed for.
   * - If it's offscreen right, then aligns itself to the right of the input
   * @link - gw.resizer.windowHeight, gw.resizer.windowWidth
   * @private
   */
  private renderAutocomplete (): void {
    const input = this.autocompleteInput;
    const autocomplete = this.autocompleteDiv;
    if (!input || !autocomplete) {
      return;
    }

    const autocompleteParent = gwUtil.getSelfOrFirstParentWithClass(input, "gw-ValueWidget") || input.parentElement;

    if (autocompleteParent) {
      this.addTabListenerToInput();
      autocomplete.style.display = "block";
      const placedAbove = gwInputSystems.preventFloatingElementFromBeingOffscreen(autocompleteParent as HTMLDivElement, input, autocomplete);
      autocompleteParent.setAttribute("data-gw-autocomplete-v-pos", placedAbove ? "above" : "below");
      gwHelpText.possiblyForceHelptextVAlign(autocompleteParent, input);
    }
  }

  /***
   * @private
   * Called if there is an error while calling the server to fetch autocomplete entries
   * @param widgetName name of the autocomplete widget
   */
  private handleAutocompleteError (widgetName: string): void {
    this.destroyAutocompleteEntriesIfVisible(widgetName);
    gwFocus.clearFocus();
  }

  /**
   * @private
   * Destroy any visible autocomplete entries under the widget with the given name.
   * @param widgetName name of the autocomplete widget
   */
  private destroyAutocompleteEntriesIfVisible (widgetName: string): void {
    this.closeAutocomplete();
  }

  /**
   * Replaces "markers" with a div containing a markup class plus the tag for styling
   * @param displayText the display text to replace
   * @returns the displayText with divs inserted
   */
  private replaceStyles (displayText: string): string {
    // If a marker open tag has whitespace on either side must add &nbsp; or the spacing gets lost
    displayText = displayText.replace(/(\s*)\[(\w+)\](\s*)/g, (match, ...groups) => {
      return (groups[0] || groups[2] ? "&nbsp;" : "") + `<div class=\"gw-autocomplete--markup gw-${groups[1]}\">`;
    });
    return displayText.replace(/\[\/\w+]/g, "</div>");
  }

  private setCurrentAutocompleteEntry (dir: "up" | "down"): void {
    if (!this.autocompleteDiv) {
      return;
    }

    if (this.currentAutocompleteEntry) {
      gwUtil.removeClass(this.currentAutocompleteEntry, "gw-autocomplete--current-entry");
    }

    if (!this.currentAutocompleteEntry) {
      this.currentAutocompleteEntry = this.autocompleteDiv.firstChild as GwDomNode;
    } else if (dir === "down" && this.currentAutocompleteEntry.nextSibling) {
      this.currentAutocompleteEntry = this.currentAutocompleteEntry.nextSibling as GwDomNode;
    } else if (dir === "up" && this.currentAutocompleteEntry.previousSibling) {
      this.currentAutocompleteEntry = this.currentAutocompleteEntry.previousSibling as GwDomNode;
    }

    gwUtil.addClass(this.currentAutocompleteEntry, "gw-autocomplete--current-entry");

    if (this.currentAutocompleteEntry && this.currentAutocompleteEntry.scrollIntoView) {
      this.currentAutocompleteEntry.scrollIntoView();
    }

  }

  /**
   * Autocomplete entries are problematic because we don't want them to be focusable (we want
   * to leave focus in the input field, and not affect the tab order) but that means clicking on
   * an entry causes a focus/blur event pair as we leave the input and go to the entry, quickly
   * followed by another focus/blur event pair as we force focus back to the input. We have to
   * watch out for these events and ignore them
   * @param {FocusEvent} e focus event
   * @returns {boolean} true if the focus event is caused by focusing on or returning focus from an entry
   */
  private isFocusEventCausedByAutocompleteEntry (e: FocusEvent): boolean {
    return !!e.relatedTarget && gwUtil.hasClass(e.relatedTarget as GwDomNode, "gw-autocomplete--entry");
  }

  revertAutocompleteInput (): void {
    if (!this.autocompleteInput) {
      return;
    }

    const input = this.autocompleteInput;

    if ((input.selectionStart || 0) < (input.selectionEnd || 0)) {
      this.setInputValue(input.value.substring(0, input.selectionStart || 0));
      gwInputSystems.setCursorPosToEnd(input);
    }
  }

  /**
   * @public
   * Called when the user clicks on an entry in the autocomplete dropdown
   * @param entry the clicked autocomplete node
   * @param info the event info
   */
  clickAutocompleteEntry (entry: GwDomNode, info: GwMap): void {
    if (!this.autocompleteInput) {
      return;
    }

    // The click will have taken focus away from the input so we have to manually force it back
    this.autocompleteInput.focus();
    this.currentAutocompleteEntry = entry;
    this.setInputBasedOnCurrentEntry();
    this.closeAutocomplete();
  }

  enterKeyPressed (node: GwDomNode): void {
    this.closeAutocomplete();
    // closing auto-complete causes a globalChangeEvent to be triggered, which won't be resolved until onBlur is triggered
    // enter key doesn't move focus away from input so we need to process the deferred "change" manually
    gwEvents.forceProcessDeferredChangeEvent(node);

    if (!node) {
      return;
    }
    const valueWidget = gwForm.findEnclosingValueWidget(node);
    if (valueWidget && valueWidget.hasAttribute("data-gw-post-on-enter-key")) {
      this.cancelAnyPendingAutocomplete();
      gwUtil.fireEvent(valueWidget.id + "_act");
    }
  }

  downOrEnterKeyPressed (node: HTMLTextInputElement, args: any, e: KeyboardEvent): void {
    const key = gwKeys.getKeyCode(e);
    if (key === 13) {
      this.enterKeyPressed(node);
    } else {
      // down arrow -- similar to IS 8, 9 and show options on down arrow but only for QuickJump widget
      if (this.isQuickJumpElement(node)) {
        this.autocomplete(node, true);
      }
    }
  }

  isQuickJumpElement (node: HTMLTextInputElement): boolean {
    // check both since, when first visiting a page (the app in general?), using Alt + / or clicking on the text field focuses on the QuickjumpWidget parent div
    // in general, however, we expect the --input element to be focused
    return node.classList.contains("gw-QuickjumpWidget--input") || node.classList.contains("gw-QuickjumpWidget");
  }

  tabOrEnterKeyPressed (node: HTMLTextInputElement, args: any, e: KeyboardEvent): void {
    const key = gwKeys.getKeyCode(e);
    if (key === 9) {
      this.inputTabbed();
    } else {
      this.enterKeyPressed(node);
    }
  }

  autocompleteInputBlurred (node: GwDomNode, info: GwMap, e: FocusEvent): void {
    // If this blur was caused by clicking on an entry, then don't close the dropdown, because we need to click on it
    if (this.isFocusEventCausedByAutocompleteEntry(e)) {
      return;
    }

    this.closeAutocomplete();
  }

  /**
   * Closes the autocomplete panel.
   * removes the blur attribute from the container.
   * restores the focus attribute to the child.
   */
  closeAutocomplete (node?: GwDomNode, info?: GwMap, event?: GwEventType): void {
    const autocomplete = this.autocompleteDiv || document.getElementById("gw-autocomplete");

    if (!autocomplete) {
      return;
    }

    if (autocomplete === node) {
      // If an event is passed in, if the event's target matches the autocomplete element,
      // do not close autocomplete; this is used to prevent closing autocomplete on scroll
      // when the scrolling occurs on the autocomplete element
      return;
    }

    const container = autocomplete.parentElement;
    if (!container) {
      return;
    }

    gwUtil.removeClass(container, "gw-autocomplete--container");
    const input = this.autocompleteInput || container.querySelector("[data-gw-autocomplete]");

    (gwUtil.getSelfOrFirstParentWithClass(input, "gw-ValueWidget") || container).removeAttribute("data-gw-autocomplete-v-pos");

    if (input) {
      input.removeAttribute("data-gw-blur");
      input.setAttribute("data-gw-focus", "gwAutocomplete.autocompleteOnFocus");
      input.removeAttribute("data-gw-input-for-autocomplete");
      gwInputSystems.setCursorPosToEnd(input);
      this.removeTabListenerFromInput();
    }

    //IE doesn't support remove();
    container.removeChild(autocomplete);

    this.autocompleteInput = null;
    this.autocompletedValueCache = null;
    this.currentAutocompleteEntry = null;
  }

  /**
   * @private
   * Should only be called by the navigation system, handles an "up" keystroke
   * when in an autocomplete input
   * @param input the dom node where "up" was pressed
   * @param info the event method info
   * @param event the key event
   */
  up (input: HTMLTextInputElement, info: GwMap, event: GwEventType): boolean {
    if (!this.autocompleteInput) {
      return false;
    }

    this.setCurrentAutocompleteEntry("up");

    this.setInputBasedOnCurrentEntry();
    this.addTabListenerToInput();
    return true;
  }

  /**
   * @private
   * Should only be called by the navigation system, handles an "down" keystroke
   * when in an autocomplete input
   * @param input the dom node where "down" was pressed
   * @param info the method info
   * @param event the event
   */
  down (input: HTMLTextInputElement, info: GwMap, event: GwEventType): boolean {
    if (!this.autocompleteInput) {
      return false;
    }

    this.setCurrentAutocompleteEntry("down");

    this.setInputBasedOnCurrentEntry();
    this.addTabListenerToInput();
    return true;
  }

  left (input: HTMLTextInputElement, info: GwMap, event: GwEventType): boolean {
    this.removeTabListenerFromInput();
    this.revertAutocompleteInput();
    this.closeAutocomplete();
    return false;
  }

  right (input: HTMLTextInputElement, info: GwMap, event: GwEventType): boolean {
    this.removeTabListenerFromInput();
    this.closeAutocomplete();
    return false;
  }
}

export const gwAutocomplete = new GwAutocomplete();

interface GwAutoCompleteRequest {
  additionalArgs: GwMap;
  textSoFar: string;
  caretPos: number;
  widgetId: string;
}
