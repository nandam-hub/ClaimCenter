import { expect } from "chai";
import "mocha";
import { gwCrossOriginInternal } from "../../../core/GwCrossOriginInternal";
import { gwInputs } from "../../../core/inputs/gwInputs";
import { GwCrossOriginExternal } from "../../../embedded/GwCrossOriginExternal";
import { GwCrossOriginEvent, GwMessagesToGW, GwNotification, GwNotificationType } from "../../../types/gwCrossOriginTypes";
import { GwMap } from "../../../types/gwTypes";
import { TestGwTestDom } from "../../TestGwTestDom.spec";

describe("GwCrossOriginInternal", () => {
    const domTestId = TestGwTestDom.getNewTestId();

    after((done) => {
        TestGwTestDom.removeTestElementsByTestId(domTestId);
        done();
    });

    describe("Initialization", () => {
        it("Should Exist", () => {
            expect(gwCrossOriginInternal).to.exist;
        });

        it("Should Iterate embeddedWidgets and Create Windows", () => {
            const embed1 = TestGwTestDom.createAndAddTestDiv(domTestId, [".gw-EmbeddedWidget"], {
                id: "embed1",
                "data-gw-frame-name": "frame1",
                "data-gw-request-type": "GET",
                "data-gw-url": "http://httpbin.org/get?name=embed1",
                "data-gw-logical-names": JSON.stringify({
                    logicName1_1: "idName1_1",
                    logicName1_2: "idName1_2",
                    logicName1_3: "idName1_3",
                }),
            });

            const embed2 = TestGwTestDom.createAndAddTestDiv(domTestId, ["gw-EmbeddedWidget"], {
                id: "embed2",
                "data-gw-frame-name": "frame2",
                "data-gw-request-type": "GET",
                "data-gw-url": "http://httpbin.org/get?name=embed2",
                "data-gw-logical-names": JSON.stringify({
                    logicName2_1: "idName2_1",
                    logicName2_2: "idName2_2",
                    logicName2_3: "idName2_3",
                }),
            });

            const embed3 = TestGwTestDom.createAndAddTestDiv(domTestId, ["gw-EmbeddedWidget"], {
                id: "embed3",
                "data-gw-frame-name": "frame3",
                "data-gw-request-type": "GET",
                "data-gw-url": "http://httpbin.org/get?name=embed3",
                "data-gw-logical-names": JSON.stringify({
                    logicName3_1: "idName3_1",
                    logicName3_2: "idName3_2",
                    logicName3_3: "idName3_3",
                }),
            });
            expect(embed1.hasAttribute("data-gw-registered")).to.be.false;
            expect(embed2.hasAttribute("data-gw-registered")).to.be.false;
            expect(embed3.hasAttribute("data-gw-registered")).to.be.false;

            gwCrossOriginInternal.orderSpecificInit(false);
            const frames = document.getElementsByTagName("iframe");
            expect(frames).to.have.lengthOf(3);
            expect(embed1.hasAttribute("data-gw-registered")).to.be.true;
            expect(embed2.hasAttribute("data-gw-registered")).to.be.true;
            expect(embed3.hasAttribute("data-gw-registered")).to.be.true;
        });
    });

    describe("Sending and Receiving Messages", () => {
        before(() => TestGwTestDom.buildRedAndBlueExternalWindows(domTestId));

        it("Should getValues", (done) => {
            TestGwTestDom.switchActiveExternalToBlue();
            const promise = GwCrossOriginExternal.getValues(["blueWindowInput1", "blueWindowInput2", "blueWindowInput3"]);
            const objectUpdatedInsideOfPromise: GwMap = {};

            promise
                .then((value: any) => {
                    objectUpdatedInsideOfPromise.value = value;
                    expect(objectUpdatedInsideOfPromise.value).to.deep.equal({
                        blueWindowInput1: "input1Value",
                        blueWindowInput2: "input2Value",
                        blueWindowInput3: "input3Value",
                    });
                    done();
                })
                .catch((err: Error) => {
                    done(err);
                });
        });

        it("Should setValues", (done) => {
            TestGwTestDom.switchActiveExternalToBlue();
            const confirmPromise = GwCrossOriginExternal.setValues({
                blueWindowInput1: "input1newvalue",
                blueWindowInput2: "input2newvalue",
                blueWindowInput3: "input3newvalue",
            });

            confirmPromise
                .then(() => {
                    setTimeout(() => {
                        const valuesMap = gwInputs.getValuesByIdsAsMap(["input1", "input2", "input3"]);
                        expect(valuesMap.input1).to.equal("input1newvalue");
                        expect(valuesMap.input2).to.equal("input2newvalue");
                        expect(valuesMap.input3).to.equal("input3newvalue");

                        done();
                    });
                })
                .catch((err: Error) => {
                    setTimeout(() => {
                        done(err);
                    });
                });
        });

        let callbackCrossOriginEvent = false;

        //TODO: add cases for errors and rejections when origins don't match, etc, once we get all the server side API hammered out
        //And Probably handle them in live smoke test environments.
        it("Should addCustomEventListener and receive broadcasted events", (done) => {
            TestGwTestDom.switchActiveExternalToBlue();
            const INFO_FROM_RED_WINDOW = "infoFromRedWindow";

            let info: string | null = null;

            const confirmPromise = GwCrossOriginExternal.addCrossOriginEventListener(
                "logicalRedWindow",
                "eventFromRedWindow",
                (ev: GwCrossOriginEvent) => {
                    callbackCrossOriginEvent = true;
                    info = ev.info;
                }
            );

            confirmPromise
                .then((thing: any) => {
                    const fakeEvent = TestGwTestDom.createFakeMessageEvent(
                        GwMessagesToGW.BROADCAST_CROSS_ORIGIN_EVENT,
                        { eventName: "eventFromRedWindow", info: INFO_FROM_RED_WINDOW }, //payload
                        "redWindow.io",
                        "redWindow.io"
                    );

                    // This should get the fake event as though from redWindow, and then broadcast it to blueWindow
                    gwCrossOriginInternal.receiveMessageFromTargetWindow(fakeEvent);

                    setTimeout(() => {
                        expect(callbackCrossOriginEvent).to.be.true;
                        expect(info).to.equal(INFO_FROM_RED_WINDOW);
                        done();
                    });
                })
                .catch((err: Error) => {
                    setTimeout(() => {
                        done(err);
                    });
                });
        });

        it("Should removeCustomEventListener", (done) => {
            callbackCrossOriginEvent = false;
            TestGwTestDom.switchActiveExternalToBlue();
            const confirmPromise = GwCrossOriginExternal.removeCrossOriginEventListener("logicalRedWindow", "eventFromRedWindow");

            const fakeEvent = TestGwTestDom.createFakeMessageEvent(
                GwMessagesToGW.BROADCAST_CROSS_ORIGIN_EVENT,
                { eventName: "eventFromRedWindow", info: null },
                "redWindow.io",
                "redWindow.io"
            );

            // This should get the fake event as though from redWindow, and then NOT broadcast it to blueWindow
            gwCrossOriginInternal.receiveMessageFromTargetWindow(fakeEvent);

            confirmPromise
                .then(() => {
                    setTimeout(() => {
                        expect(callbackCrossOriginEvent).to.be.false;
                        done();
                    });
                })
                .catch((err: Error) => {
                    setTimeout(() => {
                        done(err);
                    });
                });
        });

        let notification: GwNotification | null = null;

        it("Should send and receive gwNotifications", (done) => {
            //sendGwNotificationEventToAllTargetWindows
            TestGwTestDom.switchActiveExternalToBlue();

            GwCrossOriginExternal.addCallbackForGwNotificationType(GwNotificationType.THEME_CHANGED, (n: GwNotification) => {
                notification = n;
            });

            gwCrossOriginInternal.sendGwNotificationEventToAllTargetWindows(GwNotificationType.THEME_CHANGED, "NEW_THEME");
            setTimeout(() => {
                expect(notification).to.exist;
                expect(notification!.type).to.equal(GwNotificationType.THEME_CHANGED);
                expect(notification!.info).to.equal("NEW_THEME");
                done();
            });
        });

        it("Should remove gwNotifications listeners", (done) => {
            //sendGwNotificationEventToAllTargetWindows
            TestGwTestDom.switchActiveExternalToBlue();
            notification = null;
            GwCrossOriginExternal.removeCallbackForGwNotificationType(GwNotificationType.THEME_CHANGED);

            gwCrossOriginInternal.sendGwNotificationEventToAllTargetWindows(GwNotificationType.THEME_CHANGED, "SHOULD_NOT_EXIST");
            setTimeout(() => {
                expect(notification).to.be.null;
                done();
            });
        });
    });
});
