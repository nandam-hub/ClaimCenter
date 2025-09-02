/**
 * HeatMap.js
 * Main HeatMap class for Azure Maps integration
 */
import {
  findByIDSuffix,
  logBase2,
  getCookie,
  getCsrfToken,
  getCsrfParamName,
} from "../utils/utils.js";
import MapRenderer from "./MapRenderer.js";
import TooltipManager from "../ui/TooltipManager.js";
import SearchManager from "../ui/SearchManager.js";

class HeatMap {
  static instance = null;

  constructor() {
    if (HeatMap.instance) {
      return HeatMap.instance;
    }

    HeatMap.instance = this;

    // Don't use config parameters, use global variables directly
    // These will be instance properties that reference the global variables

    // Initialize class components
    this.mapRenderer = new MapRenderer(this);
    this.tooltipManager = new TooltipManager(this);
    this.searchManager = new SearchManager(this);

    // Instance state variables
    this.width = 0;
    this.height = 0;
    this.messageElement = null;
    this.x = 0;
    this.y = 0;

    // Azure Maps specific variables (initialized in LoadMap)
    this.map = null;
    this.drawingDataSource = null;
    this.selectionPolygonLayer = null;
    this.aoiDataSource = null;
    this.aoiPolygonLayer = null;
    this.tooltipPopup = null;
    this.drawingManager = null;
    this.geolocationControl = null;
    this.claimSymbolsDataSource = null;
    this.claimSymbolLayer = null;

    // Bind methods to preserve this context
    this.onResize = this.onResize.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleGlobalMapClick = this.handleGlobalMapClick.bind(this);
    this.handleMapViewChanged = this.handleMapViewChanged.bind(this);
    this.handleDrawingModeChanged = this.handleDrawingModeChanged.bind(this);
    this.handleDrawingComplete = this.handleDrawingComplete.bind(this);
  }

  /**
   * Main method that sets up the map
   */
  LoadMap() {
    // Call global initMap function if it exists
    if (typeof initMap === "function") {
      initMap();
    }

    // Get initial setup elements using global variables
    this.messageElement =
      window.selectionMessageNodeID != null
        ? findByIDSuffix(window.selectionMessageNodeID)
        : null;

    const popupMapElement = findByIDSuffix(window.popupMapElementName);
    if (popupMapElement != null) {
      popupMapElement.onclick = () => {
        window
          .open(
            `./MapOverlay.do?map.html=iframe&mapName=${window.mapName}`,
            "popupMap",
            `width=${window.popupMapWidth},height=${window.popupMapHeight},status=yes,menubar=yes,resizable=yes`,
            true
          )
          .focus();
      };
    }

    if (window.parent.name === "") {
      window.parent.name = "plugh"; // make sure there's a window name for jumping from a claim tooltip to a claim
    }

    const loading_msg = document.getElementById("loading_msg");

    // Check if Atlas SDK is loaded
    if (typeof atlas === "undefined") {
      if (loading_msg) {
        loading_msg.textContent =
          window.cantLoadMapMessage || "Azure Maps SDK not loaded.";
      }
      // SDK not found error, no need for console logging
      return;
    } else if (loading_msg) {
      loading_msg.parentNode.removeChild(loading_msg);
    }

    this.getMapSize();

    // Adjust zoom based on window size when first loaded
    if (window.autoScale) {
      window.zoom = this.computeZoom();
    }

    // Initialize map with renderer
    this.mapRenderer.initializeMap();

    // Set up global event listeners
    this.setupEventListeners();
  }

  /**
   * Sets up global event listeners for the map and window
   */
  setupEventListeners() {
    if (window.event == null) {
      // IE and chrome have this property, but FireFox needs event handlers
      this.listen();
    }

    if (window.addEventListener) {
      window.addEventListener("resize", this.onResize, false);
      document.addEventListener("keydown", this.handleKeyDown, false);
    }

    // Handle all cleanup when the page is unloaded
    window.addEventListener("beforeunload", () => this.UnloadMap());
  }

