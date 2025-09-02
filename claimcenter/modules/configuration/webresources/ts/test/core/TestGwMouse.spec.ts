import { expect } from "chai";
import "mocha";
import { gwMouse } from "../../core/gwMouse";
import { GwPoint } from "../../core/GwPoint";

describe("GwMouse", () => {
    xit("should update position correctly", () => {
        expect(1).to.be.false;
    });

    it("position", () => {
        gwMouse.updatePosition({ pageX: 56, pageY: 78 } as any);
        const point = gwMouse.position;
        expect(point).to.be.instanceOf(GwPoint);
        expect(point.x).to.equal(56);
        expect(point.y).to.equal(78);

        gwMouse.updatePosition({ pageX: 99999, pageY: 11111 } as any);
        const point2 = gwMouse.position;
        expect(point2).to.be.instanceOf(GwPoint);
        expect(point2.x).to.equal(99999);
        expect(point2.y).to.equal(11111);
    });
});
