import { expect } from "chai";
import "mocha";
import { GwCharReplacer } from "../../core/inputs/GwCharReplacer";

describe("GwCharReplacer", () => {
    it("should replace single characters correctly", () => {
        expect(GwCharReplacer.replace({ value: "“", cursorPos: 0 })).to.deep.equal({ value: '"', cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "”", cursorPos: 0 })).to.deep.equal({ value: '"', cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "‘", cursorPos: 0 })).to.deep.equal({ value: "'", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "‘", cursorPos: 0 })).to.deep.equal({ value: "'", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "–", cursorPos: 0 })).to.deep.equal({ value: "-", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "—", cursorPos: 0 })).to.deep.equal({ value: "--", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "½", cursorPos: 0 })).to.deep.equal({ value: "1/2", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "¼", cursorPos: 0 })).to.deep.equal({ value: "1/4", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "¾", cursorPos: 0 })).to.deep.equal({ value: "3/4", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "©", cursorPos: 0 })).to.deep.equal({ value: "(C)", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "®", cursorPos: 0 })).to.deep.equal({ value: "(R)", cursorPos: 0 });
        expect(GwCharReplacer.replace({ value: "…", cursorPos: 0 })).to.deep.equal({ value: "...", cursorPos: 0 });
    });

    it("needsReplacement detects special characters", () => {
        expect(GwCharReplacer.needsReplacement("“")).to.be.true;
        expect(GwCharReplacer.needsReplacement("”")).to.be.true;
        expect(GwCharReplacer.needsReplacement("‘")).to.be.true;
        expect(GwCharReplacer.needsReplacement("‘")).to.be.true;
        expect(GwCharReplacer.needsReplacement("–")).to.be.true;
        expect(GwCharReplacer.needsReplacement("—")).to.be.true;
        expect(GwCharReplacer.needsReplacement("½")).to.be.true;
        expect(GwCharReplacer.needsReplacement("¼")).to.be.true;
        expect(GwCharReplacer.needsReplacement("¾")).to.be.true;
        expect(GwCharReplacer.needsReplacement("©")).to.be.true;
        expect(GwCharReplacer.needsReplacement("®")).to.be.true;
        expect(GwCharReplacer.needsReplacement("…")).to.be.true;
    });

    it("needsReplacement ignores normal characters", () => {
        expect(GwCharReplacer.needsReplacement("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")).to.be.false;
        expect(GwCharReplacer.needsReplacement("1234567890`-=[]\\;',./~!@#$%^&*()_+{}|:\"<>?")).to.be.false;
    });

    it("should replace multiple characters correctly", () => {
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)...",
            cursorPos: 0,
        });
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…“”‘‘–—½¼¾©®…", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)...\"\"''---1/21/43/4(C)(R)...",
            cursorPos: 0,
        });
    });

    it("should not modify non special characters", () => {
        expect(
            GwCharReplacer.replace({ value: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", cursorPos: 0 })
        ).to.deep.equal({ value: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", cursorPos: 0 });
        expect(
            GwCharReplacer.replace({ value: "abcdefghijklmnopqrstuvwxyz“”‘‘–—½¼¾©®…ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", cursorPos: 0 })
        ).to.deep.equal({
            value: "abcdefghijklmnopqrstuvwxyz\"\"''---1/21/43/4(C)(R)...ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
            cursorPos: 0,
        });
    });

    it("should leave cursor in place when replacing with single character", () => {
        expect(GwCharReplacer.replace({ value: "“Hello”, he said", cursorPos: 4 })).to.deep.equal({
            value: '"Hello", he said',
            cursorPos: 4,
        });
    });

    it("should advance cursor when replacing with multiple characters", () => {
        expect(GwCharReplacer.replace({ value: "½, ¼ and ¾ are fractions", cursorPos: 12 })).to.deep.equal({
            value: "1/2, 1/4 and 3/4 are fractions",
            cursorPos: 18,
        });
    });

    it("should advance cursor when replacing with multiple characters immediately before cursor", () => {
        expect(GwCharReplacer.replace({ value: "½ is equivalent to 0.5", cursorPos: 1 })).to.deep.equal({
            value: "1/2 is equivalent to 0.5",
            cursorPos: 3,
        });
    });

    it("should leave cursor in place when replacing with multiple characters after cursor position", () => {
        expect(GwCharReplacer.replace({ value: "And so on…", cursorPos: 9 })).to.deep.equal({ value: "And so on...", cursorPos: 9 });
    });

    it("should setCharacterMapping correctly and reset correctly", () => {
        GwCharReplacer.setCharacterMapping("(", "_OPENPARENS_");
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…(", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)..._OPENPARENS_",
            cursorPos: 0,
        });
        GwCharReplacer.setCharacterMapping("J", "TESTJ");
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…(J", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)..._OPENPARENS_TESTJ",
            cursorPos: 0,
        });
        GwCharReplacer.setCharacterMapping("]", "TEST]");
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…(J]", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)..._OPENPARENS_TESTJTEST]",
            cursorPos: 0,
        });

        const map = GwCharReplacer.getCharacterMappings();
        expect(map["J"]).to.equal("TESTJ");
        expect(map["Q"]).to.be.undefined;
        expect(map["]"]).to.equal("TEST]");
        expect(map["©"]).to.equal("(C)");

        GwCharReplacer.resetCustomCharacterMappings();

        const map2 = GwCharReplacer.getCharacterMappings();
        expect(map2["J"]).to.be.undefined;
        expect(map2["Q"]).to.be.undefined;
        expect(map2["]"]).to.be.undefined;
        expect(map2["©"]).to.equal("(C)");

        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…J", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)...J",
            cursorPos: 0,
        });
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…J]", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)...J]",
            cursorPos: 0,
        });
    });

    it("should setCharacterMapping correctly and reset correctly", () => {
        GwCharReplacer.setCharacterMapping("(", "_OPENPARENS_");
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…(", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)..._OPENPARENS_",
            cursorPos: 0,
        });
        GwCharReplacer.setCharacterMapping("J", "TESTJ");
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…(J", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)..._OPENPARENS_TESTJ",
            cursorPos: 0,
        });
        GwCharReplacer.setCharacterMapping("]", "TEST]");
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…(J]", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)..._OPENPARENS_TESTJTEST]",
            cursorPos: 0,
        });

        const map = GwCharReplacer.getCharacterMappings();
        expect(map["J"]).to.equal("TESTJ");
        expect(map["Q"]).to.be.undefined;
        expect(map["]"]).to.equal("TEST]");
        expect(map["©"]).to.equal("(C)");

        GwCharReplacer.removeCharacterMapping("J");

        const map2 = GwCharReplacer.getCharacterMappings();
        expect(map2["J"]).to.be.undefined;
        expect(map2["Q"]).to.be.undefined;
        expect(map["]"]).to.equal("TEST]");
        expect(map2["©"]).to.equal("(C)");

        GwCharReplacer.removeCharacterMapping("]");

        const map3 = GwCharReplacer.getCharacterMappings();
        expect(map3["J"]).to.be.undefined;
        expect(map3["Q"]).to.be.undefined;
        expect(map3["]"]).to.be.undefined;
        expect(map3["©"]).to.equal("(C)");

        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…J", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)...J",
            cursorPos: 0,
        });
        expect(GwCharReplacer.replace({ value: "“”‘‘–—½¼¾©®…J]", cursorPos: 0 })).to.deep.equal({
            value: "\"\"''---1/21/43/4(C)(R)...J]",
            cursorPos: 0,
        });
    });
});