  /**
   * Adds Firefox-specific event listeners
   */
  listen() {
    if (window.addEventListener) {
      document.addEventListener("keydown", this.handleKeyDown, false);
    }
  }

  /**
   * Handles key down events (specifically Escape)
   * @param {KeyboardEvent} e - The keydown event
   */
  handleKeyDown(e) {
    const key = e.key || e.keyCode;

    // Handle Escape key (key === 'Escape' or keyCode === 27)
    if (key === "Escape" || key === 27) {
      // Clear tooltip
      this.tooltipManager.clearToolTip();

      // Cancel drawing if drawing manager is in drawing mode
      if (this.drawingManager && this.drawingManager.getDrawingMode()) {
        this.drawingManager.setOptions({ mode: null });
      }

      e.preventDefault();
      return false;
    }
  }

  /**
   * Loads previously saved drawing
   */
  loadBeforeSavedDrawing() {
    if (
      window.selectionPoint1 &&
      window.selectionPoint2 &&
      this.drawingManager
    ) {
      const lng1 = window.selectionPoint1.longitude;
      const lat1 = window.selectionPoint1.latitude;
      const lng2 = window.selectionPoint2.longitude;
      const lat2 = window.selectionPoint2.latitude;

      const source = this.drawingManager.getSource();

      const rectangleFeature = {
        type: "Feature",
        properties: {
          subType: "Rectangle",
          color:
            typeof window.selectionColor === "string"
              ? window.selectionColor
              : "rgb(0, 15, 0)",
          strokeColor: "rgb(1, 19, 1)",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [lng1, lat1], // First corner
              [lng2, lat1], // Second corner
              [lng2, lat2], // Third corner
              [lng1, lat2], // Fourth corner
              [lng1, lat1], // Close the polygon
            ],
          ],
        },
      };

