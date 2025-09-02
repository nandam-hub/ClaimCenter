/**
 * TooltipManager.js
 * Handles tooltip and popup management for the Azure HeatMap
 */
import { digits5, processPopupContent, getCookie, getCsrfToken } from "../utils/utils.js";

class TooltipManager {
  constructor(heatMapInstance) {
    this.heatMap = heatMapInstance;
  }

  /**
   * Handles global map click events for tooltip display
   * @param {Object} e - The click event
   */
  handleGlobalMapClick(e) {
    // Get the click coordinates
    const clickedPosition = e.position;
    if (
      !clickedPosition ||
      !Array.isArray(clickedPosition) ||
      clickedPosition.length < 2
    ) {
      console.error("Invalid position in global click event:", clickedPosition);
      return;
    }

    // Clear any existing tooltip
    this.clearToolTip();

    // Extract lat/lon from the click position
    const pointLon = clickedPosition[0]; // Longitude
    const pointLat = clickedPosition[1]; // Latitude

    // Get claim tooltip data for this location
    this.getClaimTooltip(pointLat, pointLon);
  }

  /**
   * Gets claim tooltip data from the server for a specific location
   * @param {number} latitude - The latitude to query
   * @param {number} longitude - The longitude to query
   */
  getClaimTooltip(latitude, longitude) {
    // Construct server request with coordinates
    let urlParamString = `?ttLat=${digits5(latitude)}&ttLng=${digits5(
      longitude
    )}`;

    // Get CSRF token using our utility function
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      urlParamString += `&CSRFToken=${csrfToken}`;
    }

    // Send request to get tooltip content
    this.heatMap.postToServer(urlParamString, (responseText) => {
      if (responseText && responseText.trim() !== "") {
        // Parse the response - check if it uses Bing's format (lat,lon|content)
        const bar = responseText.indexOf("|");
        if (bar > 0) {
          // Response format is in Bing's style: "lat,lon|content"
          const comma = responseText.indexOf(",");
          const lat = responseText.substring(0, comma);
          const lng = responseText.substring(comma + 1, bar);
          const content = responseText.substring(bar + 1);

          // Use the server-provided position if available
          const position = [parseFloat(lng), parseFloat(lat)];
          this.showToolTip(content, position);
        } else {
          // Regular content - use the original click position
          this.showToolTip(responseText, [longitude, latitude]);
        }
      }
    });
  }

  /**
   * Shows a tooltip at the specified position
   * @param {string} tooltipText - HTML content for the tooltip
   * @param {Array} position - Position [lon, lat] to show the tooltip
   */
  showToolTip(tooltipText, position) {
    if (!tooltipText || !position) {
      console.error("Invalid parameters for showToolTip");
      return;
    }

    // Parse server response format (latitude,longitude|htmlContent)
    const bar = tooltipText.indexOf("|");
    let positionFromServer;
    let htmlContent;

    if (bar > 0) {
      // Response contains coordinates and content
      const comma = tooltipText.indexOf(",");
      const lat = parseFloat(tooltipText.substring(0, comma));
      const lng = parseFloat(tooltipText.substring(comma + 1, bar));

      // Validate coordinates from server
      if (
        isNaN(lat) ||
        isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        console.error("Invalid coordinates from server:", lat, lng);
        positionFromServer = position;
      } else {
        // Use coordinates from server (note: Azure Maps uses [longitude, latitude] order)
        positionFromServer = [lng, lat];
      }

      // Extract the HTML content part (after the '|')
      htmlContent = tooltipText.substring(bar + 1);
    } else {
      // No coordinates in response, use click position and full response as content
      positionFromServer = position;
      htmlContent = tooltipText;
    }

    // Check if tooltipPopup is available - use global or instance
    let tooltipPopup = this.heatMap.tooltipPopup || window.tooltipPopup;

    if (!tooltipPopup) {
      console.error("Tooltip popup not initialized");
      return;
    }

    // Process the popup content to ensure links work correctly
    const processedContent = processPopupContent(htmlContent);

    // Set the popup properties and add it to the map
    tooltipPopup.setOptions({
      content: `<div style="padding: 15px; max-width: 300px; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">${processedContent}</div>`,
      position: positionFromServer,
      pixelOffset: [0, -15], // Offset it slightly above the point
    });

    // Add the popup to the map
    tooltipPopup.open(window.map || this.heatMap.map);

    // Assign to global for backward compatibility
    window.tooltipPopup = tooltipPopup;
  }

  /**
   * Clears any active tooltips from the map
   */
  clearToolTip() {
    // Use global or instance tooltip
    let tooltipPopup = this.heatMap.tooltipPopup || window.tooltipPopup;
    if (tooltipPopup) {
      tooltipPopup.close();
    }
  }
}

export default TooltipManager;
