import { expect } from "chai";
import "mocha";
import { GwSet } from "../../core/util/GwSet";

describe("GwSet", () => {
    it("Should construct and create correctly", () => {
        const set1 = new GwSet();
        expect(set1).to.exist;
        const set2 = GwSet.create();
        expect(set2).to.exist;
        const set3 = GwSet.createFromArray([]);
        expect(set3).to.exist;
    });

    it("Should add correctly", () => {
        const vals = ["1", "2", "3", "4", "giraffe"];
        const set1 = new GwSet(vals);
        vals.forEach((val) => {
            expect(set1.has(val)).to.be.true;
        });

        expect(set1.size()).to.equal(5);
        expect(set1.add("new") === set1).to.be.true;
        expect(set1.has("new")).to.be.true;
        expect(set1.size()).to.equal(6);

        const set2 = GwSet.createFromArray(vals);

        vals.forEach((val) => {
            expect(set2.has(val)).to.be.true;
        });

        expect(set2.size()).to.equal(5);
        expect(set2.add("new") === set2).to.be.true;
        expect(set2.has("new")).to.be.true;
        expect(set2.size()).to.equal(6);

        const set3 = GwSet.create("1", "2", "3", "4", "giraffe");

        vals.forEach((val) => {
            expect(set3.has(val)).to.be.true;
        });

        expect(set3.size()).to.equal(5);
        expect(set3.add("new") === set3).to.be.true;
        expect(set3.has("new")).to.be.true;
        expect(set3.size()).to.equal(6);

        const set4 = GwSet.create();
        set4.add("1", "2", "3", "4", "giraffe");

        vals.forEach((val) => {
            expect(set4.has(val)).to.be.true;
        });

        expect(set4.size()).to.equal(5);
        expect(set4.add("new") === set4).to.be.true;
        expect(set4.has("new")).to.be.true;
        expect(set4.size()).to.equal(6);

        const set5 = GwSet.create();
        set5.add("5", "6", "7", "8", "rhino");

        ["5", "6", "7", "8", "rhino"].forEach((val) => {
            expect(set5.has(val)).to.be.true;
        });

        expect(set5.size()).to.equal(5);
        expect(set5.add("new") === set5).to.be.true;
        expect(set5.has("new")).to.be.true;
        expect(set5.size()).to.equal(6);

        set5.add(set4);
        vals.forEach((val) => {
            expect(set5.has(val)).to.be.true;
        });

        ["5", "6", "7", "8", "rhino"].forEach((val) => {
            expect(set5.has(val)).to.be.true;
        });

        expect(set5.size()).to.equal(11);
        expect(set4.size()).to.equal(6);
    });

    it("Should remove correctly", () => {
        const vals1 = ["1", "2", "3", "4", "giraffe"];
        const set1 = new GwSet(vals1);

        vals1.forEach((val) => {
            expect(set1.has(val)).to.be.true;
        });

        vals1.forEach((val) => {
            set1.remove(val);
            expect(set1.has(val)).to.be.false;
        });

        const vals2 = ["5", "6", "7", "8", "rhino"];
        const set2 = new GwSet(vals2.concat(vals1));

        vals2.concat(vals1).forEach((val) => {
            expect(set2.has(val)).to.be.true;
        });

        vals2.forEach((val) => {
            set2.remove(val);
            expect(set2.has(val)).to.be.false;
        });

        vals1.forEach((val) => {
            expect(set2.has(val)).to.be.true;
        });

        expect(set2.has(vals1)).to.be.true;
        expect(set2.has(set1)).to.be.true;

        set1.remove(set2);
        vals1.concat(vals2).forEach((val) => {
            expect(set1.has(val)).to.be.false;
        });
    });

    it("Should increment count only on new values", () => {
        const vals = ["1", "2", "3", "4", "giraffe"];
        const set1 = new GwSet(vals);
        vals.forEach((val) => {
            expect(set1.has(val)).to.be.true;
        });

        expect(set1.count()).to.equal(5);

        set1.add(vals);
        vals.forEach((val) => {
            expect(set1.has(val)).to.be.true;
        });

        expect(set1.count()).to.equal(5);
    });

    it("Should decrement count only on removing existing values", () => {
        const vals = ["1", "2", "3", "4", "giraffe"];
        const set1 = new GwSet(vals);
        vals.forEach((val) => {
            expect(set1.has(val)).to.be.true;
        });

        expect(set1.count()).to.equal(5);

        set1.remove("notavalue");
        expect(set1.count()).to.equal(5);
        set1.remove("3");
        expect(set1.count()).to.equal(4);

        set1.remove(vals);
        expect(set1.count()).to.equal(0);
    });

    it("Should hasAny correctly", () => {
        const vals = ["1", "2", "3", "4", "giraffe"];
        const set1 = new GwSet(vals);
        vals.forEach((val) => {
            expect(set1.hasAny(val)).to.be.true;
        });

        expect(set1.hasAny(vals)).to.be.true;
        expect(set1.hasAny("nope", "1")).to.be.true;
        expect(set1.hasAny("nope", "nada")).to.be.false;

        const set2 = new GwSet(vals);

        expect(set1.hasAny(set2)).to.be.true;
        expect(set2.hasAny(set1)).to.be.true;

        expect(set1.hasAny(new GwSet())).to.be.false;
        expect(set1.hasAny(new GwSet(["8"]))).to.be.false;
        expect(set1.hasAny(new GwSet(["giraffe"]))).to.be.true;
    });

    it("Should forEach correctly", () => {
        const vals = ["1", "2", "3", "4", "giraffe"];
        const set1 = new GwSet(vals);

        const map: string[] = [];

        set1.forEach((val) => {
            map.push(val);
        });

        expect(map).to.deep.equal(vals);
    });

    it("Should copy and equals correctly", () => {
        const vals = ["1", "2", "3", "4", "giraffe"];
        const set1 = new GwSet(vals);
        const set2 = set1.copy();
        expect(set1.has(set2)).to.be.true;
        expect(set2.has(set1)).to.be.true;
        expect(set2.size()).to.equal(5);

        expect(set1.equals(set2)).to.be.true;
        expect(set2.equals(set1)).to.be.true;

        set1.add("new");
        expect(set1.equals(set2)).to.be.false;
        expect(set2.equals(set1)).to.be.false;

        set1.remove("new");
        expect(set1.equals(set2)).to.be.true;
        expect(set2.equals(set1)).to.be.true;
    });

    it("Should clear correctly", () => {
        const vals = ["1", "2", "3", "4", "giraffe"];
        const set1 = new GwSet(vals);
        const returnMap = set1.clear();
        expect(returnMap).to.deep.equal({ 1: true, 2: true, 3: true, 4: true, giraffe: true });
        expect(set1.size()).to.equal(0);
    });
});
