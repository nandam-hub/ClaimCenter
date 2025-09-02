import { expect } from "chai";
import "mocha";
import { GwPointerInfo } from "../../core/events/GwPointerInfo";
import { gwConfig } from "../../core/gwConfig";
import { GwDomNode, GwPointerType } from "../../types/gwTypes";
import { TestGwTestDom } from "../TestGwTestDom.spec";

const domTestId = TestGwTestDom.getNewTestId();

const buildPointerInfo = (
  type: string,
  pointerType: GwPointerType,
  target: GwDomNode,
  pointerId: number,
  button: number = 0,
  width: number = 1,
  height: number = 1
): GwPointerInfo => {
  return new GwPointerInfo({ type, button, pointerType, pointerId, target, width, height } as any);
};

describe("GwPointerInfo", () => {
  after(() => {
    TestGwTestDom.removeTestElementsByTestId(domTestId);
  });

  it("should initialize the helper states correctly for mouse down", () => {
    const clickEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const dblClickableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-dblclick": "on" }, null, undefined, [clickEl]);
    const draggableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-draggable": "on" }, null, undefined, [
      dblClickableEl,
    ]);
    const longPressableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-longpress": "on" }, null, undefined, [
      draggableEl,
    ]);

    const pi1 = buildPointerInfo("mousedown", "mouse", clickEl, 100);
    expect(pi1).to.exist;
    expect(pi1.button).to.equal(0);
    expect(pi1.type).to.equal("mouse");
    expect(pi1.id).to.equal(100);
    expect(pi1.clickableEl).to.equal(clickEl);
    expect(pi1.draggableEl).to.equal(draggableEl);
    expect(pi1.dblClickableEl).to.equal(dblClickableEl);
    expect(pi1.longPressableEl).to.equal(longPressableEl);
    expect(pi1.hasAnyDataGwEl).to.be.true;

    expect(pi1.isTouch).to.be.false;
    expect(pi1.isPen).to.be.false;
    expect(pi1.isMouse).to.be.true;

    expect(pi1.isDown).to.be.true;
    expect(pi1.isMove).to.be.false;
    expect(pi1.isEnter).to.be.false;
    expect(pi1.isOut).to.be.false;
    expect(pi1.isUp).to.be.false;

    expect(pi1.isPossiblyPalm).to.be.false;
    expect(pi1.isValidForClick).to.be.true;
    expect(pi1.isValidForDblClick).to.be.true;
    expect(pi1.isValidForMouseDown).to.be.true;
  });

  it("should initialize the helper states correctly for touch down", () => {
    const clickEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const dblClickableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-dblclick": "on" }, null, undefined, [clickEl]);
    const draggableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-draggable": "on" }, null, undefined, [
      dblClickableEl,
    ]);
    const longPressableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-longpress": "on" }, null, undefined, [
      draggableEl,
    ]);

    const pi1 = buildPointerInfo("pointerdown", "touch", clickEl, 101);
    expect(pi1).to.exist;
    expect(pi1.button).to.equal(0);
    expect(pi1.type).to.equal("touch");
    expect(pi1.id).to.equal(101);
    expect(pi1.clickableEl).to.equal(clickEl);
    expect(pi1.draggableEl).to.equal(draggableEl);
    expect(pi1.dblClickableEl).to.equal(dblClickableEl);
    expect(pi1.longPressableEl).to.equal(longPressableEl);
    expect(pi1.hasAnyDataGwEl).to.be.true;

    expect(pi1.isTouch).to.be.true;
    expect(pi1.isPen).to.be.false;
    expect(pi1.isMouse).to.be.false;

    expect(pi1.isDown).to.be.true;
    expect(pi1.isMove).to.be.false;
    expect(pi1.isEnter).to.be.false;
    expect(pi1.isOut).to.be.false;
    expect(pi1.isUp).to.be.false;

    expect(pi1.isPossiblyPalm).to.be.false;
    expect(pi1.isValidForClick).to.be.true;
    expect(pi1.isValidForDblClick).to.be.true;
    expect(pi1.isValidForMouseDown).to.be.true;
  });

  it("should initialize the helper states correctly for touch down", () => {
    const clickEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const dblClickableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-dblclick": "on" }, null, undefined, [clickEl]);
    const draggableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-draggable": "on" }, null, undefined, [
      dblClickableEl,
    ]);
    const longPressableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-longpress": "on" }, null, undefined, [
      draggableEl,
    ]);

    const pi1 = buildPointerInfo("pointerdown", "pen", clickEl, 101);
    expect(pi1).to.exist;
    expect(pi1.button).to.equal(0);
    expect(pi1.type).to.equal("pen");
    expect(pi1.id).to.equal(101);
    expect(pi1.clickableEl).to.equal(clickEl);
    expect(pi1.draggableEl).to.equal(draggableEl);
    expect(pi1.dblClickableEl).to.equal(dblClickableEl);
    expect(pi1.longPressableEl).to.equal(longPressableEl);
    expect(pi1.hasAnyDataGwEl).to.be.true;

    expect(pi1.isTouch).to.be.false;
    expect(pi1.isPen).to.be.true;
    expect(pi1.isMouse).to.be.false;

    expect(pi1.isDown).to.be.true;
    expect(pi1.isMove).to.be.false;
    expect(pi1.isEnter).to.be.false;
    expect(pi1.isOut).to.be.false;
    expect(pi1.isUp).to.be.false;

    expect(pi1.isPossiblyPalm).to.be.false;
    expect(pi1.isValidForClick).to.be.true;
    expect(pi1.isValidForDblClick).to.be.true;
    expect(pi1.isValidForMouseDown).to.be.true;
  });

  it("timeSinceEventInMs", (done) => {
    const clickEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const pi1 = buildPointerInfo("pointerdown", "mouse", clickEl, 103);
    const now = window.performance.now();
    expect(pi1.timestamp).to.approximately(now, 1);
    window.setTimeout(() => {
      expect(pi1.timeSinceEventInMs()).to.approximately(99, 10);
      done();
    }, 99);
  });

  it("timeBetweenEvents", (done) => {
    const el1 = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const el2 = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const pi1 = buildPointerInfo("pointerdown", "mouse", el1, 104);

    window.setTimeout(() => {
      expect(pi1.timeBetweenEvents(buildPointerInfo("pointerdown", "mouse", el1, 105))).to.approximately(99, 10);
      done();
    }, 99);
  });

  it("hasSame elements when true", () => {
    const clickEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const dblClickableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-dblclick": "on" }, null, undefined, [clickEl]);
    const draggableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-draggable": "on" }, null, undefined, [
      dblClickableEl,
    ]);
    const longPressableEl = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-longpress": "on" }, null, undefined, [
      draggableEl,
    ]);

    const pi1 = buildPointerInfo("pointerdown", "pen", clickEl, 101);
    const pi2 = buildPointerInfo("pointerup", "pen", clickEl, 101);

    expect(pi1.hasSameClickableAs(pi2)).to.be.true;
    expect(pi1.hasSameDblClickableAs(pi2)).to.be.true;
  });

  it("hasSame elements when false", () => {
    const clickEl1 = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const clickEl2 = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const dblClickableEl1 = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-dblclick": "on" }, null, undefined, [
      clickEl1,
      clickEl2,
    ]);

    const pi1 = buildPointerInfo("pointerdown", "touch", clickEl1, 101);
    const pi2 = buildPointerInfo("pointerup", "touch", clickEl2, 101);

    expect(pi1.hasSameClickableAs(pi2)).to.be.false;
    expect(pi1.hasSameDblClickableAs(pi2)).to.be.true;
  });

  it("shouldBecomeNewMouseDownOverExistingMouseDown behaves correctly with smartTouch on or off", () => {
    gwConfig._setPrefPanelDefaults({
      smartTouchRejection: true,
    });

    const touchElFirst = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });
    const clickElSecond = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-gw-click": "on" });

    const touch = buildPointerInfo("pointerdown", "touch", touchElFirst, 101);
    const mouse = buildPointerInfo("pointerdown", "mouse", clickElSecond, 102);

    const palm = buildPointerInfo("pointerdown", "touch", touchElFirst, 101, 0, 120, 120);
    const pen = buildPointerInfo("pointerdown", "mouse", clickElSecond, 102);

    expect(mouse.shouldBecomeNewMouseDownOverExistingMouseDown(touch)).to.be.true;
    expect(touch.shouldBecomeNewMouseDownOverExistingMouseDown(mouse)).to.be.false;

    expect(pen.shouldBecomeNewMouseDownOverExistingMouseDown(palm)).to.be.true;
    expect(pen.shouldBecomeNewMouseDownOverExistingMouseDown(touch)).to.be.true;

    expect(touch.shouldBecomeNewMouseDownOverExistingMouseDown(palm)).to.be.true;
    expect(palm.shouldBecomeNewMouseDownOverExistingMouseDown(touch)).to.be.false;

    gwConfig._setPrefPanelDefaults({
      smartTouchRejection: false,
    });

    expect(mouse.shouldBecomeNewMouseDownOverExistingMouseDown(touch)).to.be.true;
    expect(touch.shouldBecomeNewMouseDownOverExistingMouseDown(mouse)).to.be.false;

    expect(pen.shouldBecomeNewMouseDownOverExistingMouseDown(palm)).to.be.true;
    expect(pen.shouldBecomeNewMouseDownOverExistingMouseDown(touch)).to.be.true;

    expect(touch.shouldBecomeNewMouseDownOverExistingMouseDown(palm)).to.be.false;
    expect(palm.shouldBecomeNewMouseDownOverExistingMouseDown(touch)).to.be.false;
  });
});
