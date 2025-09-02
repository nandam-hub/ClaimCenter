import {GwTypedMap, GwValueAndCursorPos} from "../../types/gwTypes";
import {gwUtil} from "../util/gwUtil";

let charMap: GwTypedMap<string> = {}; //ph
let specialCharReg: RegExp = new RegExp(""); //ph

/**
 * These const values represent the range of full-width unicode characters that can be directly
 * converted to their half-width counterparts.
 * https://en.wikipedia.org/wiki/Halfwidth_and_Fullwidth_Forms_(Unicode_block)
 */
const LOWEST_UNICODE_FULL_WIDTH_LATIN_CHARACTER = "！";
const HIGHEST_UNICODE_FULL_WIDTH_LATIN_CHARACTER = "～";
const FULL_WIDTH_LATIN_MATCHER = new RegExp(`[${LOWEST_UNICODE_FULL_WIDTH_LATIN_CHARACTER}-${HIGHEST_UNICODE_FULL_WIDTH_LATIN_CHARACTER}]`, "g");
const FULL_WIDTH_TO_HALF_WIDTH_DELTA = 65248; // "！".charCodeAt(0) - "!".charCodeAt(0); //0xFEE0

/**
 * Character replacement mapping.
 * See GwCharReplacer.setCharacterMapping and GwCharReplacer.removeCharacterMapping for runtime manipulation
 */
const mapDefaultSpecialChars = () => {
  charMap[String.fromCharCode(8220)] = 		"\""; //“
  charMap[String.fromCharCode(8221)] = 		"\""; //”
  charMap[String.fromCharCode(8216)] = 		"'"; //‘
  charMap[String.fromCharCode(8217)] = 		"'"; //‘
  charMap[String.fromCharCode(8211)] = 		"-"; //–
  charMap[String.fromCharCode(8212)] = 		"--"; //—
  charMap[String.fromCharCode(189)] = 		"1/2"; //½
  charMap[String.fromCharCode(188)] = 		"1/4"; //¼
  charMap[String.fromCharCode(190)] = 		"3/4"; //¾
  charMap[String.fromCharCode(169)] = 		"(C)"; //©
  charMap[String.fromCharCode(174)] = 		"(R)"; //®
  charMap[String.fromCharCode(8230)] = 		"..."; //…
};

const buildRegex = () => {
  const regString = `[${Object.keys(charMap).join("\\")}]`;
  specialCharReg = new RegExp(regString, "g");
};

mapDefaultSpecialChars();
buildRegex();

/**
 * Static class used to replace characters stored in mapDefaultSpecialChars to their corresponding values.
 * This is primary used to replace word-processing special characters like ¾ with 3/4
 * The preference replaceWordProcessingCharacters when set to true causes gwEvents.onGlobalInputEvent to run: GwCharReplacer.replace on all input
 *
 * Mappings can be modified via GwCharReplacer.setCharacterMapping and GwCharReplacer.removeCharacterMapping
 * @link TestGwCharReplacer.spec.ts
 */
export abstract class GwCharReplacer {

  static needsReplacement (str: string): boolean {
    return str.match(specialCharReg) !== null;
  }

  static convertFullWidthToHalfWidth (text: string): string {

    const newText = text.replace(FULL_WIDTH_LATIN_MATCHER, (match, offset: number) => {
      const charCodeForSingleWide = match.charCodeAt(0) - FULL_WIDTH_TO_HALF_WIDTH_DELTA;
      return String.fromCharCode(charCodeForSingleWide);
    });
    return newText;
  }

  static replace (textWithCursor: GwValueAndCursorPos): GwValueAndCursorPos {
    const {value, cursorPos} = textWithCursor;
    let cursorOffset = 0;
    const newValue = value.replace(specialCharReg, (match, offset: number) => {
      const replacement = charMap[match];
      if (offset < cursorPos) {
        cursorOffset += replacement.length - 1;
      }
      return replacement;
    });
    return { value: newValue, cursorPos: cursorPos + cursorOffset };
  }

  static setCharacterMapping (singleChar: string, nLengthString: string): void {
    if (singleChar.length !== 1) {
      throw new Error("Character replacement mappings require character lookups to be a string of length 1");
    }

    charMap[singleChar] = nLengthString;
    buildRegex();
  }

  static removeCharacterMapping (singleChar: string): void {
    delete charMap[singleChar];
    buildRegex();
  }

  static getCharacterMappings (): GwTypedMap<string> {
    return gwUtil.mapMerge(charMap);
  }

  static resetCustomCharacterMappings (): void {
    charMap = {};
    mapDefaultSpecialChars();
    buildRegex();
  }

  /**
   * Used for testing. Returns an array of all graphemes used to construct the provided character,
   * For standard Unicode, this will be an array with a single string in the format of "\u0000".
   * For multi byte characters/glyphs/emojis, this will be an array of many single Unicode formatted strings.
   * @param char
   */
  static getUnicodeSequence (char: string): string[] {
    return char.split("").map((subCharOrUnicodeStr) => {
      if (!subCharOrUnicodeStr) {
        return "";
      }

      if (subCharOrUnicodeStr.length > 1) {
        // Is unicode formatted string
        return subCharOrUnicodeStr;
      }

      const fullHex = char.charCodeAt(0).toString(16);
      const leftPaddedZeroes = "0000".substring(0, 4 - fullHex.length);
      return leftPaddedZeroes + fullHex;
    });
  }

  /**
   * Used for testing. Returns a single string base16 Unicode prefixed value.
   * If the character is multi byte, then returns each grapheme joined together
   * in a single string.
   * @param char
   * @param prefix - optional replacement for javascript's "\u", for example "U+"
   * @param joiner - multi byte characters will be stringed together by " " by default
   */
  static getUnicode (char: string, prefix: string = "\\u", joiner: string = " "): string {
    return this.getUnicodeSequence(char).join(joiner).replace("\\u", prefix);
  }

  /**
   * Converts all non standard hyphen/dashes/minus characters to the standard
   * unicode character \u002D "hyphen-minus".
   * @param str
   */
  static convertAllMinusLikesToHyphenMinus (str: string): string {
    return str.replace(hyphenLikesRegex, HYPHEN_MINUS);
  }
}

const HYPHEN_MINUS: string = String.fromCharCode(45);

const hyphenLikesArr = [
  "‐",  //U+2010 (Hyphen)
  "―",  //U+2015 (Horizontal Bar)
  "−",  //U+2212 (Minus)
  "–",  //U+2013 (En Dash)
  "˗",  //U+02d7 (Modifier Letter Minus Sign)
  "‑",  //U+2011 (NB Hyphen)
  "‒",  //U+2012 (Figure Dash)
  "⁃",  //U+2043 (Hyphen Bullet)
  "﹘",  //U+FE58 (Small Em Dash)
  "﹣",  //U+FE63 (Small Hyphen-Minus)
  "－",  //U+FF0D (Fullwidth Hyphen-Minus)
  "➖"  //U+2796 (Minus Symbol)
];

const hyphenLikesRegex = new RegExp(`[${hyphenLikesArr.join("\\")}]`, "g");
