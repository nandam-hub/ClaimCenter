import {GwRegisteredSystem} from "../../core/util/GwRegisteredSystem";
import {gwEvents} from "../../core/events/gwEvents";
import {gwUtil} from "../../core/util/gwUtil";
import {
    GW_BREAKER,
    GwDomNode, GwDomNodeList,
    GwMap,
    HTMLCheckboxElement,
} from "../../types/gwTypes";


export class GwCheckboxDiv extends GwRegisteredSystem {

    getSystemName(): string {
        return "gwCheckboxDiv";
    }

    possiblyUpdateGwChanged(checkbox: HTMLCheckboxElement, isChanged: boolean): void {
        if(checkbox.hasAttribute("data-gw-uses-checkbox-div")) {
            const checkboxDiv = this.getCorrespondingDiv(checkbox);
            if (!checkboxDiv) {
                return;
            }

            gwUtil.conditionalAddRemoveClass(isChanged, checkboxDiv, "gw-changed");
        }

    }

    syncCheckboxDivToCheckboxInput(checkbox: HTMLCheckboxElement): void {
        if(checkbox.hasAttribute("data-gw-uses-checkbox-div")) {
            const checkboxDiv = this.getCorrespondingDivOrThrow(checkbox);

            gwUtil.conditionalAddRemoveClass(checkbox.checked, checkboxDiv, "gw-checked");
            gwUtil.conditionalAddRemoveAttr(checkbox.checked, checkboxDiv, "aria-checked", "true");
            gwUtil.conditionalAddRemoveAttr(checkbox.disabled, checkboxDiv, "aria-disabled", "true");
        }
    }

    onCheckboxDivClick(checkboxDiv: HTMLDivElement, args: unknown, e: PointerEvent): void {
        const input = this.getCorrespondingInputOrThrow(checkboxDiv);
        if (input.disabled) {
            return;
        }

        input.checked = !input.checked;
        this.syncCheckboxDivToCheckboxInput(input);
        gwEvents.forceGlobalChangeEvent(input);
    }

    /**
     * This is used from various checkbox ht templates to ensure that the checkbox divs will be updated to
     * match their underlying checkbox input
     * @param valueWidget
     * @param args
     */
    checkboxDivChangeConfirmWrapper (valueWidget: GwDomNode, args: GwMap): void {
        const checkboxInput = gwUtil.getDomNodeOrThrow<HTMLCheckboxElement>("input", valueWidget);
        this.syncCheckboxDivToCheckboxInput(checkboxInput);

        if (args && args.onChangeMethod) {
            gwEvents.handleOnChangeMethod(args.onChangeMethod, valueWidget, {id: valueWidget.id});
        }
    }

    private getCorrespondingDiv(checkbox: HTMLCheckboxElement): HTMLDivElement | null {
        return gwUtil.getSelfOrFirstParentWithClass(checkbox, "gw-checkboxDiv") as HTMLDivElement | null;
    }

    private getCorrespondingDivOrThrow(checkbox: HTMLCheckboxElement): HTMLDivElement {
        const checkboxDiv = this.getCorrespondingDiv(checkbox);
        if (!checkboxDiv) {
            throw new Error("Unable to locate checkbox div for corresponding input named: " + checkbox.name);
        }

        return checkboxDiv;
    }

    private getCorrespondingInputOrThrow(checkboxDiv: HTMLDivElement): HTMLCheckboxElement {
        const checkboxInput = checkboxDiv.querySelector("input[data-gw-uses-checkbox-div]");
        if (!checkboxInput) {
            throw new Error("Unable to locate inner checkbox input element for checkbox div id: " + checkboxDiv.id);
        }

        return checkboxInput as HTMLCheckboxElement;
    }

    private getSiblingCheckboxDivByIndex(checkboxDiv: HTMLDivElement, siblingIndex: number): HTMLDivElement | null {
        const allCheckboxesInGroup = this.getAllCheckboxDivsInParentGroup(checkboxDiv);
        if (!allCheckboxesInGroup) {
            return null;
        }

        return (allCheckboxesInGroup[siblingIndex] || null) as HTMLDivElement | null;
    }

    private getAllCheckboxDivsInParentGroup(checkboxDiv: HTMLDivElement): null | GwDomNodeList {
        const parent = gwUtil.getSelfOrFirstParentWithClass(checkboxDiv,"gw-checkboxDiv--checkbox-group") as HTMLDivElement;
        if (!parent) {
            return null;
        }

        return gwUtil.getDomNodes("gw-checkboxGroup", parent);
    }

    private getPositionInSetAndSetSize(checkboxDiv: HTMLDivElement): null | {posInSet: number, setSize: number} {
        const allCheckboxesInGroup = this.getAllCheckboxDivsInParentGroup(checkboxDiv);
        if (!allCheckboxesInGroup) {
            return null;
        }

        let posInSet = -1;

        gwUtil.forEachReverse(allCheckboxesInGroup, (el, k, coll, i) => {
            if (checkboxDiv == el) {
                posInSet = i;
                return GW_BREAKER;
            }

            return;
        });

        if(posInSet < 0) {
            return null;
        }

        return {posInSet: posInSet, setSize: allCheckboxesInGroup.length}
    }

    setEnabledForCheckboxGroup(widgetEl: GwDomNode, enabled: boolean = false): void {
        const checkboxes = gwUtil.getDomNodesByAttr("name", widgetEl.id);
        gwUtil.forEachReverse(checkboxes, (checkbox) => {
            checkbox.disabled = !enabled;
            this.syncCheckboxDivToCheckboxInput(checkbox);
        });
    }
}

export const gwCheckboxDiv = new GwCheckboxDiv();