      source.add(rectangleFeature);
    }
  }

  /**
   * Unloads the map and cleans up resources
   */
  UnloadMap() {
    if (this.map && typeof this.map.dispose === "function") {
      this.map.dispose();
      this.map = null;
      this.drawingManager = null;
      this.tooltipPopup = null;
      this.selectionPolygonLayer = null;
      this.aoiPolygonLayer = null;
      this.claimSymbolLayer = null;
      this.drawingDataSource = null;
      this.aoiDataSource = null;
      this.claimSymbolsDataSource = null;
    }
  }

  /**
   * Converts point format to Azure Maps coordinate array [lon, lat]
   * @param {Object|Array} point - Point in various formats
   * @param {string} label - Debugging label for error messages
   * @returns {Array|null} - Azure Maps coordinate array [lon, lat] or null if invalid
   */
  convertToAzurePoint(point, label = "") {
    if (!point) return null;

    // Already an array in [lon, lat] format
    if (Array.isArray(point) && point.length === 2) {
      return point;
    }

    // Object with longitude/latitude properties (Bing/custom format)
    if (
      typeof point === "object" &&
      "longitude" in point &&
      "latitude" in point
    ) {
      return [point.longitude, point.latitude];
    }

    console.error(`Cannot convert ${label} to Azure point format:`, point);
    return null;
  }

  /**
   * Handles global map click events
   * @param {Object} e - The click event
   */
  handleGlobalMapClick(e) {
    this.tooltipManager.handleGlobalMapClick(e);
  }

  /**
   * Handles map view change events (zoom, pan, etc.)
   */
  handleMapViewChanged() {
    if (this.map) {
      const camera = this.map.getCamera();
      // Clear any tooltips when the map view changes
      if (this.tooltipManager) {
        this.tooltipManager.clearToolTip();
      }

      // Update stored zoom and center values
      this.updateZoom(camera.zoom);
      this.updateCenter();
    }
  }

  /**
   * Updates the center coordinates by sending them to the server
   * Saves current center coordinates for persistence across map reloads
   */
  updateCenter() {
    if (!this.map) return;

    const center = this.map.getCamera().center;
    if (!center) return;

    // Format coordinates to 5 decimal places
    const centerLat = parseFloat(center[1]).toFixed(5);
    const centerLng = parseFloat(center[0]).toFixed(5);

    // Save to server
    this.postToServer("?centerLat=" + centerLat + "&centerLng=" + centerLng);
  }

  /**
   * Updates the zoom level by sending it to the server
   * Saves current zoom level for persistence across map reloads
   * @param {number} zoomLevel - The new zoom level
   */
  updateZoom(zoomLevel) {
    if (!isNaN(zoomLevel)) {
      window.zoom = zoomLevel;

      // Convert zoom to an integer before sending to the server (as in original)
      const zoomInt = Math.floor(zoomLevel);

      // Use zoomLevel parameter name to match the original implementation
      let urlParams = `?zoomLevel=${zoomInt}`;

      // Add mapName if needed, but keep the essential parameter name consistent
      if (window.mapName) {
        urlParams += `&mapName=${window.mapName}`;
      }

      // Always save to server, as in the original implementation
      this.postToServer(urlParams);
    } else {
      console.error("Invalid zoom level:", zoomLevel);
    }
  }

  /**
   * Handles drawing mode changes
   * @param {Object} e - The drawing mode change event
   */
  handleDrawingModeChanged(e) {
    this.searchManager.handleDrawingModeChanged(e);
  }

  /**
   * Handles drawing completion
   * @param {Object} e - The drawing complete event
   */
  handleDrawingComplete(e) {
    this.searchManager.handleDrawingComplete(e);
  }

  /**
   * Gets the map container size
   */
  getMapSize() {
    const mapDiv = document.getElementById("mapDiv");
    if (mapDiv) {
      this.width = mapDiv.clientWidth;
      this.height = mapDiv.clientHeight;

      // Update global variables too for backward compatibility
      window.width = this.width;
      window.height = this.height;
    } else {
      console.error("Map container 'mapDiv' not found.");
      this.width = 0;
      this.height = 0;
    }
  }

  /**
   * Handles window resize events
   */
  onResize() {
    this.getMapSize();
  }

  /**
   * Computes the appropriate zoom level based on bounding box and window size
   * @returns {number} The calculated zoom level
   */
  computeZoom() {
    this.getMapSize();
    let _zoom;

    let minSize = -1;
    if (window._boundingBoxHeight != 0) {
      minSize =
        ((this.height - window._margin * 2) << window.MAX_ZOOM) /
        window._boundingBoxHeight;
    }

    if (window._boundingBoxWidth != 0) {
      const lngSize =
        ((this.width - window._margin * 2) << window.MAX_ZOOM) /
        window._boundingBoxWidth;
      minSize =
        window._boundingBoxHeight != 0 ? Math.min(minSize, lngSize) : lngSize;
    }

    _zoom = minSize != -1 ? logBase2(minSize) : 0;
    if (_zoom > window.MAX_ZOOM) _zoom = window.MAX_ZOOM;

    return _zoom;
  }

  /**
   * Adds a rectangle to a data source for visualization
   * @param {atlas.source.DataSource} dataSource - The data source to add to
   * @param {Array} pointA - First point [lon, lat]
   * @param {Array} pointB - Second point [lon, lat]
   */
  addRectangleToDataSource(dataSource, pointA, pointB) {
    if (!dataSource || !pointA || !pointB) {
      console.error("Cannot add rectangle: Missing data source or points.");
      return;
    }

    // Validate points
    if (
      !Array.isArray(pointA) ||
      pointA.length !== 2 ||
      !Array.isArray(pointB) ||
      pointB.length !== 2
    ) {
      console.error(
        "Invalid points format for addRectangleToDataSource. Expected [lon, lat].",
        pointA,
        pointB
      );
      return;
    }

    const lon1 = pointA[0];
    const lat1 = pointA[1];
    const lon2 = pointB[0];
    const lat2 = pointB[1];

    // Create coordinates for the rectangle polygon
    const coordinates = [
      [
        [lon1, lat1],
        [lon1, lat2],
        [lon2, lat2],
        [lon2, lat1],
        [lon1, lat1], // Close the ring
      ],
    ];

    // Create a GeoJSON Polygon feature
    const rectanglePolygon = new atlas.data.Polygon(coordinates);

    // Azure Maps expects polygon styling to be applied at the layer level
    dataSource.add(rectanglePolygon);

    // Ensure polygon layers have proper stroke settings
    if (dataSource === this.aoiDataSource && this.aoiPolygonLayer) {
      // Update AOI polygon layer options to ensure stroke is visible
      const currentOptions = this.aoiPolygonLayer.getOptions() || {};
      this.aoiPolygonLayer.setOptions({
        ...currentOptions,
        strokeWidth: 2,
        strokeThickness: 2,
      });
    } else if (
      dataSource === this.drawingDataSource &&
      this.selectionPolygonLayer
    ) {
      // Update selection polygon layer options to ensure stroke is visible
      const currentOptions = this.selectionPolygonLayer.getOptions() || {};
      this.selectionPolygonLayer.setOptions({
        ...currentOptions,
        strokeWidth: 2,
        strokeThickness: 2,
      });
    }
  }

  /**
   * Sends a POST request to the server to retrieve data
   * @param {string} urlParamString - URL parameters for the request
   * @param {Function} callback - Function to call with response data
   */
  postToServer(urlParamString, callback) {
    const request = new XMLHttpRequest();

    // Remove CSRFToken from URL parameter if it exists
    let urlWithoutCsrf = urlParamString;
    if (urlParamString.includes("CSRFToken=")) {
      // Create a new URL without the CSRFToken parameter
      const parts = urlParamString.split("&");
      urlWithoutCsrf = parts
        .filter((param) => !param.startsWith("CSRFToken="))
        .join("&");
    }

    // Construct the full URL without CSRF token
    let fullUrl = window.url + urlWithoutCsrf;

    // Add mapName if it's consistently needed and defined
    if (typeof window.mapName !== "undefined" && window.mapName) {
      fullUrl +=
        (urlWithoutCsrf.includes("?") ? "&" : "?") +
        "mapName=" +
        window.mapName;
    }

    request.open("POST", fullUrl, true); // true for asynchronous

    // Set proper content type header
    request.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );

    // Get CSRF token using our utility function
    const csrfToken = getCsrfToken();
    const csrfParamName = getCsrfParamName();

    // Define the callback function for state changes
    if (callback) {
      request.onreadystatechange = () => {
        if (request.readyState === 4) {
          // 4 = DONE
          if (request.status === 200) {
            // 200 = OK
            try {
              // Pass the response text to the callback
              callback.call(this, request.responseText);
            } catch (e) {
              console.error("Error executing postToServer callback:", e);
            }
          } else {
            console.error(
              "AJAX Error. Status:",
              request.status,
              "Response:",
              request.statusText
            );
            // Call callback with an empty string to indicate error
            try {
              callback.call(this, "");
            } catch (e) {
              console.error("Error executing postToServer error callback:", e);
            }
          }
        }
      };
    }

    // Send the request with CSRF token in the body - not as a URL parameter
    if (csrfToken) {
      request.send(csrfParamName + "=" + csrfToken);
    } else {
      // Send with a period if no CSRF token (just like in original implementation)
      request.send(".");
    }
  }

  /**
   * Handles clicks on claim number links
   * @param {string} claimNumber - The claim number to navigate to
   */
  onClaimNumberClick(claimNumber) {
    if (!claimNumber) return;

    // Create URL for claim link
    const loc = "./ClaimSummaryLink.do?claimNumber=" + claimNumber;

    // Navigate to the claim
    if (window.parent && window.parent.name === "plugh") {
      window.parent.location = loc;
    } else {
      window.open(loc, "_blank");
    }
  }
}

export default HeatMap;
