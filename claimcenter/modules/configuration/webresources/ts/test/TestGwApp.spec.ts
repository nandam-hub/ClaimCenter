import { expect } from "chai";
import "mocha";
import { gwApp } from "../plApp";

describe("gwApp", () => {
    it("Should Start and initialize required systems", () => {
        expect(gwApp).to.not.be.undefined;
    });
});
