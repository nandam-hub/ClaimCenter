/**
 * utils.js
 * Utility functions for the Azure HeatMap implementation
 */

/**
 * Formats a number to 5 decimal places
 * @param {number} x - The number to format
 * @returns {number} The formatted number
 */
export const digits5 = (x) => {
  return Math.round(x * 100000) / 100000;
};

/**
 * Finds a document element using a suffix of its ID
 * @param {string} idSuffix - The suffix to search for
 * @returns {HTMLElement|null} The found element or null
 */
export const findByIDSuffix = (idSuffix) => {
  const elements = window.parent.document.getElementsByTagName("*");
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const index = element.id.indexOf(idSuffix);
    if (index !== -1 && index + idSuffix.length === element.id.length) {
      return element; // assume there's only one match
    }
  }
  return null;
};

/**
 * Computes the integer part of the log base 2 of the argument
 * Always rounds the log down
 * @param {number} value - The value to compute log2 of (must be positive)
 * @returns {number} The integer log base 2
 */
export const logBase2 = (value) => {
  let rv = 0;
  value >>= 1;

  while (value > 0) {
    value >>= 1;
    rv++;
  }
  return rv;
};

/**
 * Clips a value to be within a specified range
 * @param {number} value - The value to clip
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} The clipped value
 */
export const clip = (value, min, max) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

/**
 * Sets an element's opacity
 * @param {HTMLElement} el - The element to modify
 * @param {number} opacity - Opacity value between 0 and 1
 */
export const setOpacity = (el, opacity) => {
  el.style.opacity = opacity.toFixed(2);
};

/**
 * Retrieves the value of a cookie by name
 * @param {string} name - The name of the cookie
 * @returns {string|null} The value of the cookie or null if not found
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

/**
 * Sets the window event for focus and event assignment
 * @param {Event} e - The event to assign
 */
export const setWindowEvent = (e) => {
  parent["mapFrame"].focus();
  window.event = e;
};

/**
 * Processes HTML content for popups, ensuring links work properly
 * @param {string} htmlContent - The HTML content to process
 * @returns {string} Processed HTML content
 */
export const processPopupContent = (htmlContent) => {
  if (!htmlContent) return "";

  // Create a temporary div to manipulate the HTML
  var tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  // Find all links in the content
  var links = tempDiv.querySelectorAll("a[data-gw-claimnumber]");

  // Process each link to make it properly clickable
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var claimNumber = link.getAttribute("data-gw-claimnumber");

    // Create an onclick attribute that calls our function
    link.setAttribute(
      "onclick",
      'heatMap.onClaimNumberClick("' + claimNumber + '"); return false;'
    );
    link.setAttribute("href", "javascript:void(0);");
    link.style.color = "#0078d4";
    link.style.textDecoration = "underline";
    link.style.cursor = "pointer";
  }

  return tempDiv.innerHTML;
};

/**
 * Get CSRF token from parent window or cookie
 * @returns {string} The CSRF token or empty string if not found
 */
export const getCsrfToken = () => {
  // Try to get token from parent window
  if (
    window.parent &&
    window.parent.gw &&
    window.parent.gw.globals &&
    window.parent.gw.globals.gwAjax &&
    typeof window.parent.gw.globals.gwAjax.getCsrfToken === "function"
  ) {
    const parentToken = window.parent.gw.globals.gwAjax.getCsrfToken();
    if (parentToken) {
      return parentToken;
    }
  }
  
  // Fall back to cookie if parent window method failed
  return getCookie("csrfToken") || "";
};

/**
 * Get CSRF parameter name
 * @returns {string} The CSRF parameter name (default: "CSRFToken")
 */
export const getCsrfParamName = () => {
  if (
    window.parent &&
    window.parent.gw &&
    window.parent.gw.globals &&
    window.parent.gw.globals.gwUtil &&
    window.parent.gw.globals.gwUtil.CSRF_PARAM_NAME
  ) {
    return window.parent.gw.globals.gwUtil.CSRF_PARAM_NAME;
  }
  return "CSRFToken";
};
