import {GwInitializableSystem} from "../../core/util/GwInitializableSystem";
import {
    GwDomNode,
    GwEventType,
    GwKeyboardNavigation,
    GwMap,
    GwPartialReloadDetails,
    HTMLRadioElement
} from "../../types/gwTypes";
import {gwNavigation} from "../../core/gwNavigation";
import {gwUtil} from "../../core/util/gwUtil";
import {gwEvents} from "../../core/events/gwEvents";
import {gwFocus} from "../../core/gwFocus";

export class GwRadioDiv extends GwInitializableSystem implements GwKeyboardNavigation {

    init(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
        gwNavigation.registerNavClasses(["gw-radioDiv"], gwRadioDiv);
    }

    getSystemName(): string {
        return "gwRadioDiv";
    }

    possiblySyncAllRadioDivs(radio: HTMLRadioElement): void {
        if(radio.hasAttribute("data-gw-uses-radio-div")) {
            const radioInputAndSiblingInputs = document.getElementsByName(radio.name) as NodeListOf<HTMLRadioElement>;
            radioInputAndSiblingInputs.forEach((el: HTMLRadioElement) => this.syncRadioDivToRadioInput(el));
        }
    }

    private syncRadioDivToRadioInput(internalInput: HTMLRadioElement): void {
        const parentRadioDiv = gwUtil.getSelfOrFirstParentWithClass(internalInput, "gw-radioDiv");
        if (!parentRadioDiv) {
            throw new Error("Unable to locate radio div for corresponding input named: " + internalInput.name);
        }

        gwUtil.conditionalAddRemoveClass(internalInput.checked, parentRadioDiv, "gw-checked");
        gwUtil.conditionalAddRemoveAttr(internalInput.checked, parentRadioDiv, "aria-checked", "true");
        gwUtil.conditionalAddRemoveAttr(internalInput.disabled, parentRadioDiv, "aria-disabled", "true");
        parentRadioDiv.setAttribute("tabindex", internalInput.checked ? "0" : "-1");
    }

    onRadioDivClick(radioDiv: HTMLDivElement): void {
        const input = this.getCorrespondingInput(radioDiv);
        if (input.checked || input.disabled) {
            return;
        }
        
        const radioInputAndSiblingInputs = document.getElementsByName(input.name) as NodeListOf<HTMLRadioElement>;
        radioInputAndSiblingInputs.forEach(el => el.checked = false);
        input.checked = true;
        this.possiblySyncAllRadioDivs(input);
        gwEvents.forceGlobalChangeEvent(input);
    }

    private isConfirmSpecified (radioButtonWidget: GwDomNode): boolean {
        return !!gwUtil.getSelfOrFirstParentWithAttr(radioButtonWidget, "data-gw-confirm");
    }

    /**
     * This is used in various ht templates to ensure that the radio div status synced with the underlying input radio
     * @param valueWidget
     * @param args
     */
    radioDivChangeConfirmWrapper (valueWidget: GwDomNode, args: GwMap): void {
        const radioInput = gwUtil.getDomNodeOrThrow<HTMLRadioElement>("input", valueWidget);

        this.possiblySyncAllRadioDivs(radioInput);

        if (args && args.onChangeMethod) {
            gwEvents.handleOnChangeMethod(args.onChangeMethod, valueWidget, {id: valueWidget.id});
        }
    }

    private getCorrespondingDiv(radioInput: HTMLRadioElement): HTMLDivElement {
        return gwUtil.getSelfOrFirstParentWithClassOrThrow(radioInput,"gw-radioDiv") as HTMLDivElement;
    }

    private getCorrespondingInput(radioDiv: HTMLDivElement): HTMLRadioElement {
        const checkboxInput = radioDiv.querySelector("input[data-gw-uses-radio-div]");
        if (!checkboxInput) {
            throw new Error("Unable to locate inner radio input element for radio div id: " + radioDiv.id);
        }

        return checkboxInput as HTMLRadioElement;
    }

    private getSiblingRadioDivByIndex(radioDiv: HTMLDivElement, siblingIndex: number): HTMLDivElement | null {
        const renderIdSplit = radioDiv.id.split("_");
        renderIdSplit.pop();
        const renderId = renderIdSplit.join("_");
        const siblingId = `${renderId}_${siblingIndex}`;
        return document.getElementById(siblingId) as HTMLDivElement | null;
    }

    private getPositionInSetAndSetSize(radioDiv: HTMLDivElement): null | {posInSet: number, setSize: number} {
        const posInSet = radioDiv.getAttribute("aria-posinset");
        const setSize = radioDiv.getAttribute("aria-setsize");

        if (!gwUtil.hasValue(posInSet) || !gwUtil.hasValue(setSize)) {
            console.error("Unable to locate the ariaPosInSet or ariaSetSize attributes required for navigation.", radioDiv);
            return null;
        }

        return {posInSet: Number.parseInt(posInSet), setSize: Number.parseInt(setSize)}
    }

    setEnabledForRadioDivGroup(widgetEl: GwDomNode, enabled: boolean = false): void {
        const radios = gwUtil.getDomNodesByAttr("name", widgetEl.id);
        gwUtil.forEachReverse(radios, (radio) => {
            radio.disabled = !enabled;
            this.syncRadioDivToRadioInput(radio);
        });
    }

    up(radioDiv: HTMLDivElement, info: GwMap, event: GwEventType): boolean {
        return this.left.call(this, radioDiv, info, event);
    }

    down(radioDiv: HTMLDivElement, info: GwMap, event: GwEventType): boolean {
        return this.right.call(this, radioDiv, info, event);
    }

    left(radioDiv: HTMLDivElement, info: GwMap, event: GwEventType): boolean {
        const possiblyNullPosAndSetSize = this.getPositionInSetAndSetSize(radioDiv);
        if (!possiblyNullPosAndSetSize) {
            return true;
        }

        const {posInSet, setSize} = possiblyNullPosAndSetSize;

        let nextPos = posInSet - 1;
        nextPos = nextPos < 1 ? setSize : nextPos;
        const nextIndex = nextPos - 1;
        return this.navigateToIndex(radioDiv, nextIndex);
    }

    right(radioDiv: HTMLDivElement, info: GwMap, event: GwEventType): boolean {
        const possiblyNullPosAndSetSize = this.getPositionInSetAndSetSize(radioDiv);
        if (!possiblyNullPosAndSetSize) {
            return this.getFailedNavigationMethodResponse();
        }

        const {posInSet, setSize} = possiblyNullPosAndSetSize;

        let nextPos = posInSet + 1;
        nextPos = nextPos > setSize ? 1 : nextPos;
        const nextIndex = nextPos - 1;
        return this.navigateToIndex(radioDiv, nextIndex);
    }

    private getFailedNavigationMethodResponse(): boolean {
        // Right now, no matter what, we just return true, as if we've internally
        // Somehow messed up the connection between hidden radios and radioDivs
        // We still don't want to let some parent element catch the navigation event
        return true;
    }

    private navigateToIndex(radioDiv: HTMLDivElement, index: number): boolean {
        const siblingDiv = this.getSiblingRadioDivByIndex(radioDiv, index);
        if (!siblingDiv) {
            console.error("Unable to locate sibling to navigate to: ", radioDiv);
            return this.getFailedNavigationMethodResponse();
        }

        gwFocus.forceFocus(siblingDiv, false, true);
        // Standard navigation between native radio inputs in a web browser changes the value of the radio
        // of the input as focus moves to it, so we simulate that here, though it's all silliness
        this.onRadioDivClick(siblingDiv);
        return true;
    }
}

export const gwRadioDiv = new GwRadioDiv();