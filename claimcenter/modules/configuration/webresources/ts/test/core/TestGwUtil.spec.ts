import { expect } from "chai";
import "mocha";
import { gwUtil } from "../../core/util/gwUtil";
import { GwIterable, GwMap, GwNotNullNotUndefined, GW_BREAKER } from "../../types/gwTypes";
import { TestGwTestDom } from "../TestGwTestDom.spec";

describe("gwUtil", () => {
  const domTestId = TestGwTestDom.getNewTestId();

  afterEach(() => {
    TestGwTestDom.removeTestElementsByTestId(domTestId);
  });

  it("Should exist", () => {
    expect(gwUtil).to.not.be.undefined;
  });

  it("shallowCompare", () => {
    expect(gwUtil.shallowCompare(null, null)).to.be.true;
    expect(gwUtil.shallowCompare(123, 123)).to.be.true;
    expect(gwUtil.shallowCompare("123", "123")).to.be.true;
    expect(gwUtil.shallowCompare([1, 2, 3], [1, 2, 3])).to.be.true;
    expect(gwUtil.shallowCompare([], [])).to.be.true;

    expect(gwUtil.shallowCompare({ 1: true, 2: true, 3: true }, { 1: true, 2: true, 3: true })).to.be.true;

    expect(gwUtil.shallowCompare({ 1: true, 2: true, 3: true }, { 1: false, 2: false, 3: false })).to.be.false;
    expect(gwUtil.shallowCompare([1, 2, 3], ["1", "2", "3"])).to.be.false;
    expect(gwUtil.shallowCompare(1, 0)).to.be.false;
    expect(gwUtil.shallowCompare(null, undefined)).to.be.false;
    expect(gwUtil.shallowCompare(0, null)).to.be.false;
    expect(gwUtil.shallowCompare(0, [])).to.be.false;
    expect(gwUtil.shallowCompare([], {})).to.be.false;
  });

  it("isObjectOrFunction", () => {
    const obj = {};
    const func = () => null;

    expect(gwUtil.isObjectOrFunction(obj)).to.be.true;
    expect(gwUtil.isObjectOrFunction(func)).to.be.true;

    expect(gwUtil.isObjectOrFunction(null)).to.be.false;
    expect(gwUtil.isObjectOrFunction(undefined)).to.be.false;

    expect(gwUtil.isObjectOrFunction(1)).to.be.false;
    expect(gwUtil.isObjectOrFunction("1")).to.be.false;
  });

  it("isFunction", () => {
    const obj = {};
    const func = () => null;

    expect(gwUtil.isFunction(obj)).to.be.false;
    expect(gwUtil.isFunction(func)).to.be.true;

    expect(gwUtil.isFunction(null)).to.be.false;
    expect(gwUtil.isFunction(undefined)).to.be.false;

    expect(gwUtil.isFunction(1)).to.be.false;
    expect(gwUtil.isFunction("1")).to.be.false;
  });

  it("onLoginPage", () => {
    expect(gwUtil.onLoginPage()).to.be.false;

    TestGwTestDom.createAndAddTestDiv(domTestId, ["gw-location-name", "gw-location-name"], { "data-gw-location-name": "---Login---" });
    expect(gwUtil.onLoginPage()).to.be.true;
  });

  it("convertIfString", () => {
    expect(gwUtil.convertIfString("not converted")).to.equal("not converted");
    expect(gwUtil.convertIfString(true)).to.equal(true);
    expect(gwUtil.convertIfString("true")).to.equal(true);
    expect(gwUtil.convertIfString("false")).to.equal(false);
    expect(gwUtil.convertIfString("undefined")).to.equal(undefined);
    expect(gwUtil.convertIfString("null")).to.equal(null);
  });

  it("setEventParam & clearEventParam", () => {
    const inputEl = TestGwTestDom.createAndAddTestInput(domTestId, null, null, null, { id: "gw-event-param" });
    gwUtil.clearEventParam();

    gwUtil.setEventParam("testName", "testValue");
    expect(inputEl.name).to.equal("testName");
    expect(inputEl.value).to.equal("testValue");

    gwUtil.setEventParam("testName2", "testValue2");
    expect(inputEl.name).to.equal("testName2");
    expect(inputEl.value).to.equal("testValue2");

    gwUtil.clearEventParam();
    expect(inputEl.name).to.equal("");
    expect(inputEl.value).to.equal("");
  });

  it("replaceTarget", () => {
    TestGwTestDom.createAndAddTestDiv(domTestId, null, { id: "replace-me" });
    gwUtil.replaceTarget("#replace-me", "<div id='did-replace'></div>");
    expect(document.getElementById("replace-me")).to.not.exist;
    expect(document.getElementById("did-replace")).to.exist;

    document.getElementById("did-replace")!.remove();
  });

  it("hasValue", () => {
    expect(gwUtil.hasValue(null)).to.be.false;
    expect(gwUtil.hasValue(undefined)).to.be.false;
    expect(gwUtil.hasValue({})).to.be.true;
    expect(gwUtil.hasValue(0)).to.be.true;
    expect(gwUtil.hasValue(-1)).to.be.true;
    expect(gwUtil.hasValue([])).to.be.true;
    expect(gwUtil.hasValue("")).to.be.true;
    expect(gwUtil.hasValue<GwNotNullNotUndefined>(() => null)).to.be.true;
    expect(gwUtil.hasValue(document.createElement("div"))).to.be.true;
  });

  it("hasValue typed", () => {
    expect(gwUtil.hasValue<GwNotNullNotUndefined>(null)).to.be.false;
    expect(gwUtil.hasValue<GwNotNullNotUndefined>(undefined)).to.be.false;
    expect(gwUtil.hasValue<object>({})).to.be.true;
    expect(gwUtil.hasValue<number>(0)).to.be.true;
    expect(gwUtil.hasValue<number>(-1)).to.be.true;
    expect(gwUtil.hasValue<any[]>([])).to.be.true;
    expect(gwUtil.hasValue<string>("")).to.be.true;
    expect(gwUtil.hasValue<GwNotNullNotUndefined>(() => null)).to.be.true;
    expect(gwUtil.hasValue<HTMLElement>(document.createElement("div"))).to.be.true;
  });

  it("convertAllWhitespaceToStandard", () => {
    expect(gwUtil.convertAllWhitespaceToStandard("a  Z   Q\u202F\u00A0Q\u00A0\u202F\u00A0\u00A0   Z  a")).to.equal(
      "a  Z   Q  Q       Z  a"
    );
  });

  it("getDatasetPropOrDefault", () => {
    const div = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "data-game-one": "onething", "data-game-two": "twothing" });
    expect(gwUtil.getDatasetPropOrDefault(div, "gameOne")).to.equal("onething");
    expect(gwUtil.getDatasetPropOrDefault(div, "gameTwo")).to.equal("twothing");

    expect(gwUtil.getDatasetPropOrDefault("nothing", "nothing", "defaultString")).to.equal("defaultString");
    expect(gwUtil.getDatasetPropOrDefault(div, "nothing", "anotherDefault")).to.equal("anotherDefault");
  });

  xit("getUniqueSelector", () => {
    //LATER
  });

  it("getDomNodes", () => {
    expect(gwUtil.getDomNodes("none")).to.have.lengthOf(0);
    TestGwTestDom.createAndAddTestDiv(domTestId, ["class0", "inbody0"]);
    TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "inbody1"]);
    TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "inbody2"]);
    TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "inbody3"]);

    expect(gwUtil.getDomNodes(".class1")).to.have.lengthOf(3);

    const parent = TestGwTestDom.createAndAddTestDiv(domTestId, ["theparent"], { id: "theparent" });

    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class0", "indiv0"]));
    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "indiv1"]));
    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "indiv2"]));
    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "indiv3"]));
    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "indiv4"]));

    expect(gwUtil.getDomNodes(".class1")).to.have.lengthOf(7);
    expect(gwUtil.getDomNodes(".class1", parent)).to.have.lengthOf(4);

    expect(gwUtil.getDomNodes("div")).to.have.lengthOf(11);
    expect(gwUtil.getDomNodes("#theparent")).to.have.lengthOf(1);
    expect(gwUtil.getDomNodes("#theparent", parent)).to.have.lengthOf(0);
  });

  it("getDomNode", () => {
    expect(gwUtil.getDomNode("none")).to.be.null;

    TestGwTestDom.createAndAddTestDiv(domTestId, ["class0", "inbody0"]);
    const firstClass1 = TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "inbody1"]);
    TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "inbody2"]);
    TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "inbody3"]);

    expect(gwUtil.getDomNode(".class1")).to.equal(firstClass1);

    const parent = TestGwTestDom.createAndAddTestDiv(domTestId, ["theparent"], { id: "theparent" });

    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class0", "indiv0"]));
    const firstParentClass1 = parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "indiv1"]));
    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "indiv2"]));
    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "indiv3"]));
    parent.appendChild(TestGwTestDom.createAndAddTestDiv(domTestId, ["class1", "indiv4"]));

    expect(gwUtil.getDomNode(".class1")).to.equal(firstClass1);
    expect(gwUtil.getDomNode(".class1", parent)).to.equal(firstParentClass1);

    expect(gwUtil.getDomNode("div")).to.be.instanceOf(HTMLDivElement);
    expect(gwUtil.getDomNode("#theparent")).to.equal(parent);
    expect(gwUtil.getDomNode("#theparent", parent)).to.be.null;
  });

  it("getDomNodeByAttr", () => {
    expect(gwUtil.getDomNodeByAttr("no-attr-named-this")).to.be.null;

    const attr1 = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "some-attr1": "val1" });

    expect(gwUtil.getDomNodeByAttr("some-attr1")).to.equal(attr1);
    expect(gwUtil.getDomNodeByAttr("some-attr1", "val1")).to.equal(attr1);
    expect(gwUtil.getDomNodeByAttr("some-attr1", "invalid-value")).to.be.null;
    const attr1Val2 = TestGwTestDom.createAndAddTestDiv(domTestId, null, { "some-attr1": "val2" });

    expect(gwUtil.getDomNodeByAttr("some-attr1")).to.equal(attr1);
    expect(gwUtil.getDomNodeByAttr("some-attr1", "val2")).to.equal(attr1Val2);
    expect(gwUtil.getDomNodeByAttr("invalid-attr", "val2")).to.be.null;
  });

  it("getSelfOrFirstParentWithClass", () => {
    const grandparent = TestGwTestDom.createAndAddTestDiv(domTestId, ["grandparent", "ancestor"]);
    const parent = TestGwTestDom.createAndAddTestDiv(domTestId, ["parent", "ancestor"]);
    const child = TestGwTestDom.createAndAddTestDiv(domTestId, ["child"]);

    grandparent.appendChild(parent);
    parent.appendChild(child);

    expect(gwUtil.getSelfOrFirstParentWithClass(child, "nonclass")).to.be.null;
    expect(gwUtil.getSelfOrFirstParentWithClass(child, "child")).to.equal(child);
    expect(gwUtil.getSelfOrFirstParentWithClass(child, ".child")).to.equal(child);
    expect(gwUtil.getSelfOrFirstParentWithClass(child, ".parent")).to.equal(parent);
    expect(gwUtil.getSelfOrFirstParentWithClass(child, ".grandparent")).to.equal(grandparent);
    expect(gwUtil.getSelfOrFirstParentWithClass(child, ".ancestor")).to.equal(parent);

    expect(gwUtil.getSelfOrFirstParentWithClass(parent, ".child")).to.be.null;
    expect(gwUtil.getSelfOrFirstParentWithClass(parent, "parent")).to.equal(parent);
    expect(gwUtil.getSelfOrFirstParentWithClass(parent, "ancestor")).to.equal(parent);
    expect(gwUtil.getSelfOrFirstParentWithClass(grandparent, "ancestor")).to.equal(grandparent);
  });

  it("toggleClass", () => {
    const odd1 = TestGwTestDom.createAndAddTestDiv(domTestId, ["odd", "thing"]);
    const even = TestGwTestDom.createAndAddTestDiv(domTestId, ["even", "thing"]);
    const odd2 = TestGwTestDom.createAndAddTestDiv(domTestId, ["odd", "thing"]);

    expect(odd1.classList.contains("odd")).to.be.true;
    expect(even.classList.contains("even")).to.be.true;
    expect(odd2.classList.contains("odd")).to.be.true;

    expect(odd1.classList.contains("thing")).to.be.true;
    expect(even.classList.contains("thing")).to.be.true;
    expect(odd2.classList.contains("thing")).to.be.true;

    gwUtil.toggleClass(".thing", "thing");
    expect(odd1.classList.contains("thing")).to.be.false;
    expect(even.classList.contains("thing")).to.be.false;
    expect(odd2.classList.contains("thing")).to.be.false;

    gwUtil.toggleClass(odd1, "odd");
    expect(odd1.classList.contains("odd")).to.be.false;
    gwUtil.toggleClass(odd1, "odd");
    expect(odd1.classList.contains("odd")).to.be.true;
  });

  it("conditionalAddRemoveClass", () => {
    const odd1 = TestGwTestDom.createAndAddTestDiv(domTestId, ["odd", "odd1", "thing"]);
    const even = TestGwTestDom.createAndAddTestDiv(domTestId, ["even", "thing"]);
    const odd2 = TestGwTestDom.createAndAddTestDiv(domTestId, ["odd", "odd2", "thing"]);

    expect(odd1.classList.contains("odd")).to.be.true;
    expect(even.classList.contains("even")).to.be.true;
    expect(odd2.classList.contains("odd")).to.be.true;

    expect(odd1.classList.contains("thing")).to.be.true;
    expect(even.classList.contains("thing")).to.be.true;
    expect(odd2.classList.contains("thing")).to.be.true;

    gwUtil.conditionalAddRemoveClass(false, ".thing", "thing");
    expect(odd1.classList.contains("thing")).to.be.false;
    expect(even.classList.contains("thing")).to.be.false;
    expect(odd2.classList.contains("thing")).to.be.false;

    gwUtil.conditionalAddRemoveClass(true, ".odd", "thing");
    expect(odd1.classList.contains("thing")).to.be.true;
    expect(even.classList.contains("thing")).to.be.false;
    expect(odd2.classList.contains("thing")).to.be.true;

    gwUtil.conditionalAddRemoveClass(false, odd1, "odd");
    expect(odd1.classList.contains("odd")).to.be.false;
    expect(odd2.classList.contains("odd")).to.be.true;

    gwUtil.conditionalAddRemoveClass(true, odd2, "odd2");
    expect(odd2.classList.contains("odd2")).to.be.true;
  });

  it("conditionalAddRemoveAttr", () => {
    const odd1 = TestGwTestDom.createAndAddTestDiv(domTestId, ["thing", "odd", "odd1"], { odd: "1", odd1: "none", thing: "2" });
    const even = TestGwTestDom.createAndAddTestDiv(domTestId, ["thing", "even"], { even: "1", thing: "2" });
    const odd2 = TestGwTestDom.createAndAddTestDiv(domTestId, ["thing", "odd", "odd2"], { odd: "1", odd2: "none", thing: "2" });

    expect(odd1.hasAttribute("odd")).to.be.true;
    expect(even.hasAttribute("even")).to.be.true;
    expect(odd2.hasAttribute("odd")).to.be.true;

    expect(odd1.getAttribute("thing")).to.equal("2");
    expect(even.getAttribute("thing")).to.equal("2");
    expect(odd2.getAttribute("thing")).to.equal("2");

    gwUtil.conditionalAddRemoveAttr(false, ".thing", "thing", "novalue");
    expect(odd1.hasAttribute("thing")).to.be.false;
    expect(even.hasAttribute("thing")).to.be.false;
    expect(odd2.hasAttribute("thing")).to.be.false;

    gwUtil.conditionalAddRemoveAttr(true, ".odd", "thing", "newthing");
    expect(odd1.getAttribute("thing")).to.equal("newthing");
    expect(even.hasAttribute("thing")).to.be.false;
    expect(odd2.getAttribute("thing")).to.equal("newthing");

    gwUtil.conditionalAddRemoveAttr(false, odd1, "odd", "none");
    expect(odd1.hasAttribute("odd")).to.be.false;
    expect(odd2.getAttribute("odd")).to.equal("1");

    gwUtil.conditionalAddRemoveAttr(true, odd2, "odd2", "newodd");
    expect(odd2.getAttribute("odd2")).to.equal("newodd");
  });

  it("isIndexIterable", () => {
    expect(gwUtil.isIndexIterable([])).to.be.true;
    expect(gwUtil.isIndexIterable("")).to.be.true;
    expect(gwUtil.isIndexIterable($("div"))).to.be.true;
    TestGwTestDom.createAndAddTestDiv(domTestId);
    expect(gwUtil.isIndexIterable(document.getElementsByTagName("div"))).to.be.true;
    expect(gwUtil.isIndexIterable({})).to.be.false;
    expect(gwUtil.isIndexIterable(1 as any)).to.be.false;
  });

  describe("forEach", () => {
    it("should iterate", () => {
      const arr1 = [10, 20, 30, 40];
      const results: number[] = [];

      gwUtil.forEach(arr1, (val: any, key: string, coll: GwIterable, i: number) => {
        results.push(val + i + 1);
      });

      expect(results[0]).to.equal(11);
      expect(results[1]).to.equal(22);
      expect(results[2]).to.equal(33);
      expect(results[3]).to.equal(44);

      results.length = 0;

      gwUtil.forEach("1234", (val: any, key: string, coll: GwIterable, i: number) => {
        results.push(val + i + 1);
      });

      expect(results[0]).to.equal("101");
      expect(results[1]).to.equal("211");
      expect(results[2]).to.equal("321");
      expect(results[3]).to.equal("431");

      const obj1 = { 1: 1, 2: 2, 3: 3, 4: 4 };
      const resultObj: GwMap = {};

      gwUtil.forEach(obj1, (val: any, key: string, coll: GwIterable, i: number) => {
        resultObj[key] = val + "map" + i;
      });

      expect(resultObj[1]).to.equal("1map0");
      expect(resultObj[2]).to.equal("2map1");
      expect(resultObj[3]).to.equal("3map2");
      expect(resultObj[4]).to.equal("4map3");

      //TODO: dom collection stuff
    });

    it("should break on breaker", () => {
      const arr1 = [10, 20, 30, 40];
      const results: number[] = [];

      gwUtil.forEach(arr1, (val: any, key: string, coll: GwIterable, i: number) => {
        if (i === 2) {
          return GW_BREAKER;
        }
        results.push(val + i + 1);
        return undefined;
      });

      expect(results[0]).to.equal(11);
      expect(results[1]).to.equal(22);
      expect(results[2]).to.equal(undefined);
      expect(results[3]).to.equal(undefined);

      const obj1 = { 1: 1, 2: 2, 3: 3, 4: 4 };
      const resultObj: GwMap = {};

      gwUtil.forEach(obj1, (val: any, key: string, coll: GwIterable, i: number) => {
        if (key === "2") {
          return GW_BREAKER;
        }
        resultObj[key] = val + "map" + i;
        return undefined;
      });

      expect(resultObj[1]).to.equal("1map0");
      expect(resultObj[2]).to.equal(undefined);
      expect(resultObj[3]).to.equal(undefined);
      expect(resultObj[4]).to.equal(undefined);
    });
  });

  describe("forEachReverse", () => {
    it("should iterate", () => {
      const arr1 = [10, 20, 30, 40];
      const results: number[] = [];

      gwUtil.forEachReverse(arr1, (val: any, key: string, coll: GwIterable, i: number) => {
        results.push(val + i + 1);
      });

      expect(results[3]).to.equal(11);
      expect(results[2]).to.equal(22);
      expect(results[1]).to.equal(33);
      expect(results[0]).to.equal(44);

      results.length = 0;

      gwUtil.forEachReverse("1234", (val: any, key: string, coll: GwIterable, i: number) => {
        results.push(val + i + 1);
      });

      expect(results[3]).to.equal("101");
      expect(results[2]).to.equal("211");
      expect(results[1]).to.equal("321");
      expect(results[0]).to.equal("431");

      const obj1 = { 1: 1, 2: 2, 3: 3, 4: 4 };
      const resultObj: GwMap = {};

      gwUtil.forEachReverse(obj1, (val: any, key: string, coll: GwIterable, i: number) => {
        resultObj[key] = val + "map" + i;
      });

      expect(resultObj[1]).to.equal("1map0");
      expect(resultObj[2]).to.equal("2map1");
      expect(resultObj[3]).to.equal("3map2");
      expect(resultObj[4]).to.equal("4map3");

      //TODO: dom collection stuff
    });

    it("should break on breaker", () => {
      const arr1 = [10, 20, 30, 40];
      const results: number[] = [];

      gwUtil.forEachReverse(arr1, (val: any, key: string, coll: GwIterable, i: number) => {
        if (i === 2) {
          return GW_BREAKER;
        }
        results.push(val + i + 1);
        return undefined;
      });

      expect(results[3]).to.equal(undefined);
      expect(results[2]).to.equal(undefined);
      expect(results[1]).to.equal(undefined);
      expect(results[0]).to.equal(44);

      const obj1 = { 1: 1, 2: 2, 3: 3, 4: 4 };
      const resultObj: GwMap = {};

      gwUtil.forEachReverse(obj1, (val: any, key: string, coll: GwIterable, i: number) => {
        if (key === "2") {
          return GW_BREAKER;
        }
        resultObj[key] = val + "map" + i;
        return undefined;
      });

      expect(resultObj[1]).to.equal(undefined);
      expect(resultObj[2]).to.equal(undefined);
      expect(resultObj[3]).to.equal("3map2");
      expect(resultObj[4]).to.equal("4map3");
    });
  });

  it("createDiv", () => {
    const div = gwUtil.createDiv();
    expect(div).to.exist;

    const div1 = gwUtil.createDiv(
      "aa bb cc",
      { att1: 1, att2: "2", att3: true, att4: {} as any },
      { color: "red", display: "inline" },
      "test label"
    );
    expect(div1).to.exist;
    expect(div1.classList.contains("aa")).to.be.true;
    expect(div1.classList.contains("bb")).to.be.true;
    expect(div1.classList.contains("cc")).to.be.true;

    expect(div1.getAttribute("att1")).to.equal("1");
    expect(div1.getAttribute("att2")).to.equal("2");
    expect(div1.getAttribute("att3")).to.equal("true");
    expect(div1.hasAttribute("att4")).to.be.true;

    expect(div1.style.color).to.equal("red");
    expect(div1.style.display).to.equal("inline");

    expect(div1.innerHTML).to.equal("test label");
  });

  it("getUtilityInfo", () => {
    expect(gwUtil.getUtilityInfo("zzz")).to.equal("");
  });

  it("isEdge", () => {
    expect(gwUtil.isEdge()).to.be.false;
  });

  it("addCustomEventListener and fireCustomEvent", () => {
    let eventListenerFired = false;
    let detail: any = null;

    gwUtil.addCustomEventListener("awesometest", (ev): boolean => {
      eventListenerFired = true;
      detail = (ev as CustomEvent).detail;
      return true;
    });

    const div = TestGwTestDom.createAndAddTestDiv(domTestId, null, { id: "awesome" });
    gwUtil.fireCustomEvent("awesometest", { somediv: div, test: true });

    expect(eventListenerFired).to.be.true;
    expect(detail).to.exist;
    expect(detail!.somediv).to.equal(div);
    expect(detail!.test).to.equal(true);
  });

  it("getRandomFloatFrom0InclTo1Excl", () => {
    const floats = [];
    const countOfFloats: Map<string, number> = new Map();

    for (let i = 0; i < 10000; i++) {
      const randomFloat = gwUtil.getRandomFloatFrom0InclTo1Excl();
      floats[i] = randomFloat;
      countOfFloats.set("" + randomFloat, (countOfFloats.get("" + randomFloat) || 0) + 1);
    }

    for (let i = 0; i < floats.length; i++) {
      const float = floats[i];
      expect(float).to.be.a("number");
      expect(float).to.not.be.lessThan(0);
      expect(float).to.be.lessThan(1);
    }

    countOfFloats.forEach((count) => {
      expect(count).to.not.be.greaterThan(1000);
    });
  });

  it("getRandomInt", () => {
    //TODO: test for spread bias

    for (let min = -10000, max = 20000; min < max; min++, max--) {
      const int = gwUtil.getRandomInt(min, max);
      expect("" + int).to.not.include(".");
      expect(int).to.not.be.lessThan(min);
      expect(int).to.be.lessThan(max);
    }

    for (let min = -20000, max = 0; min < max; min++, max--) {
      const int = gwUtil.getRandomInt(min, max);
      expect("" + int).to.not.include(".");
      expect(int).to.not.be.lessThan(min);
      expect(int).to.be.lessThan(max);
    }

    expect(() => {
      gwUtil.getRandomInt(0, 0);
    }).throw();

    expect(() => {
      gwUtil.getRandomInt(10, 1);
    }).throw();

    expect(() => {
      gwUtil.getRandomInt(0, 0xffffffff + 1);
    }).throw();
  });
});
