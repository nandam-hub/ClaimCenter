/*
 * ===============================================
 * ============= JSDOM-Global maps all of the window props from jsdom onto global props
 * ============================================ */

require("jsdom-global")("", {
  resources: "usable",
  pretendToBeVisual: true,
  url: "http://guidewire.com",
});

global.$ = require("jquery");
window.$ = require("jquery");

window.GwTestEnv = true;

// window.localStorage = window.localStorage || {
//   getItem(key) {},
//   setItem(key, value) {},
// };
