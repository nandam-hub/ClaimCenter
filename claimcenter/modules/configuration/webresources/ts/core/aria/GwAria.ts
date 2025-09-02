import {GwRegisteredSystem} from "../util/GwRegisteredSystem";
import {GwAriaRole} from "./GwAriaRole";
import {GwDomNode, GwDomNodeList, GwInputElement} from "../../types/gwTypes";
import {
  GwAriaPropertiesAndState, GwAriaProperty,
  GwAriaRelationshipPropertiesAndState
} from "./GwAriaPropertiesAndState";
import {gwUtil} from "../util/gwUtil";
import {gwForm} from "../gwForm";

export class GwAria extends GwRegisteredSystem {
  getSystemName (): string {
    return "gwAria";
  }

  addRoleAttributeToElement (role: GwAriaRole, domEl: GwDomNode): void {
    domEl.setAttribute("role", "" + role);
  }

  addAriaPropertyToElement<T extends GwAriaProperty> (property: T, value: GwAriaPropertiesAndState[T], domEl: GwDomNode): void {
    const attributeAndValue = this.getAriaAttributeAndValue(property, value);

    domEl.setAttribute(attributeAndValue.attribute, attributeAndValue.value);
  }

  /**
   * This has no real difference in functionality to the "add" version at this time.
   */
  setAriaPropertyForElement <T extends GwAriaProperty> (property: T, value: GwAriaPropertiesAndState[T], domEl: GwDomNode): void {
    this.addAriaPropertyToElement(property, value, domEl);
  }

  getAriaAttributeAndValue<T extends GwAriaProperty> (property: T, value: GwAriaPropertiesAndState[T]): {attribute: string, value: string} {
    return {attribute: "aria-" + property, value: Array.isArray(value) ? value.join(" ") : "" + value};
  }

  addAriaPropertyWithReferencesToElement<T extends keyof GwAriaRelationshipPropertiesAndState> (property: T, ownerEl: GwDomNode, elementsWithId: GwDomNodeList): void {
    const idList: string[] = [];

    gwUtil.forEach(elementsWithId, (el) => {
      if (el.hasAttribute("id")) {
        idList.push(el.id);
      } else {
        console.error("Attempting to set an ARIA based reference using a dom element without an id:");
      }
    });

    this.addAriaPropertyToElement(property, idList as GwAriaPropertiesAndState[T], ownerEl);
  }

  /**
   * Add an aria label with value <prefix + current value + suffix> to the input element.
   * @param el An editable (probably text) input.
   */
  addAriaLabelToInputIfPrefixedOrSuffixed (el: GwInputElement): void {
    const parentValueWidget = gwForm.findEnclosingValueWidget(el);
    if (!parentValueWidget) {
      return;
    }
    const prefixEl = parentValueWidget.querySelector(".gw-ValueWidget--prefix");
    const suffixEl = parentValueWidget.querySelector(".gw-ValueWidget--suffix");
    if (!(prefixEl || suffixEl)) {
      return;
    }

    let label = el.value;
    if (prefixEl && prefixEl.textContent) {
      label = prefixEl.textContent + " " + label;
    }
    if (suffixEl && suffixEl.textContent) {
      label = label + " " + suffixEl.textContent;
    }

    this.setAriaPropertyForElement("label", label, el);
  }

}

export const gwAria = new GwAria();
