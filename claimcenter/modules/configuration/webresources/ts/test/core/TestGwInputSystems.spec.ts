import { expect } from "chai";
import "mocha";
import { gwDateValue } from "../../comp/dates/gwDateValue";
import { gwConfig } from "../../core/gwConfig";
import { GwUserInputRestriction } from "../../core/inputs/gwClientValidation";
import { gwCurrency } from "../../core/inputs/gwCurrency";
import { gwInputs } from "../../core/inputs/gwInputs";
import { gwInputSystems } from "../../core/inputs/gwInputSystems";
import { gwUtil } from "../../core/util/gwUtil";
import { GwValueWidgetElement, HTMLCheckboxOrRadioElement, HTMLTextInputElement } from "../../types/gwTypes";
import { TestGwTestDom } from "../TestGwTestDom.spec";

const domTestId = TestGwTestDom.getNewTestId();

describe("GwInputSystems", () => {
  before(() => {
    gwCurrency.init(true);
    gwConfig._setPrefPanelDefaults({ enableMacroChars: true, capDateTimeUserInput: true });
  });

  after(() => {
    TestGwTestDom.removeTestElementsByTestId(domTestId);
  });

  describe("Tests for the helper methods", () => {
    it("Set and Get Cursor Position", () => {
      const testInput = TestGwTestDom.createAndAddTestInput(domTestId, "12345");
      testInput.focus();
      expect(gwInputSystems.getCursorPos(testInput)).to.equal(5);
      gwInputSystems.setCursorPos(testInput, 3);
      expect(gwInputSystems.getCursorPos(testInput)).to.equal(3);
    });
  });

  describe("Currency Inputs", () => {
    it("Should initialize correctly", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;
      expect(inputEl.value).to.equal("");
    });

    it("Should handle macros", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

      expect(typeCharacterIntoInput(inputEl, "1")).to.equal("1");
      expect(typeCharacterIntoInput(inputEl, ".")).to.equal("1.");
      expect(typeCharacterIntoInput(inputEl, "5")).to.equal("1.5");
      expect(typeCharacterIntoInput(inputEl, "6")).to.equal("1.56");
      expect(typeCharacterIntoInput(inputEl, "b")).to.equal("1,560,000,000");
      expect(replaceTextRangeWith(inputEl, 0, 100, "-")).to.equal("-");
      expect(typeCharacterIntoInput(inputEl, "7")).to.equal("-7");
      expect(typeCharacterIntoInput(inputEl, "k")).to.equal("-7,000");
    });

    it("Should ignore currency symbols", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;
      expect(typeCharacterIntoInput(inputEl, "$")).to.equal("");
    });

    it("Should only allow a single leading zero", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
    });

    it("Should pad leading 0 on decimal start", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;
      expect(typeCharacterIntoInput(inputEl, ".")).to.equal("0.");
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0.0");
      expect(typeCharacterIntoInput(inputEl, "7")).to.equal("0.07");
      expect(deleteCharFromInput(inputEl)).to.equal("0.0");
      expect(deleteCharFromInput(inputEl)).to.equal("0.");
      expect(deleteCharFromInput(inputEl)).to.equal("0");
      expect(deleteCharFromInput(inputEl)).to.equal("");
    });

    it("Should handle single character input with formatted grouping", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;
      expect(typeCharacterIntoInput(inputEl, "1")).to.equal("1");
      expect(typeCharacterIntoInput(inputEl, "2")).to.equal("12");
      expect(typeCharacterIntoInput(inputEl, "3")).to.equal("123");
      expect(typeCharacterIntoInput(inputEl, "4")).to.equal("1,234");
      expect(typeCharacterIntoInput(inputEl, "5")).to.equal("12,345");
      expect(typeCharacterIntoInput(inputEl, "6")).to.equal("123,456");
      expect(typeCharacterIntoInput(inputEl, "7")).to.equal("1,234,567");
      expect(typeCharacterIntoInput(inputEl, "8")).to.equal("12,345,678");
      expect(typeCharacterIntoInput(inputEl, "9")).to.equal("123,456,789");
    });

    it("Should handle single character delete with formatted grouping", () => {
      const valueWidget = buildCurrencyValueWidget("1,234,567,890");
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;
      setCursorPosOfInput(inputEl, 100);
      expect(deleteCharFromInput(inputEl)).to.equal("123,456,789");
      expect(deleteCharFromInput(inputEl)).to.equal("12,345,678");
      expect(deleteCharFromInput(inputEl)).to.equal("1,234,567");
      expect(deleteCharFromInput(inputEl)).to.equal("123,456");
      expect(deleteCharFromInput(inputEl)).to.equal("12,345");
      expect(deleteCharFromInput(inputEl)).to.equal("1,234");
      expect(deleteCharFromInput(inputEl)).to.equal("123");
      expect(deleteCharFromInput(inputEl)).to.equal("12");
      expect(deleteCharFromInput(inputEl)).to.equal("1");
      expect(deleteCharFromInput(inputEl)).to.equal("");
    });

    it("Should handle complex scenarios with leading zeroes", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);

      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);

      clearInput(inputEl);
      expect(pasteTextAtCursorPos(inputEl, "0,000,000")).to.equal("0");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);

      clearInput(inputEl);
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
      expect(typeCharacterIntoInput(inputEl, ",")).to.equal("0");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);

      clearInput(inputEl);
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
      expect(typeCharacterIntoInput(inputEl, "1")).to.equal("1");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);

      clearInput(inputEl);
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
      expect(pasteTextAtCursorPos(inputEl, "1")).to.equal("1");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);

      clearInput(inputEl);
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
      expect(pasteTextAtCursorPos(inputEl, "12345")).to.equal("12,345");
      expect(getCursorPosOfInput(inputEl)).to.equal(6);

      clearInput(inputEl);
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("0");
      expect(pasteTextAtCursorPos(inputEl, "0000000")).to.equal("0");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);

      clearInput(inputEl);
      expect(pasteTextAtCursorPos(inputEl, "0000.000")).to.equal("0.00");
      expect(getCursorPosOfInput(inputEl)).to.equal(4);

      clearInput(inputEl);
      expect(pasteTextAtCursorPos(inputEl, "-0000.000")).to.equal("-0.00");
      expect(getCursorPosOfInput(inputEl)).to.equal(5);

      clearInput(inputEl);
      expect(pasteTextAtCursorPos(inputEl, "(0000.000)")).to.equal("-0.00");
      expect(getCursorPosOfInput(inputEl)).to.equal(5);

      clearInput(inputEl);
      expect(typeCharacterIntoInput(inputEl, "-")).to.equal("-");
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("-0");
      expect(getCursorPosOfInput(inputEl)).to.equal(2);
      expect(typeCharacterIntoInput(inputEl, "0")).to.equal("-0");
      expect(getCursorPosOfInput(inputEl)).to.equal(2);
    });

    it("should handle deleting leading numbers in front of zeroes", () => {
      const valueWidget = buildCurrencyValueWidget("17,000,000");
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

      setCursorPosOfInput(inputEl, 2);
      expect(deleteCharFromInput(inputEl)).to.equal("1,000,000");
      expect(deleteCharFromInput(inputEl)).to.equal("000,000");
      expect(typeCharacterIntoInput(inputEl, "9")).to.equal("9,000,000");
    });

    it("should not move cursor pos on illegal input", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

      expect(deleteCharFromInput(inputEl)).to.equal("");
      expect(typeCharacterIntoInput(inputEl, "p")).to.equal("");
      expect(getCursorPosOfInput(inputEl)).to.equal(0);
      expect(typeCharacterIntoInput(inputEl, "9")).to.equal("9");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);
      expect(typeCharacterIntoInput(inputEl, "a")).to.equal("9");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);
      expect(typeCharacterIntoInput(inputEl, "9")).to.equal("99");
      expect(getCursorPosOfInput(inputEl)).to.equal(2);
      setCursorPosOfInput(inputEl, 1);
      expect(typeCharacterIntoInput(inputEl, "p")).to.equal("99");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);
    });

    it("should not move cursor pos on illegal input when there's a minus sign", () => {
      const valueWidget = buildCurrencyValueWidget();
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

      expect(deleteCharFromInput(inputEl)).to.equal("");
      expect(typeCharacterIntoInput(inputEl, "-")).to.equal("-");
      expect(getCursorPosOfInput(inputEl)).to.equal(1);
      expect(typeCharacterIntoInput(inputEl, "1")).to.equal("-1");
      expect(getCursorPosOfInput(inputEl)).to.equal(2);
      expect(typeCharacterIntoInput(inputEl, "2")).to.equal("-12");
      expect(getCursorPosOfInput(inputEl)).to.equal(3);
      expect(typeCharacterIntoInput(inputEl, "3")).to.equal("-123");
      expect(getCursorPosOfInput(inputEl)).to.equal(4);
      expect(typeCharacterIntoInput(inputEl, "a")).to.equal("-123");
      expect(getCursorPosOfInput(inputEl)).to.equal(4);
    });
  });

  describe("Input Masks", () => {
    it("Should initialize correctly", () => {
      const valueWidget = buildValueWidgetWithInputMask("#-#-#");
      const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

      expect(valueWidget.getAttribute("data-gw-input-mask")).to.equal("#-#-#");
      expect(gwInputs).to.exist;
      expect(gwInputSystems.getCursorPos(inputEl)).to.equal(0);
    });

    it("Should handle single character input", () => {
      const valueWidget = buildValueWidgetWithInputMask("+1 (###) ###-####");
      const usPhoneInput = valueWidget.querySelector("input") as HTMLTextInputElement;
      typeCharacterIntoInput(usPhoneInput, "2");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(5);
      expect(usPhoneInput.value).to.equal("+1 (2##) ###-####");

      typeCharacterIntoInput(usPhoneInput, "3");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(6);
      expect(usPhoneInput.value).to.equal("+1 (23#) ###-####");

      typeCharacterIntoInput(usPhoneInput, "4");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(7);
      expect(usPhoneInput.value).to.equal("+1 (234) ###-####");

      typeCharacterIntoInput(usPhoneInput, "5");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(10);
      expect(usPhoneInput.value).to.equal("+1 (234) 5##-####");

      typeCharacterIntoInput(usPhoneInput, "6");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(11);
      expect(usPhoneInput.value).to.equal("+1 (234) 56#-####");

      typeCharacterIntoInput(usPhoneInput, "7");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(12);
      expect(usPhoneInput.value).to.equal("+1 (234) 567-####");

      typeCharacterIntoInput(usPhoneInput, "8");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(14);
      expect(usPhoneInput.value).to.equal("+1 (234) 567-8###");
    });

    it("Should handle single delete of masked input, by moving cursor only", () => {
      const mask = "/##-;,. #+#+++#8A# ";
      const val = "Z##-;,. #+#+++#8A# ";
      const valueWidget = buildValueWidgetWithInputMask(mask, val);
      const weirdMask = valueWidget.querySelector("input") as HTMLTextInputElement;

      setCursorPosOfInput(weirdMask, 19);

      for (let i = 0; i < mask.length - 1; i++) {
        deleteCharFromInput(weirdMask);
        expect(getCursorPosOfInput(weirdMask)).to.equal(18 - i);
        expect(weirdMask.value).to.equal(val);
      }
    });

    it("Should handle single character value delete", () => {
      const valueWidget = buildValueWidgetWithInputMask("+1 (###) ###-####", "+1 (234) 567-8###");
      const usPhoneInput = valueWidget.querySelector("input") as HTMLTextInputElement;

      setCursorPosOfInput(usPhoneInput, 14);
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(14);

      deleteCharFromInput(usPhoneInput);
      expect(usPhoneInput.value).to.equal("+1 (234) 567-####");
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(13);
      deleteCharFromInput(usPhoneInput);
      expect(usPhoneInput.value).to.equal("+1 (234) 567-####"); //same
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(12);
      deleteCharFromInput(usPhoneInput);
      expect(usPhoneInput.value).to.equal("+1 (234) 56#-####");
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(11);
      deleteCharFromInput(usPhoneInput);
      expect(usPhoneInput.value).to.equal("+1 (234) 5##-####");
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(10);
      deleteCharFromInput(usPhoneInput);
      expect(usPhoneInput.value).to.equal("+1 (234) ###-####");
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(9);
      deleteCharFromInput(usPhoneInput);
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(8);
      deleteCharFromInput(usPhoneInput);
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(7);
      deleteCharFromInput(usPhoneInput);
      expect(usPhoneInput.value).to.equal("+1 (23#) ###-####");
      expect(gwInputSystems.getCursorPos(usPhoneInput)).to.equal(6);
      deleteCharFromInput(usPhoneInput);
      expect(usPhoneInput.value).to.equal("+1 (2##) ###-####");
      deleteCharFromInput(usPhoneInput);
      expect(usPhoneInput.value).to.equal("");
    });

    it("Should handle pasting in a value into a blank input", () => {
      const valueWidget = buildValueWidgetWithInputMask("+1 (###) ###-####");
      const usPhoneInput = valueWidget.querySelector("input") as HTMLTextInputElement;

      expect(pasteTextAtCursorPos(usPhoneInput, "9876543210")).to.equal("+1 (987) 654-3210");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(17);
    });

    it("Should not change after pasting text at the end of a filled out input", () => {
      const valueWidget = buildValueWidgetWithInputMask("+1 (###) ###-####", "+1 (987) 654-3210");
      const usPhoneInput = valueWidget.querySelector("input") as HTMLTextInputElement;

      setCursorPosOfInput(usPhoneInput, 100);
      expect(pasteTextAtCursorPos(usPhoneInput, "ABCDEFGHIJKLMNOP")).to.equal("+1 (987) 654-3210");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(17);
    });

    it("Should handle pasting overlapping content into a selected range in a sensible way", () => {
      const valueWidget = buildValueWidgetWithInputMask("+1 (###) ###-####", "+1 (987) 654-3210");
      const usPhoneInput = valueWidget.querySelector("input") as HTMLTextInputElement;

      setCursorPosOfInput(usPhoneInput, 13);
      expect(replaceTextRangeWith(usPhoneInput, 9, 13, "2345")).to.equal("+1 (987) 234-5###");
      expect(getCursorPosOfInput(usPhoneInput)).to.equal(14);
    });

    it("Should handle input of valid characters that are also static mask characters", () => {
      const valueWidget = buildValueWidgetWithInputMask("++11 ((###)) ###--####--");
      const weirdPhone = valueWidget.querySelector("input") as HTMLTextInputElement;

      expect(typeCharacterIntoInput(weirdPhone, "1")).to.equal("++11 ((1##)) ###--####--");
      expect(getCursorPosOfInput(weirdPhone)).to.equal(8);
    });
  });

  describe("Date Masks", () => {
    it("Should initialize correctly", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;
      expect(dateInput).to.exist;
      expect(dateValueWidget.getAttribute("data-gw-date-mask")).to.equal("MM/dd/yyyy");
      expect(dateValueWidget.hasAttribute("data-gw-datetime")).to.be.true;
      expect(gwDateValue).to.exist;
    });

    it("Should work when simulating the date picker button being pressed", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;

      expect(setInputValue(dateInput, "01/23/2018")).to.equal("01/23/2018");
      expect(setInputValue(dateInput, "05/14/1999")).to.equal("05/14/1999");
    });

    it("Should handle single character input", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;

      expect(typeCharacterIntoInput(dateInput, "1")).to.equal("1M/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(1);

      expect(typeCharacterIntoInput(dateInput, "2")).to.equal("12/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(2);

      expect(typeCharacterIntoInput(dateInput, "1")).to.equal("12/1d/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(4);

      expect(typeCharacterIntoInput(dateInput, "9")).to.equal("12/19/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(5);

      expect(typeCharacterIntoInput(dateInput, "2")).to.equal("12/19/2yyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(7);

      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("12/19/20yy");
      expect(getCursorPosOfInput(dateInput)).to.equal(8);

      expect(typeCharacterIntoInput(dateInput, "1")).to.equal("12/19/201y");
      expect(getCursorPosOfInput(dateInput)).to.equal(9);

      expect(typeCharacterIntoInput(dateInput, "4")).to.equal("12/19/2014");
      expect(getCursorPosOfInput(dateInput)).to.equal(10);
    });

    it("Should be a completely new value if full text is pasted at the beginning of a filled out input", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;
      setCursorPosOfInput(dateInput, 0);
      expect(pasteTextAtCursorPos(dateInput, "05.06.1984")).to.equal("05/06/1984");
      expect(getCursorPosOfInput(dateInput)).to.equal(10);

      setCursorPosOfInput(dateInput, 0);
      expect(pasteTextAtCursorPos(dateInput, "11--12--2050")).to.equal("11/12/2050");
      expect(getCursorPosOfInput(dateInput)).to.equal(10);
    });

    it("Should handle 0 completion for months or days", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;
      expect(typeCharacterIntoInput(dateInput, "2")).to.equal("2M/dd/yyyy");
      expect(typeCharacterIntoInput(dateInput, "/")).to.equal("02/dd/yyyy");
      expect(typeCharacterIntoInput(dateInput, "1")).to.equal("02/1d/yyyy");
      expect(typeCharacterIntoInput(dateInput, " ")).to.equal("02/01/yyyy");
    });

    it("Should handle 0 completion for a single digit year", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;
      expect(setInputValue(dateInput, "1224")).to.equal("12/24/yyyy");
      setCursorPosOfInput(dateInput, 6);
      expect(typeCharacterIntoInput(dateInput, "7")).to.equal("12/24/7yyy");
      expect(typeCharacterIntoInput(dateInput, " ")).to.equal("12/24/1907");
    });

    it("Should handle 0 completion for a two digit year higher than 50", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;
      expect(setInputValue(dateInput, "1224")).to.equal("12/24/yyyy");
      setCursorPosOfInput(dateInput, 6);
      expect(typeCharacterIntoInput(dateInput, "7")).to.equal("12/24/7yyy");
      expect(typeCharacterIntoInput(dateInput, "8")).to.equal("12/24/78yy");
      expect(typeCharacterIntoInput(dateInput, " ")).to.equal("12/24/2078");
    });

    it("Should handle 0 completion for a two digit year before 50", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;
      expect(setInputValue(dateInput, "1224")).to.equal("12/24/yyyy");
      setCursorPosOfInput(dateInput, 6);
      expect(typeCharacterIntoInput(dateInput, "4")).to.equal("12/24/4yyy");
      expect(typeCharacterIntoInput(dateInput, "9")).to.equal("12/24/49yy");
      expect(typeCharacterIntoInput(dateInput, " ")).to.equal("12/24/1949");
    });

    it("Should handle illegal input", () => {
      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;
      expect(typeCharacterIntoInput(dateInput, "b")).to.equal("");
      expect(getCursorPosOfInput(dateInput)).to.equal(0);
      expect(typeCharacterIntoInput(dateInput, "9")).to.equal("9M/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(1);
      expect(typeCharacterIntoInput(dateInput, "b")).to.equal("9M/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(1);
    });

    it("Should handle values when capping is disabled", () => {
      gwConfig._setPrefPanelDefaults({ capDateTimeUserInput: false });

      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;

      expect(typeCharacterIntoInput(dateInput, "9")).to.equal("9M/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(1);
      expect(typeCharacterIntoInput(dateInput, "8")).to.equal("98/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(2);
      expect(typeCharacterIntoInput(dateInput, "7")).to.equal("98/7d/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(4);

      expect(typeCharacterIntoInput(dateInput, "6")).to.equal("98/76/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(5);
      expect(typeCharacterIntoInput(dateInput, "5")).to.equal("98/76/5yyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(7);
      expect(typeCharacterIntoInput(dateInput, "4")).to.equal("98/76/54yy");
      expect(getCursorPosOfInput(dateInput)).to.equal(8);

      clearInput(dateInput);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("0M/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(1);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("00/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(2);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("00/0d/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(4);

      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("00/00/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(5);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("00/00/0yyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(7);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("00/00/00yy");
      expect(getCursorPosOfInput(dateInput)).to.equal(8);
    });

    it("Should handle values when capping is enabled", () => {
      gwConfig._setPrefPanelDefaults({ capDateTimeUserInput: true });

      const dateValueWidget = buildDateValueWidget();
      const dateInput = dateValueWidget.querySelector("input") as HTMLTextInputElement;

      expect(typeCharacterIntoInput(dateInput, "9")).to.equal("9M/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(1);
      expect(typeCharacterIntoInput(dateInput, "8")).to.equal("12/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(2);
      expect(typeCharacterIntoInput(dateInput, "7")).to.equal("12/7d/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(4);

      expect(typeCharacterIntoInput(dateInput, "6")).to.equal("12/31/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(5);
      expect(typeCharacterIntoInput(dateInput, "5")).to.equal("12/31/5yyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(7);
      expect(typeCharacterIntoInput(dateInput, "4")).to.equal("12/31/54yy");
      expect(getCursorPosOfInput(dateInput)).to.equal(8);

      clearInput(dateInput);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("0M/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(1);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("01/dd/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(2);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("01/0d/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(4);

      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("01/01/yyyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(5);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("01/01/0yyy");
      expect(getCursorPosOfInput(dateInput)).to.equal(7);
      expect(typeCharacterIntoInput(dateInput, "0")).to.equal("01/01/00yy");
      expect(getCursorPosOfInput(dateInput)).to.equal(8);
    });
  });

  describe("User Restricted Input", () => {
    describe("Without Input Mask", () => {
      it("Should ignore illegal input for numeric", () => {
        const valueWidget = buildValueWidgetWithUserRestriction(GwUserInputRestriction.numerals);
        const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

        expect(typeCharacterIntoInput(inputEl, "A")).to.equal("");
        expect(typeCharacterIntoInput(inputEl, "?")).to.equal("");
        expect(typeCharacterIntoInput(inputEl, "1")).to.equal("1");
        expect(typeCharacterIntoInput(inputEl, "-")).to.equal("1");
        expect(typeCharacterIntoInput(inputEl, "2")).to.equal("12");
        expect(deleteCharFromInput(inputEl)).to.equal("1");
        expect(deleteCharFromInput(inputEl)).to.equal("");
      });

      it("Should ignore illegal input for integer", () => {
        const valueWidget = buildValueWidgetWithUserRestriction(GwUserInputRestriction.integer);
        const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

        expect(typeCharacterIntoInput(inputEl, "A")).to.equal("");
        expect(typeCharacterIntoInput(inputEl, "?")).to.equal("");
        expect(typeCharacterIntoInput(inputEl, "1")).to.equal("1");
        expect(typeCharacterIntoInput(inputEl, "-")).to.equal("1");
        expect(typeCharacterIntoInput(inputEl, "2")).to.equal("12");
        expect(deleteCharFromInput(inputEl)).to.equal("1");
        expect(deleteCharFromInput(inputEl)).to.equal("");
      });

      it("Should format integer correctly", () => {
        const valueWidget = buildValueWidgetWithUserRestriction(GwUserInputRestriction.integer);
        const inputEl = valueWidget.querySelector("input") as HTMLTextInputElement;

        expect(typeCharacterIntoInput(inputEl, "-")).to.equal("-");
        expect(typeCharacterIntoInput(inputEl, "9")).to.equal("-9");

        expect(deleteCharFromInput(inputEl)).to.equal("-");
        expect(deleteCharFromInput(inputEl)).to.equal("");

        expect(typeCharacterIntoInput(inputEl, "-")).to.equal("-");
        expect(typeCharacterIntoInput(inputEl, "8")).to.equal("-8");
        expect(typeCharacterIntoInput(inputEl, "7")).to.equal("-87");
        expect(typeCharacterIntoInput(inputEl, "6")).to.equal("-876");
        expect(typeCharacterIntoInput(inputEl, "5")).to.equal("-8,765");

        setCursorPosOfInput(inputEl, 1);
        expect(deleteCharFromInput(inputEl)).to.equal("8,765");
        setCursorPosOfInput(inputEl, 1);
        expect(deleteCharFromInput(inputEl)).to.equal("765");
        expect(typeCharacterIntoInput(inputEl, "1")).to.equal("1,765");
        expect(typeCharacterIntoInput(inputEl, "2")).to.equal("12,765");
        expect(typeCharacterIntoInput(inputEl, "3")).to.equal("123,765");
        expect(typeCharacterIntoInput(inputEl, "4")).to.equal("1,234,765");

        setCursorPosOfInput(inputEl, 2);

        expect(deleteCharFromInput(inputEl)).to.equal("1,234,765");
        expect(getCursorPosOfInput(inputEl)).to.equal(1);

        setCursorPosOfInput(inputEl, 0);
        expect(typeCharacterIntoInput(inputEl, "-")).to.equal("-1,234,765");
      });

      it("Should ignore illegal input for alphabeticAToZ", () => {
        const valueWidget = buildValueWidgetWithUserRestriction(GwUserInputRestriction.alphabeticAToZ);
        const standardCCInput = valueWidget.querySelector("input") as HTMLTextInputElement;

        expect(pasteTextAtCursorPos(standardCCInput, "ëÉÈàáâǎȃēě")).to.equal("");

        expect(typeCharacterIntoInput(standardCCInput, "A")).to.equal("A");
        expect(typeCharacterIntoInput(standardCCInput, "?")).to.equal("A");
        expect(typeCharacterIntoInput(standardCCInput, "1")).to.equal("A");
        expect(typeCharacterIntoInput(standardCCInput, "-")).to.equal("A");
        expect(typeCharacterIntoInput(standardCCInput, "B")).to.equal("AB");
        expect(typeCharacterIntoInput(standardCCInput, "z")).to.equal("ABz");

        expect(deleteCharFromInput(standardCCInput)).to.equal("AB");
        expect(deleteCharFromInput(standardCCInput)).to.equal("A");
      });

      it("Should not ignore valid latin characters for alphabeticGlobal", () => {
        const valueWidget = buildValueWidgetWithUserRestriction(GwUserInputRestriction.alphabeticGlobal);
        const standardCCInput = valueWidget.querySelector("input") as HTMLTextInputElement;

        expect(pasteTextAtCursorPos(standardCCInput, "ëÉÈàáâǎȃēě")).to.equal("ëÉÈàáâǎȃēě");
        expect(typeCharacterIntoInput(standardCCInput, ".")).to.equal("ëÉÈàáâǎȃēě");
        expect(typeCharacterIntoInput(standardCCInput, "Z")).to.equal("ëÉÈàáâǎȃēěZ");
      });

      it("Should handle name characters with alphabeticAToZNameChars", () => {
        const valueWidget = buildValueWidgetWithUserRestriction(GwUserInputRestriction.alphabeticAToZNameChars);
        const standardCCInput = valueWidget.querySelector("input") as HTMLTextInputElement;

        expect(pasteTextAtCursorPos(standardCCInput, "I Am Will I Am")).to.equal("I Am Will I Am");
        expect(clearInput(standardCCInput)).to.equal("");
        expect(pasteTextAtCursorPos(standardCCInput, "A. B. Morris-Day'McKenny, Esquire")).to.equal("A. B. Morris-Day'McKenny, Esquire");
      });
    });

    describe("With Input Mask", () => {
      it("Should ignore illegal input", () => {
        const valueWidget = buildValueWidgetWithInputMask("####-####-####-####");
        const standardCCInput = valueWidget.querySelector("input") as HTMLTextInputElement;

        setUserRestrictedInputOnValueWidget(valueWidget, GwUserInputRestriction.numerals);

        expect(typeCharacterIntoInput(standardCCInput, "A")).to.equal("");
        expect(typeCharacterIntoInput(standardCCInput, "?")).to.equal("");
        expect(typeCharacterIntoInput(standardCCInput, "1")).to.equal("1###-####-####-####");
      });

      it("Should handle standard input", () => {
        const valueWidget = buildValueWidgetWithInputMask("####-####-####-####");
        const standardCCInput = valueWidget.querySelector("input") as HTMLTextInputElement;

        setUserRestrictedInputOnValueWidget(valueWidget, GwUserInputRestriction.numerals);

        expect(typeCharacterIntoInput(standardCCInput, "1")).to.equal("1###-####-####-####");
        expect(typeCharacterIntoInput(standardCCInput, "2")).to.equal("12##-####-####-####");
        expect(typeCharacterIntoInput(standardCCInput, "3")).to.equal("123#-####-####-####");
        expect(typeCharacterIntoInput(standardCCInput, "4")).to.equal("1234-####-####-####");
        expect(typeCharacterIntoInput(standardCCInput, "5")).to.equal("1234-5###-####-####");
        expect(typeCharacterIntoInput(standardCCInput, "6")).to.equal("1234-56##-####-####");
        expect(typeCharacterIntoInput(standardCCInput, "7")).to.equal("1234-567#-####-####");
        expect(typeCharacterIntoInput(standardCCInput, "8")).to.equal("1234-5678-####-####");
        expect(typeCharacterIntoInput(standardCCInput, "9")).to.equal("1234-5678-9###-####");
        expect(typeCharacterIntoInput(standardCCInput, "1")).to.equal("1234-5678-91##-####");
        expect(typeCharacterIntoInput(standardCCInput, "2")).to.equal("1234-5678-912#-####");
        expect(typeCharacterIntoInput(standardCCInput, "3")).to.equal("1234-5678-9123-####");
        expect(typeCharacterIntoInput(standardCCInput, "4")).to.equal("1234-5678-9123-4###");
      });

      it("Should be a completely new value if full text is pasted in an empty input", () => {
        const valueWidget = buildValueWidgetWithInputMask("+1 (###) ###-####");
        const usPhoneInput = valueWidget.querySelector("input") as HTMLTextInputElement;

        setUserRestrictedInputOnValueWidget(valueWidget, GwUserInputRestriction.numerals);

        setCursorPosOfInput(usPhoneInput, 0);
        expect(pasteTextAtCursorPos(usPhoneInput, "1234567890")).to.equal("+1 (123) 456-7890");
        expect(getCursorPosOfInput(usPhoneInput)).to.equal(17);

        const valueWidget2 = buildValueWidgetWithInputMask("+1 (###) ###-####");
        const usPhoneInput2 = valueWidget.querySelector("input") as HTMLTextInputElement;

        setUserRestrictedInputOnValueWidget(valueWidget2, GwUserInputRestriction.numerals);

        setCursorPosOfInput(usPhoneInput2, 0);
        expect(pasteTextAtCursorPos(usPhoneInput2, "123-456-7890")).to.equal("+1 (123) 456-7890");
        expect(getCursorPosOfInput(usPhoneInput2)).to.equal(17);
      });

      it("Should be a completely new value if full text is pasted at the beginning of a filled out input", () => {
        const valueWidget = buildValueWidgetWithInputMask("+1 (###) ###-####", "+1 (555) 555-5555");
        const usPhoneInput = valueWidget.querySelector("input") as HTMLTextInputElement;

        setUserRestrictedInputOnValueWidget(valueWidget, GwUserInputRestriction.numerals);

        setCursorPosOfInput(usPhoneInput, 0);
        expect(pasteTextAtCursorPos(usPhoneInput, "1234567890")).to.equal("+1 (123) 456-7890");
        expect(getCursorPosOfInput(usPhoneInput)).to.equal(17);

        setCursorPosOfInput(usPhoneInput, 0);
        expect(pasteTextAtCursorPos(usPhoneInput, "123-456-7890")).to.equal("+1 (123) 456-7890");
        expect(getCursorPosOfInput(usPhoneInput)).to.equal(17);
      });
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

const buildValueWidgetWithUserRestriction = (userRestriction: GwUserInputRestriction): GwValueWidgetElement => {
  const valueWidget = TestGwTestDom.createAndAddTextBasedValueWidget(domTestId, "");
  setUserRestrictedInputOnValueWidget(valueWidget, userRestriction);
  return valueWidget;
};

const buildCurrencyValueWidget = (val?: string): GwValueWidgetElement => {
  const valueWidgetInline = {
    "data-gw-input": "gwInputSystems.inputEventNotifySystems",
    "data-gw-currency": "true",
  };

  const inputElementInline = {
    "data-gw-currency-info": "USD;$;,;.;2",
  };

  return TestGwTestDom.createAndAddTextBasedValueWidget(
    domTestId,
    gwUtil.hasValue(val) ? val : "",
    undefined,
    valueWidgetInline,
    inputElementInline
  );
};

const buildValueWidgetWithInputMask = (mask: string, val: string = "", hasFocus: boolean = true): GwValueWidgetElement => {
  const inputInline = {
    placeholder: mask,
    "data-gw-prev": val || "",
  };

  const valueInline = {
    "data-gw-input-mask": mask,
    "data-gw-input": "gwInputSystems.inputEventNotifySystems",
    "data-gw-copy": "gwInputSystems.copyEventNotifySystems",
  };

  return TestGwTestDom.createAndAddTextBasedValueWidget(domTestId, val, undefined, valueInline, inputInline, hasFocus);
};

const buildDateValueWidget = (mask: string = "MM/dd/yyyy", val?: string): GwValueWidgetElement => {
  const valueWidget = buildValueWidgetWithInputMask(mask, val);
  valueWidget.removeAttribute("data-gw-input-mask");
  valueWidget.setAttribute("data-gw-date-mask", mask);
  valueWidget.setAttribute("data-gw-datetime", "true");
  const el = valueWidget.querySelector("input")!;
  el.classList.add("gw-DateValueWidget--dateInput");
  return valueWidget;
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
  //el.setAttribute("data-gw-prev", val);
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

const setUserRestrictedInputOnValueWidget = (valueWidget: GwValueWidgetElement, restriction: GwUserInputRestriction): void => {
  valueWidget.setAttribute("data-gw-restricted-input", restriction);
};
