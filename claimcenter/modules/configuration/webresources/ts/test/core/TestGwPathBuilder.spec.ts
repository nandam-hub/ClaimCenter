import { expect } from "chai";
import "mocha";
import { GwPathBuilder } from "../../core/util/GwPathBuilder";

describe("GwPathBuilder", () => {
    it("should initialize correctly, and getPath correctly", () => {
        let pB = new GwPathBuilder();
        expect(pB).to.exist;
        expect(pB.getPath()).to.equal("");

        pB = GwPathBuilder.create(99, -999);
        expect(pB).to.exist;
        expect(pB.getPath()).to.equal(" M 99 -999");
        expect(pB.toString()).to.equal(" M 99 -999");

        pB = GwPathBuilder.create(0, 0);
        expect(pB).to.exist;
        expect(pB.getPath()).to.equal(" M 0 0");
        expect(pB.toString()).to.equal(" M 0 0");
    });

    describe("HELPERS", () => {
        it("should makeImmutable", () => {
            const pB = GwPathBuilder.create(99, -999);
            expect(pB).to.exist;
            expect(pB.getPath()).to.equal(" M 99 -999");

            expect(pB.moveTo.bind(pB, 10, 11)).to.not.throw;
            pB.makeImmutable();
            expect(pB.moveTo.bind(pB, 10, 11)).to.throw;
        });
    });

    describe("PEN MOVE", () => {
        it("should moveBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.moveBy(1, 2)).to.equal(pB);
            expect(pB.getPath()).to.equal(" m 1 2");
            pB.moveBy(3, 4);
            expect(pB.getPath()).to.equal(" m 1 2 m 3 4");
        });

        it("should moveTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.moveTo(1, 2)).to.equal(pB);
            expect(pB.getPath()).to.equal(" M 1 2");
            pB.moveTo(3, 4);
            expect(pB.getPath()).to.equal(" M 1 2 M 3 4");
        });
    });

    describe("LINE", () => {
        it("should lineBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.lineBy(1, 2)).to.equal(pB);
            expect(pB.getPath()).to.equal(" l 1 2");
            pB.lineBy(3, 4);
            expect(pB.getPath()).to.equal(" l 1 2 l 3 4");
        });

        it("should lineTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.lineTo(1, 2)).to.equal(pB);
            expect(pB.getPath()).to.equal(" L 1 2");
            pB.lineTo(3, 4);
            expect(pB.getPath()).to.equal(" L 1 2 L 3 4");
        });

        it("should hLineBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.hLineBy(99)).to.equal(pB);
            expect(pB.getPath()).to.equal(" h 99");
            pB.hLineBy(999);
            expect(pB.getPath()).to.equal(" h 99 h 999");
        });

        it("should hLineTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.hLineTo(99)).to.equal(pB);
            expect(pB.getPath()).to.equal(" H 99");
            pB.hLineTo(999);
            expect(pB.getPath()).to.equal(" H 99 H 999");
        });

        it("should vLineBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.vLineBy(99)).to.equal(pB);
            expect(pB.getPath()).to.equal(" v 99");
            pB.vLineBy(999);
            expect(pB.getPath()).to.equal(" v 99 v 999");
        });

        it("should vLineTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.vLineTo(99)).to.equal(pB);
            expect(pB.getPath()).to.equal(" V 99");
            pB.vLineTo(999);
            expect(pB.getPath()).to.equal(" V 99 V 999");
        });
    });

    describe("CUBICS", () => {
        it("should cubicBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.cubicBy(1, 2, 3, 4, 5, 6)).to.equal(pB);
            expect(pB.getPath()).to.equal(" c 1 2 3 4 5 6");
            pB.cubicBy(7, 8, 9, 10, 11, 12);
            expect(pB.getPath()).to.equal(" c 1 2 3 4 5 6 c 7 8 9 10 11 12");
        });

        it("should cubicTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.cubicTo(1, 2, 3, 4, 5, 6)).to.equal(pB);
            expect(pB.getPath()).to.equal(" C 1 2 3 4 5 6");
            pB.cubicTo(7, 8, 9, 10, 11, 12);
            expect(pB.getPath()).to.equal(" C 1 2 3 4 5 6 C 7 8 9 10 11 12");
        });

        it("should reflectCubicBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.reflectCubicBy(1, 2, 3, 4)).to.equal(pB);
            expect(pB.getPath()).to.equal(" s 1 2 3 4");
            pB.reflectCubicBy(7, 8, 9, 10);
            expect(pB.getPath()).to.equal(" s 1 2 3 4 s 7 8 9 10");
        });

        it("should reflectCubicTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.reflectCubicTo(1, 2, 3, 4)).to.equal(pB);
            expect(pB.getPath()).to.equal(" S 1 2 3 4");
            pB.reflectCubicTo(7, 8, 9, 10);
            expect(pB.getPath()).to.equal(" S 1 2 3 4 S 7 8 9 10");
        });
    });

    describe("QUADS", () => {
        it("should quadBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.quadBy(1, 2, 3, 4)).to.equal(pB);
            expect(pB.getPath()).to.equal(" q 1 2 3 4");
            pB.quadBy(7, 8, 9, 10);
            expect(pB.getPath()).to.equal(" q 1 2 3 4 q 7 8 9 10");
        });

        it("should quadTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.quadTo(1, 2, 3, 4)).to.equal(pB);
            expect(pB.getPath()).to.equal(" Q 1 2 3 4");
            pB.quadTo(7, 8, 9, 10);
            expect(pB.getPath()).to.equal(" Q 1 2 3 4 Q 7 8 9 10");
        });

        it("should reflectQuadBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.reflectQuadBy(1, 2)).to.equal(pB);
            expect(pB.getPath()).to.equal(" t 1 2");
            pB.reflectQuadBy(7, 8);
            expect(pB.getPath()).to.equal(" t 1 2 t 7 8");
        });

        it("should reflectQuadTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.reflectQuadTo(1, 2)).to.equal(pB);
            expect(pB.getPath()).to.equal(" T 1 2");
            pB.reflectQuadTo(7, 8);
            expect(pB.getPath()).to.equal(" T 1 2 T 7 8");
        });
    });

    describe("ARC", () => {
        it("should arcBy", () => {
            const pB = new GwPathBuilder();
            expect(pB.arcBy(-3, -2, -1, 0, 1, 2, 3)).to.equal(pB);
            expect(pB.getPath()).to.equal(" a -3 -2 -1 0 1 2 3");
            pB.arcBy(4, 3, 2, 1, 0, -1, -2);
            expect(pB.getPath()).to.equal(" a -3 -2 -1 0 1 2 3 a 4 3 2 1 0 -1 -2");
        });

        it("should arcTo", () => {
            const pB = new GwPathBuilder();
            expect(pB.arcTo(-3, -2, -1, 0, 1, 2, 3)).to.equal(pB);
            expect(pB.getPath()).to.equal(" A -3 -2 -1 0 1 2 3");
            pB.arcTo(4, 3, 2, 1, 0, -1, -2);
            expect(pB.getPath()).to.equal(" A -3 -2 -1 0 1 2 3 A 4 3 2 1 0 -1 -2");
        });

        it("should lineToDegreeOnCircle & arcAlongCircle", () => {
            const circleX = 257.421875;
            const circleY = 134.625;
            const radius = 134.625;
            const startA = 20;
            const endA = 31;

            const pB = GwPathBuilder.create(circleX, circleY);
            expect(pB.lineToDegreeOnCircle(circleX, circleY, radius, startA)).to.equal(pB);
            expect(pB.getPath()).to.equal(" M 257.421875 134.625 L 303.4663367952182 8.118880926697088");
            expect(pB.arcAlongCircle(circleX, circleY, radius, endA)).to.equal(pB);
            expect(pB.getPath()).to.equal(
                " M 257.421875 134.625 L 303.4663367952182 8.118880926697088 A 134.625 134.625 0 0 1 326.75887583476606 19.22885214297814"
            );
        });
    });

    describe("CLOSE", () => {
        it("should close and moveToStart", () => {
            const pB = new GwPathBuilder();
            expect(pB.close()).to.equal(pB);
            expect(pB.getPath()).to.equal(" Z");
            expect(pB.moveToStart()).to.equal(pB);
            expect(pB.getPath()).to.equal(" Z Z");
        });
    });
});
