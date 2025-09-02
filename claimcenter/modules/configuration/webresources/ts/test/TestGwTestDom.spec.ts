import { gwCrossOriginInternal } from "../core/GwCrossOriginInternal";
import { gwUtil } from "../core/util/gwUtil";
import { GwCrossOriginExternal } from "../embedded/GwCrossOriginExternal";
import { GwMessageData, GwMessageEvent, GwMessagesFromGW, GwMessageStatus, GwMessagesToGW } from "../types/gwCrossOriginTypes";
import {
  GwDomNode,
  GwMap,
  GwTypedMap,
  GwValueWidgetElement,
  HTMLCheckboxElement,
  HTMLRadioElement,
  HTMLTextInputElement,
} from "../types/gwTypes";

export class TestGwTestDom {
  static fakeWindows: GwTypedMap<GwMap> = {};
  static windowAny: any;
  private static nextTestId: number = 1;
  private static nextFormElementId: number = 1;

  static clearTestElements(): void {
    this.getTestWrapper().innerHTML = "";
    this.getTestWrapper().remove();
    const modal = document.getElementById("gw-modal");
    if (modal) {
      modal.remove();
    }
    TestGwTestDom.fakeWindows = { ["" + window.location]: TestGwTestDom.windowAny };
  }

  static getNewTestId(): number {
    return this.nextTestId++;
  }

  static removeTestElementsByTestId(testId: number): void {
    gwUtil.forEachReverse(gwUtil.getDomNodesByAttr("data-gw-test-element-id", "" + testId), (el) => {
      el.remove();
    });
  }

  static getTestWrapper(): HTMLDivElement {
    let testWrapper = document.getElementById("gw-body");

    if (!testWrapper) {
      testWrapper = document.createElement("div");
      testWrapper.id = "gw-body";
      testWrapper.classList.add("gw-body");
      document.body.appendChild(testWrapper);

      // testWrapper.setAttribute("onchange", "gw.globals.gwEvents.onGlobalChangeEvent(event)");
      // testWrapper.setAttribute("oninput", "gw.globals.gwEvents.onGlobalInputEvent(event)");
    }

    return testWrapper as HTMLDivElement;
  }

  static getTestForm(): HTMLFormElement {
    let testForm = document.getElementById("gw-test-form");

    if (!testForm) {
      testForm = document.createElement("form");
      testForm.id = "gw-test-form";
      TestGwTestDom.getTestWrapper().appendChild(testForm);
    }

    return testForm as HTMLFormElement;
  }

  static createTestElementDiv(id: string, testId: number, classes?: string[] | null, attr: GwTypedMap<string> = {}): HTMLDivElement {
    attr.id = id;
    const div = this.createTestElement("div", classes, attr);
    this.addTestIdToElement(div, testId);
    return div;
  }

  static createTestElementInput(name: string, testId: number, classes?: string[], attr: GwTypedMap<string> = {}): HTMLInputElement {
    attr.name = name;
    const input = this.createTestElement("input", classes, attr);
    this.addTestIdToElement(input, testId);
    return input;
  }

  private static createTestElement<T extends keyof HTMLElementTagNameMap>(
    tag: T,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string> | null,
    text?: string | null,
    children?: GwDomNode[]
  ): HTMLElementTagNameMap[T] {
    const el = document.createElement(tag);
    if (classes) {
      classes.forEach((val: string) => {
        if (val) {
          el.classList.add(val.replace(".", ""));
        }
      });
    }

    gwUtil.forEach(attr, (val: string, key: string) => {
      el.setAttribute(key, val);
    });

    gwUtil.forEach(styles, (val: string, key: string) => {
      el.style.setProperty(key, val);
    });

    el.innerHTML = text || "";

    if (children) {
      children.forEach((val) => {
        el.appendChild(val);
      });
    }

    return el;
  }

