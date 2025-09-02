import { expect } from "chai";
import "mocha";
import { gwConfig } from "../../core/gwConfig";
import { GwUserInputRestriction } from "../../core/inputs/gwClientValidation";
import { gwCurrency } from "../../core/inputs/gwCurrency";
import { gwInputs } from "../../core/inputs/gwInputs";
import { gwInputSystems } from "../../core/inputs/gwInputSystems";
import { GwDivBuilder } from "../../core/util/GwDivBuilder";
import { HTMLCheckboxOrRadioElement, HTMLTextInputElement } from "../../types/gwTypes";
import { TestGwTestDom } from "../TestGwTestDom.spec";

const domTestId = TestGwTestDom.getNewTestId();

describe("GwInputs", () => {
  before(() => {
    gwCurrency.init(true);
    gwConfig._setPrefPanelDefaults({ enableMacroChars: true, capDateTimeUserInput: true, replaceWordProcessingCharacters: true });
  });

  after(() => {
    TestGwTestDom.removeTestElementsByTestId(domTestId);
  });

  describe("GW External API Setters and Getters", () => {
    it("set and get value on text value widgets", () => {
      const valueWidgetA = createWrapperWidget("inputAName", "text");
      const valueWidgetB = createWrapperWidget("inputBName", "text");

      gwInputs.setValueById("inputAName", "inputAValue");
      gwInputs.setValueById("inputBName", "inputBValue");

      expect(gwInputs.getValueById("inputAName")).to.equal("inputAValue");
      expect(gwInputs.getValueById("inputBName")).to.equal("inputBValue");

      gwInputs.setValueById("inputAName", "newInputAValue");
      expect(gwInputs.getValueById("inputAName")).to.equal("newInputAValue");
      expect(gwInputs.getValueById("inputBName")).to.equal("inputBValue");

      gwInputs.setValueById("inputAName", "null");
      expect(gwInputs.getValueById("inputAName")).to.equal("null");
      expect(gwInputs.getValueById("inputBName")).to.equal("inputBValue");
    });

    it("set and get value on checkbox value widget", () => {
      TestGwTestDom.removeTestElementsByTestId(domTestId);
      const valueWidgetA = createWrapperWidget("inputAName", "checkbox");
      const valueWidgetB = createWrapperWidget("inputBName", "checkbox");

      expect(gwInputs.getValueById("inputAName")).to.equal(false);
      expect(gwInputs.getValueById("inputBName")).to.equal(false);

      gwInputs.setValueById("inputAName", true);
      expect(gwInputs.getValueById("inputAName")).to.equal(true);
      expect(gwInputs.getValueById("inputBName")).to.equal(false);

      gwInputs.setValueById("inputAName", false);
      expect(gwInputs.getValueById("inputAName")).to.equal(false);
      expect(gwInputs.getValueById("inputBName")).to.equal(false);
    });

    it("set and get value on radio value widget", () => {
      TestGwTestDom.removeTestElementsByTestId(domTestId);
      const valueWidgetA = createWrapperWidget("inputAName", "radio");
      const valueWidgetB = createWrapperWidget("inputBName", "radio");

      expect(gwInputs.getValueById("inputAName")).to.equal(undefined);
      expect(gwInputs.getValueById("inputBName")).to.equal(undefined);

      gwInputs.setValueById("inputAName", "0");
      expect(gwInputs.getValueById("inputAName")).to.equal("0");
      expect(gwInputs.getValueById("inputBName")).to.equal(undefined);

      gwInputs.setValueById("inputAName", "1");
      expect(gwInputs.getValueById("inputAName")).to.equal("1");
      expect(gwInputs.getValueById("inputBName")).to.equal(undefined);
    });

    it("set and get value on select", () => {
      TestGwTestDom.removeTestElementsByTestId(domTestId);
      const valueWidgetA = createWrapperWidget("inputAName", "select");
      const valueWidgetB = createWrapperWidget("inputBName", "select");

      expect(gwInputs.getValueById("inputAName")).to.equal("");
      expect(gwInputs.getValueById("inputBName")).to.equal("");

      gwInputs.setValueById("inputAName", "1");
      expect(gwInputs.getValueById("inputAName")).to.equal("1");
      expect(gwInputs.getValueById("inputBName")).to.equal("");

      gwInputs.setValueById("inputAName", "0");
      expect(gwInputs.getValueById("inputAName")).to.equal("0");
      expect(gwInputs.getValueById("inputBName")).to.equal("");
    });
  });

  describe("Test for the input specific set and get", () => {
    it("setValueOnSelect", () => {
      const selectEl = TestGwTestDom.createAndAddTestSelect(domTestId, null, null, { id: "selectEl" });
      const option1 = TestGwTestDom.createAndAddTestOption(selectEl, "1", null, { id: "option1" });
      const option2 = TestGwTestDom.createAndAddTestOption(selectEl, "2", null, { id: "option2" });
      const option3 = TestGwTestDom.createAndAddTestOption(selectEl, "3", null, { id: "option3" });
      const option4 = TestGwTestDom.createAndAddTestOption(selectEl, "4", null, { id: "option4" });
      const option5 = TestGwTestDom.createAndAddTestOption(selectEl, "5", null, { id: "option5" });

      expect(selectEl.value).to.equal("1");
      gwInputs.setValueOnSelect(selectEl, "4");
      expect(selectEl.value).to.equal("4");
      expect(option4.selected).to.be.true;
      expect(option1.selected).to.be.false;

      gwInputs.setValueOnSelect(selectEl, "1");
      expect(selectEl.value).to.equal("1");
      expect(option1.selected).to.be.true;
      expect(option4.selected).to.be.false;
    });

    it("setValuesOnMultiSelect", () => {
      const selectEl = TestGwTestDom.createAndAddTestSelect(domTestId, null, null, { id: "selectEl", multiple: "true" });
      const option1 = TestGwTestDom.createAndAddTestOption(selectEl, "1", null, { id: "option1" });
      const option2 = TestGwTestDom.createAndAddTestOption(selectEl, "2", null, { id: "option2" });
      const option3 = TestGwTestDom.createAndAddTestOption(selectEl, "3", null, { id: "option3" });
      const option4 = TestGwTestDom.createAndAddTestOption(selectEl, "4", null, { id: "option4" });
      const option5 = TestGwTestDom.createAndAddTestOption(selectEl, "5", null, { id: "option5" });

      expect(selectEl.value).to.equal("");
      gwInputs.setValuesOnMultiSelect(selectEl, ["4"]);
      expect(selectEl.value).to.equal("4");
      expect(option4.selected).to.be.true;
      expect(option1.selected).to.be.false;

      gwInputs.setValuesOnMultiSelect(selectEl, ["1", "3", "5"]);
      expect(selectEl.value).to.equal("1");
      expect(option1.selected).to.be.true;
      expect(option2.selected).to.be.false;
      expect(option3.selected).to.be.true;
      expect(option4.selected).to.be.false;
      expect(option5.selected).to.be.true;
    });
  });

  describe("Tests for the helper methods in gwInputs", () => {
    it("isCheckboxOrRadio", () => {
      const optionEl = TestGwTestDom.createAndAddTestOption(TestGwTestDom.createAndAddTestSelect(domTestId));
      const inputEl = buildCurrencyInput();
      const checkbox = buildCheckbox();
      const radio = buildRadio();
      expect(gwInputs.isCheckboxOrRadio(optionEl)).to.be.false;
      expect(gwInputs.isCheckboxOrRadio(inputEl)).to.be.false;
      expect(gwInputs.isCheckboxOrRadio(checkbox)).to.be.true;
      expect(gwInputs.isCheckboxOrRadio(radio)).to.be.true;
    });

    it("getInputByName", () => {
      expect(gwInputs.getInputByName("yes")).to.equal(null);
      expect(gwInputs.getInputByName("no")).to.equal(null);
      expect(gwInputs.getInputByName("yes_fake")).to.equal(null);

      const inputElYes = TestGwTestDom.createAndAddTestInput(domTestId, "1", "yes");
      const inputElNo = TestGwTestDom.createAndAddTestInput(domTestId, "2", "no");
      const inputElYesFake = TestGwTestDom.createAndAddTestInput(domTestId, "1", "yes_fake");

      expect(gwInputs.getInputByName("yes")).to.equal(inputElYes);
      expect(gwInputs.getInputByName("no")).to.equal(inputElNo);
      expect(gwInputs.getInputByName("yes_fake")).to.equal(inputElYesFake);

      expect(gwInputs.getInputByName("yesx")).to.equal(null);
      expect(gwInputs.getInputByName("nox")).to.equal(null);
      expect(gwInputs.getInputByName("yes_fakex")).to.equal(null);
    });

    it("setValueOnTextInputElement", () => {
      const inputEl = buildCurrencyInput();
      expect(inputEl.value).to.be.empty;
      gwInputs.setValueOnTextInputElement(inputEl, "testOption2");
      expect(inputEl.value).to.equal("testOption2");
      gwInputs.setValueOnTextInputElement(inputEl, "testOption3");
      expect(inputEl.value).to.equal("testOption3");
    });
  });
});

