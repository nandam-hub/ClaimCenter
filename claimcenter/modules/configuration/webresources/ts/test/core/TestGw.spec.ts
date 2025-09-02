import { expect } from "chai";
import "mocha";
import { gw } from "../../core/gw";
import { gwApp } from "../../plApp";

describe("gw", () => {
    it("Should have a globals object", () => {
        expect(gw.globals).to.not.be.undefined;
    });

    it("Should register systems correctly", () => {
        expect(gw.globals.gwApp).to.not.be.undefined;
        expect(gw.globals.gwApp.getSystemName()).to.equal("gwApp");
    });

    it("Should throw on duplicate registration", () => {
        expect(() => gw.api.registerGlobalSystem(gwApp)).to.throw;
    });

    it("Should handle registration of custom systems (essentially via javascript)", () => {
        gw.api.registerGlobalSystem({ getSystemName: () => "testSystemName1" });

        expect(gw.globals.testSystemName1).to.not.be.undefined;
        expect(gw.globals.testSystemName1.getSystemName()).to.equal("testSystemName1");
    });
});