  static addTestElement(el: GwDomNode, testId: number): GwDomNode {
    if (TestGwTestDom.requiresFormParent(el.tagName.toLowerCase())) {
      TestGwTestDom.getTestForm().appendChild(el);
    } else {
      TestGwTestDom.getTestWrapper().appendChild(el);
    }

    this.addTestIdToElement(el, testId);

    return el;
  }

  private static addTestIdToElement(el: GwDomNode, testId: number): GwDomNode {
    el.setAttribute("data-gw-test-element-id", "" + testId);
    return el;
  }

  static createSimulatedPcfDomEnvironmentAroundNewScreenWidget(testId: number): HTMLDivElement {
    document.body.classList.add("gw-app-px");
    const topBarrier = this.createTestElementDiv("gw-focus-barrier-top", testId, null, { tabindex: "0" });

    const topLevelForm = document.createElement("form");
    topLevelForm.id = "gw-root-form";
    topLevelForm.classList.add("gw-top-level");
    topLevelForm.setAttribute("data-gw-focus-lock", "true");
    topLevelForm.setAttribute("method", "POST");

    document.body.appendChild(topBarrier);
    document.body.appendChild(topLevelForm);
    const gwBody = this.createTestElementDiv("gw-body", testId, ["gw-body", "gw-lang-EN"]);

    topLevelForm.appendChild(gwBody);

    const northPanel = this.createTestElementDiv("gw-north-panel", testId, ["gw-north-panel"]);
    const westPanel = this.createTestElementDiv("gw-west-panel", testId, ["gw-west-panel"]);
    const centerPanel = this.createTestElementDiv("gw-center-panel", testId, ["gw-center-panel"]);

    const westCenter = this.createTestElementDiv("gw-west-center", testId);
    westCenter.appendChild(westPanel);
    westCenter.appendChild(centerPanel);

    gwBody.appendChild(northPanel);
    gwBody.appendChild(westCenter);

    const centerTop = this.createTestElementDiv("gw-center-top-section", testId);
    centerPanel.appendChild(centerTop);
    const centerBottom = this.createTestElementDiv("gw-center-bottom-section", testId);
    centerPanel.appendChild(centerBottom);
    const screenWidget = this.createTestElementDiv("gw-center-panel-screen", testId, ["gw-ScreenWidget"], { "data-gw-edit-id": "1_1" });
    centerBottom.appendChild(screenWidget);
    screenWidget.appendChild(
      this.createTestElementDiv("Test-TestScreen_LocationName", testId, ["gw-location-name"], {
        "data-gw-dest-hash": "DestinationHash_Test",
        "data-gw-location-name": "Test",
      })
    );

    const barrierBottom = this.createTestElementDiv("gw-focus-barrier-bottom", testId, null, { tabindex: "0" });
    document.body.appendChild(barrierBottom);

    return screenWidget;
  }

  static createAndAddTestElement<T extends keyof HTMLElementTagNameMap>(
    testId: number,
    tag: T,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string> | null,
    text?: string | null,
    children?: GwDomNode[]
  ): HTMLElementTagNameMap[T] {
    return TestGwTestDom.addTestElement(
      TestGwTestDom.createTestElement(tag, classes, attr, styles, text, children),
      testId
    ) as HTMLElementTagNameMap[T];
  }

  static createAndAddTestDiv(
    testId: number,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string> | null,
    text?: string | null,
    children?: GwDomNode[]
  ): HTMLDivElement {
    return TestGwTestDom.addTestElement(
      TestGwTestDom.createTestElement("div", classes, attr, styles, text, children),
      testId
    ) as HTMLDivElement;
  }

  static createAndAddTestSelect(
    testId: number,
    value?: string | null,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string> | null,
    values?: string[]
  ): HTMLSelectElement {
    const input = TestGwTestDom.createTestElement("select", classes, attr, styles) as HTMLSelectElement;
    gwUtil.forEach(values, (val) => TestGwTestDom.createAndAddTestOption(input, val));
    input.value = value || "";
    return TestGwTestDom.addTestElement(input, testId) as HTMLSelectElement;
  }