const buildCheckbox = (): HTMLCheckboxOrRadioElement => {
  const el = TestGwTestDom.createAndAddTestCheckbox(domTestId);
  return el;
};

const buildRadio = (): HTMLCheckboxOrRadioElement => {
  const el = TestGwTestDom.createAndAddTestRadio(domTestId);
  return el;
};

const buildInputWithUserRestriction = (userRestriction: GwUserInputRestriction): HTMLTextInputElement => {
  const el = TestGwTestDom.createAndAddTestInput(domTestId);
  setUserRestrictedInputOnEl(el, userRestriction);
  return el;
};

const buildCurrencyInput = (val?: string) => {
  const inline = {
    "data-gw-currency-info": "USD;$;,;.;2",
    "data-gw-input": "gwInputSystems.inputEventNotifySystems",
  };

  return TestGwTestDom.createAndAddTestInput(domTestId, val, null, ["gw-focus"], inline);
};

const buildInputWithMask = (mask: string, val?: string, hasFocus: boolean = true): HTMLTextInputElement => {
  const inline = {
    placeholder: mask,
    "data-gw-input-mask": mask,
    "data-gw-input": "gwInputSystems.inputEventNotifySystems",
    "data-gw-copy": "gwInputSystems.copyEventNotifySystems",
    "data-gw-prev": val || "",
  };

  return TestGwTestDom.createAndAddTestInput(domTestId, val, null, hasFocus ? ["gw-focus"] : null, inline);
};

