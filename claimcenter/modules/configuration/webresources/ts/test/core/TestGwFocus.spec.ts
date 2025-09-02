import { expect } from "chai";
import "mocha";
import { gwFocus } from "../../core/gwFocus";
import { GwTypedMap } from "../../types/gwTypes";
import { TestGwTestDom } from "../TestGwTestDom.spec";

describe("GwFocus", () => {
  const domTestId = TestGwTestDom.getNewTestId();
  let screenWidget: HTMLDivElement = {} as any;
  let input1: HTMLInputElement = {} as any;
  let input2: HTMLInputElement = {} as any;
  let div1: HTMLDivElement = {} as any;
  let div2: HTMLDivElement = {} as any;
  let divNoFocus1: HTMLDivElement = {} as any;
  let divNoFocus2: HTMLDivElement = {} as any;

  const makeDiv = (id: string, focusable: boolean = false, classes?: string[] | null, attr: GwTypedMap<string> = {}) => {
    if (focusable) {
      attr.tabindex = "0";
    }
    return TestGwTestDom.createTestElementDiv(id, domTestId, classes, attr);
  };

  after(() => {
    TestGwTestDom.removeTestElementsByTestId(domTestId);
  });

  before(() => {
    screenWidget = TestGwTestDom.createSimulatedPcfDomEnvironmentAroundNewScreenWidget(domTestId);
    input1 = TestGwTestDom.createTestElementInput("inputfocus1", domTestId);
    input2 = TestGwTestDom.createTestElementInput("inputfocus2", domTestId);
    div1 = makeDiv("divfocus1", true);
    div2 = makeDiv("divfocus2", true);
    divNoFocus1 = makeDiv("divNofocus1");
    divNoFocus2 = makeDiv("divNofocus2");

    screenWidget.appendChild(input1);
    screenWidget.appendChild(input2);
    screenWidget.appendChild(div1);
    screenWidget.appendChild(div2);
    screenWidget.appendChild(divNoFocus1);
    screenWidget.appendChild(divNoFocus2);
  });

  it("Should exist", () => {
    expect(gwFocus).to.not.be.undefined;
  });

  it("Should processNewFocus and getCurrentFocus and clearFocus", () => {
    gwFocus.processNewFocus(input1);
    expect(gwFocus.getCurrentFocus()).to.equal(input1);
    gwFocus.clearFocus();
    expect(gwFocus.getCurrentFocus()).to.be.null;
  });

  it("Should set and get last focus", () => {
    gwFocus.setLastFocus(div1);
    expect(gwFocus.getLastFocus()).to.equal(div1);
  });

  it("Should getFocusable", () => {
    const nodes = gwFocus.getFocusable(screenWidget);
    expect(nodes.length).to.equal(4);
    expect(nodes).to.contain(input1);
    expect(nodes).to.contain(input2);
    expect(nodes).to.contain(div1);
    expect(nodes).to.contain(div2);
    expect(nodes).to.not.contain(divNoFocus1);
    expect(nodes).to.not.contain(divNoFocus2);
  });

  it("Should forceFocus", () => {
    expect(gwFocus.getCurrentFocus()).to.not.equal(div2);
    gwFocus.forceFocus(div2);
    expect(gwFocus.getCurrentFocus()).to.equal(div2);
    gwFocus.forceFocus(screenWidget);
    expect(gwFocus.getCurrentFocus()).to.equal(input1);
    gwFocus.forceFocus(divNoFocus1);
    expect(gwFocus.getCurrentFocus()).to.equal(input1);
  });

  it("Should restoreFocus", () => {
    gwFocus.forceFocus(input1);
    gwFocus.setLastFocus(input1);
    gwFocus.forceFocus(div1);
    gwFocus.restoreFocus(false);
    expect(gwFocus.getCurrentFocus()).to.equal(div1);
  });

  //
  it("Should getFirstFocusableElInNorth", () => {
    expect(gwFocus.getFirstFocusableElInNorth()).to.be.null;
    const northTab1 = makeDiv("gw-north-panel-tab-1", true);
    const northTab2 = makeDiv("gw-north-panel-tab-2", true);
    const northTab3 = makeDiv("gw-north-panel-tab-3", true);

    const northPanel = document.getElementById("gw-north-panel");
    if (!northPanel) {
      throw new Error("Unable to locate gw-north-panel");
    }

    northPanel.appendChild(northTab1);
    northPanel.appendChild(northTab2);
    northPanel.appendChild(northTab3);

    expect(gwFocus.getFirstFocusableElInNorth()).to.equal(northTab1);
  });

  it("Should getLastFocusableElInCenterOrSouth", () => {
    expect(gwFocus.getLastFocusableElInCenterOrSouth()).to.equal(div2);
    const centerInputAdd = TestGwTestDom.createTestElementInput("gw-center-panel-input-add", domTestId);
    screenWidget.appendChild(centerInputAdd);
    expect(gwFocus.getLastFocusableElInCenterOrSouth()).to.equal(centerInputAdd);
    screenWidget.removeChild(centerInputAdd);
  });

  it("Should getCorrespondingFocusLockOrNewFocusEl", () => {
    const outer = makeDiv("gw-focus-outer");
    const illegalTop = makeDiv("gw-focus-illegal-top");
    const illegalBottom = makeDiv("gw-focus-illegal-bottom");

    const inner = makeDiv("gw-focus-inner", false, null, { "data-gw-focus-lock": "true" });
    const innerLockTop = makeDiv("gw-focus-lock-top", true, null, { "data-gw-focus-lock-top": "true" });
    const innerLockBottom = makeDiv("gw-focus-lock-bottom", true, null, { "data-gw-focus-lock-bottom": "true" });
    const innerFocus1 = makeDiv("gw-focus-inner-1", true);
    const innerFocus2 = makeDiv("gw-focus-inner-2", true);
    const innerFocus3 = makeDiv("gw-focus-inner-3", true);

    inner.appendChild(innerLockTop);
    inner.appendChild(innerFocus1);
    inner.appendChild(innerFocus2);
    inner.appendChild(innerFocus3);
    inner.appendChild(innerLockBottom);

    const lockBarrierTop = document.getElementById("gw-focus-barrier-top");
    const lockBarrierBottom = document.getElementById("gw-focus-barrier-bottom");

    expect(lockBarrierTop).to.exist;
    expect(lockBarrierBottom).to.exist;

    if (!lockBarrierBottom || !lockBarrierTop) {
      throw new Error("Unable to locate lock barrier");
    }

    // "Should handle cycle when lock is up against barriers directly"
    outer.appendChild(inner);

    // "On Lock Top: Tab should function normally to next element"
    gwFocus.setLastFocus(innerLockTop);
    expect(gwFocus.getCorrespondingFocusLockOrNewFocusEl(innerFocus1)).to.equal(innerFocus1);

    //"On Lock Top: Shift Tab should cycle to the bottom lock element"
    gwFocus.setLastFocus(innerLockTop);
    expect(gwFocus.getCorrespondingFocusLockOrNewFocusEl(lockBarrierTop)).to.equal(innerLockBottom);

    //"On Lock Bottom: Tab should cycle to the top lock element"
    gwFocus.setLastFocus(innerLockBottom);
    expect(gwFocus.getCorrespondingFocusLockOrNewFocusEl(lockBarrierBottom)).to.equal(innerLockTop);

    //"On Lock Bottom: Shift Tab should function normally to the previous element"
    gwFocus.setLastFocus(innerLockBottom);
    expect(gwFocus.getCorrespondingFocusLockOrNewFocusEl(innerFocus3)).to.equal(innerFocus3);

    // UNDO ABOVE
    outer.removeChild(inner);
    outer.appendChild(illegalTop);
    outer.appendChild(inner);
    outer.appendChild(illegalBottom);

    // "On Lock Top: Tab should function normally to next element"
    gwFocus.setLastFocus(innerLockTop);
    expect(gwFocus.getCorrespondingFocusLockOrNewFocusEl(innerFocus1)).to.equal(innerFocus1);

    //"On Lock Top: Shift Tab should cycle to the bottom lock element"
    gwFocus.setLastFocus(innerLockTop);
    expect(lockBarrierTop).to.exist;
    expect(gwFocus.getCorrespondingFocusLockOrNewFocusEl(illegalTop)).to.equal(innerLockBottom);

    //"On Lock Bottom: Tab should cycle to the top lock element"
    gwFocus.setLastFocus(innerLockBottom);
    expect(gwFocus.getCorrespondingFocusLockOrNewFocusEl(illegalBottom)).to.equal(innerLockTop);

    //"On Lock Bottom: Shift Tab should function normally to the previous element"
    gwFocus.setLastFocus(innerLockBottom);
    expect(gwFocus.getCorrespondingFocusLockOrNewFocusEl(innerFocus3)).to.equal(innerFocus3);
  });
});