  static createAndAddTestOption(
    selectEl: HTMLSelectElement,
    value?: string | null,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string>
  ): HTMLOptionElement {
    const input = TestGwTestDom.createTestElement("option", classes, attr, styles) as HTMLOptionElement;
    input.value = value || "";
    selectEl.appendChild(input);
    return input;
  }

  static createAndAddTestInput(
    testId: number,
    value?: string | null,
    name?: string | null,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string> | null
  ): HTMLTextInputElement {
    const input = TestGwTestDom.createTestElement("input", classes, attr, styles, undefined) as HTMLTextInputElement;
    input.value = value || "";
    if (gwUtil.hasValue(name)) {
      input.setAttribute("name", name);
    }

    return TestGwTestDom.addTestElement(input, testId) as HTMLTextInputElement;
  }

  static createAndAddTextBasedValueWidget(
    testId: number,
    value: string,
    name?: string,
    valueWidgetAttr?: GwMap,
    inputAttr?: GwMap,
    hasFocus: boolean = true
  ): GwValueWidgetElement {
    name = "" + (gwUtil.hasValue(name) ? name : TestGwTestDom.nextFormElementId++);
    value = gwUtil.hasValue(value) ? value : "";
    const input = TestGwTestDom.createTestElement("input", hasFocus ? ["gw-focus"] : [], inputAttr) as HTMLTextInputElement;
    input.name = name;
    input.value = value;
    const classes = ["gw-ValueWidget"];
    const vAttr = {
      id: name,
      "data-gw-getset": "text",
    };

    const attr = gwUtil.mapMerge(valueWidgetAttr, vAttr);
    return this.createAndAddTestDiv(testId, classes, attr, null, null, [input]);
  }

  static createAndAddTestTextArea(
    testId: number,
    value?: string | null,
    name?: string | null,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string> | null
  ): HTMLTextAreaElement {
    const input = TestGwTestDom.createTestElement("textarea", classes, attr, styles, undefined) as HTMLTextAreaElement;
    input.value = gwUtil.hasValue(value) ? value : "";
    if (gwUtil.hasValue(name)) {
      input.setAttribute("name", name);
    }

    return TestGwTestDom.addTestElement(input, testId) as HTMLTextAreaElement;
  }

  static createAndAddTestCheckbox(
    testId: number,
    name?: string | null,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string> | null
  ): HTMLCheckboxElement {
    const finalAttr = gwUtil.mapMerge(attr, { type: "checkbox" });
    const checkbox = TestGwTestDom.createTestElement("input", classes, finalAttr, styles, undefined) as HTMLCheckboxElement;
    if (gwUtil.hasValue(name)) {
      checkbox.setAttribute("name", name);
    }
    return TestGwTestDom.addTestElement(checkbox, testId) as HTMLCheckboxElement;
  }

  static createAndAddTestRadio(
    testId: number,
    name?: string | null,
    classes?: string[] | null,
    attr?: GwTypedMap<string> | null,
    styles?: GwTypedMap<string> | null
  ): HTMLRadioElement {
    const finalAttr = gwUtil.mapMerge(attr, { type: "radio" });
    const radio = TestGwTestDom.createTestElement("input", classes, finalAttr, styles, undefined) as HTMLRadioElement;
    if (gwUtil.hasValue(name)) {
      radio.setAttribute("name", name);
    }
    return TestGwTestDom.addTestElement(radio, testId) as HTMLRadioElement;
  }

  private static requiresFormParent(tag: string): boolean {
    return tag === "input" || tag === "select" || tag === "textarea" || tag === "button";
  }

  static createFakeMessageEvent(
    messageType: GwMessagesFromGW | GwMessagesToGW,
    payload: any = {},
    nonGwOrigin: string | null = null,
    origin: string = window.location.toString(),
    messageId: number = -1,
    responseToMessageId: number = -1,
    status: GwMessageStatus = GwMessageStatus.NONE
  ): GwMessageEvent {
    return {
      origin: origin,
      source: TestGwTestDom.fakeWindows[origin],
      data: {
        gwMessageType: messageType,
        gwMessageId: messageId,
        gwNonGwOriginIfAny: nonGwOrigin,
        gwResponseToMessageId: responseToMessageId,
        gwStatus: status,
        gwPayload: payload,
      },
    } as any;
  }