const createWrapperWidget = (
  id: string,
  getSetType: "text" | "select" | "multiselect" | "checkbox" | "checkboxgroup" | "radio" | "date"
): HTMLDivElement => {
  const children = [];
  switch (getSetType) {
    case "text":
      children.push(TestGwTestDom.createAndAddTestInput(domTestId, null, id));
      break;
    case "select":
      children.push(TestGwTestDom.createAndAddTestSelect(domTestId, null, null, { name: id }, null, ["0", "1"]));
      break;
    case "multiselect":
      children.push(TestGwTestDom.createAndAddTestSelect(domTestId, null, null, { multiple: "true", name: id }, null, ["0", "1"]));
      children.push(
        TestGwTestDom.createAndAddTestSelect(domTestId, null, null, { multiple: "true" }, null, ["shouldNotBeUsed1", "shouldNotBeUsed2"])
      );
      break;
    case "checkbox":
      children.push(TestGwTestDom.createAndAddTestCheckbox(domTestId, id));
      break;
    case "checkboxgroup":
      children.push(TestGwTestDom.createAndAddTestCheckbox(domTestId, id, null, { value: "0" }));
      children.push(TestGwTestDom.createAndAddTestCheckbox(domTestId, id, null, { value: "1" }));
      children.push(TestGwTestDom.createAndAddTestCheckbox(domTestId, id, null, { value: "2" }));
      break;
    case "radio":
      children.push(TestGwTestDom.createAndAddTestRadio(domTestId, id, null, { value: "0" }));
      children.push(TestGwTestDom.createAndAddTestRadio(domTestId, id, null, { value: "1" }));
      children.push(TestGwTestDom.createAndAddTestRadio(domTestId, id, null, { value: "2" }));
      break;
    case "date":
      children.push(buildDateInput(undefined, undefined, id));
      break;
    default:
  }

  return TestGwTestDom.addTestElement(
    GwDivBuilder.withId(id).withAttr("data-gw-getset", getSetType).withChildArr(children).build(),
    domTestId
  ) as HTMLDivElement;
};

const buildDateInput = (mask: string = "MM/dd/yyyy", val?: string, name?: string): HTMLTextInputElement => {
  const el = buildInputWithMask(mask, val);
  el.setAttribute("data-gw-datetime-mask", "true");
  el.classList.add("gw-DateValueWidget--dateInput");
  if (name) {
    el.setAttribute("name", name);
  }
  return el;
};

const typeCharacterIntoInput = (el: HTMLTextInputElement, char: string): string => {
  const curPos = getCursorPosOfInput(el);
  return replaceTextRangeWith(el, curPos, curPos, char);
};

const deleteCharFromInput = (el: HTMLTextInputElement): string => {
  const curPos = getCursorPosOfInput(el);
  if (curPos <= 0) {
    return el.value;
  }
  return replaceTextRangeWith(el, curPos - 1, curPos);
};

const pasteTextAtCursorPos = (el: HTMLTextInputElement, text: string): string => {
  const cursorPos = getCursorPosOfInput(el);
  return replaceTextRangeWith(el, cursorPos, cursorPos, text);
};

const clearInput = (el: HTMLTextInputElement): string => {
  return setInputValue(el, "");
};

const replaceTextRangeWith = (
  el: HTMLTextInputElement,
  selStart: number,
  selEnd: number,
  newText: string = "",
  cursorOffset: number = 0
): string => {
  el.focus();
  const currValue = el.value;
  const finalValue = currValue.slice(0, selStart) + newText + currValue.slice(selEnd);
  const cursorPos = selStart + newText.length + cursorOffset;
  return setInputValue(el, finalValue, cursorPos);
};

const setInputValue = (el: HTMLTextInputElement, val: string, cursorPos?: number): string => {
  cursorPos = cursorPos === undefined ? val.length : cursorPos;
  el.value = val;
  setCursorPosOfInput(el, cursorPos);
  gwInputSystems.notifySystemsOfInputValueChange(el);
  return el.value;
};

const setCursorPosOfInput = (el: HTMLTextInputElement, pos: number): void => {
  gwInputSystems.setCursorPos(el, pos);
};

const getCursorPosOfInput = (el: HTMLTextInputElement): number => {
  return gwInputSystems.getCursorPos(el);
};

const setUserRestrictedInputOnEl = (el: HTMLTextInputElement, restriction: GwUserInputRestriction): void => {
  el.setAttribute("data-gw-restricted-input", restriction);
};

const removeUserRestrictedInputFromEl = (el: HTMLTextInputElement): void => {
  el.removeAttribute("data-gw-restricted-input");
};