  static buildRedAndBlueExternalWindows(testId: number): void {
    this.createAndAddTextBasedValueWidget(testId, "input1Value", "input1");
    this.createAndAddTextBasedValueWidget(testId, "input2Value", "input2");
    this.createAndAddTextBasedValueWidget(testId, "input3Value", "input3");

    const logicalNameToIdMapRedWindow = {
      redWindowInput1: "input1",
      redWindowInput2: "input2",
      redWindowInput3: "input3",
      logicalBlueWindow: "blueWindowId",
    };

    gwCrossOriginInternal.createPopupWindow("redWindowId", "redWindow.io", "redWindow", logicalNameToIdMapRedWindow);

    const logicalNameToIdMapBlueWindow = {
      blueWindowInput1: "input1",
      blueWindowInput2: "input2",
      blueWindowInput3: "input3",
      logicalRedWindow: "redWindowId",
    };

    gwCrossOriginInternal.createPopupWindow("blueWindowId", "blueWindow.io", "blueWindow", logicalNameToIdMapBlueWindow);
  }

  static switchActiveExternalToRed(): void {
    this.switchActiveExternalTo(TestGwTestDom.fakeWindows["redWindow.io"] as Window);
  }

  static switchActiveExternalToBlue(): void {
    this.switchActiveExternalTo(TestGwTestDom.fakeWindows["blueWindow.io"] as Window);
  }

  static switchActiveExternalTo(fakeWindow: any): void {
    GwCrossOriginExternal.kill();
    const origin = "" + window.location;
    GwCrossOriginExternal.init(origin, { "*": true }, window);
    TestGwTestDom.windowAny.postMessage = (messageData: GwMessageData, targetOrigin: string) => {
      if (targetOrigin !== origin) {
        throw new Error("Parent window postMessage called with unexpected target origin: " + targetOrigin);
      }
      TestGwTestDom.windowAny.onPostMessageEvent({ data: messageData, source: fakeWindow, origin: fakeWindow.location });
    };
  }
}

if ((window as any).GwTestEnv) {
  //Monkey Mock the Window
  TestGwTestDom.windowAny = window as any;
  TestGwTestDom.fakeWindows = {};
  TestGwTestDom.fakeWindows["" + window.location] = TestGwTestDom.windowAny;

  TestGwTestDom.windowAny.open = (url: string, targetName: string): Window | null => {
    const openerLocation = "" + TestGwTestDom.windowAny.location;
    const fakeWindow: GwMap = {};
    fakeWindow.opener = window;
    fakeWindow.parent = window;
    fakeWindow.location = url;
    fakeWindow.document = { URL: url, documentURI: url };
    fakeWindow.document.body = {};
    fakeWindow.onPostMessageEvent = GwCrossOriginExternal.receiveMessageFromGwApp.bind(GwCrossOriginExternal);
    fakeWindow.addEventListener = () => null;
    fakeWindow.removeEventListener = () => null;
    fakeWindow.performance = { now: () => window.performance.now() };

    fakeWindow.postMessage = (messageData: GwMessageData, targetOrigin: string) => {
      if (targetOrigin !== fakeWindow.location) {
        throw new Error("Popup window postMessage called with unexpected target origin: " + targetOrigin);
      }
      fakeWindow.onPostMessageEvent({ data: messageData, source: TestGwTestDom.windowAny, origin: openerLocation });
    };

    TestGwTestDom.fakeWindows[url] = fakeWindow;
    TestGwTestDom.switchActiveExternalTo(fakeWindow);

    return fakeWindow as Window;
  };

  TestGwTestDom.windowAny.onPostMessageEvent = gwCrossOriginInternal.receiveMessageFromTargetWindow.bind(gwCrossOriginInternal);
}
