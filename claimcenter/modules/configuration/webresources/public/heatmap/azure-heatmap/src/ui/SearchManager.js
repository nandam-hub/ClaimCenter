/**
 * SearchManager.js
 * Handles search functionality and drawing interactions for Azure HeatMap
 */
import { digits5 } from "../utils/utils.js";

class SearchManager {
  constructor(heatMapInstance) {
    this.heatMap = heatMapInstance;
  }

  /**
   * Handles drawing mode changes
   * Clears the map and drawing canvas when entering drawing mode
   * @param {Event} e - The drawing mode change event
   */
  handleDrawingModeChanged(e) {
    // Only clear when entering draw mode
    if (e && typeof e === "string" && e.startsWith("draw")) {
      try {
        // 1. Clear the drawing manager source
        if (
          this.heatMap.drawingManager &&
          this.heatMap.drawingManager.getSource
        ) {
          this.heatMap.drawingManager.getSource().clear();
        }

        // 2. Clear application data source
        if (this.heatMap.drawingDataSource) {
          this.heatMap.drawingDataSource.clear();
        }

        // 3. Set all layer opacities to 0
        if (
          this.heatMap.drawingManager &&
          this.heatMap.drawingManager.getLayers
        ) {
          const layers = this.heatMap.drawingManager.getLayers();
          if (layers) {
            if (layers.polygonLayer) {
              layers.polygonLayer.setOptions({
                fillOpacity: 0,
                strokeColor:
                  typeof window.selectionColor === "string"
                    ? window.selectionColor
                    : "rgb(19, 20, 19)",
              });
            }

            if (layers.polygonOutlineLayer) {
              layers.polygonOutlineLayer.setOptions({
                opacity: 0,
                strokeColor:
                  typeof window.selectionColor === "string"
                    ? window.selectionColor
                    : "rgb(0, 7, 0)",
              });
            }
          }
        }

        // 4. Reset global selection points
        window.selectionPoint1 = null;
        window.selectionPoint2 = null;

        // 5. Clear the AOI data source and reset AOI points
        if (this.heatMap.aoiDataSource) {
          this.heatMap.aoiDataSource.clear();
        }

        // 6. Clear any existing tooltip
        if (this.heatMap.tooltipManager) {
          this.heatMap.tooltipManager.clearToolTip();
        }
      } catch (error) {
        console.error("Error clearing drawing canvas:", error);
      }
    } else if (e && e.drawingMode) {
      // Fallback for object-based events
      // Clear any existing tooltip
      if (this.heatMap.tooltipManager) {
        this.heatMap.tooltipManager.clearToolTip();
      }

      // Clear the drawing data source
      if (this.heatMap.drawingDataSource) {
        this.heatMap.drawingDataSource.clear();
      }

      // Reset global selection points
      window.selectionPoint1 = null;
      window.selectionPoint2 = null;

      // Clear the AOI data source and reset AOI points
      if (this.heatMap.aoiDataSource) {
        this.heatMap.aoiDataSource.clear();
      }

      // Clear the AOI polygon layer
      if (this.heatMap.aoiPolygonLayer) {
        this.heatMap.aoiPolygonLayer.setOptions({ opacity: 0 });
      }
    }
  }

  /**
   * Handles drawing completion
   * @param {Object} e - The drawing complete event
   */
  handleDrawingComplete(e) {
    // Exit drawing mode
    if (this.heatMap.drawingManager) {
      this.heatMap.drawingManager.setOptions({ mode: "idle" });
    }

    // Handle both original and new event formats
    let coordinates = null;

    // Check for original format
    if (e && e.data && e.data.geometry && e.data.geometry.coordinates) {
      // Original format
      coordinates = e.data.geometry.coordinates[0];
    }
    // Check for atlas.drawing format
    else if (e && e.drawing && e.drawing.getCoordinates) {
      coordinates = e.drawing.getCoordinates()[0];
    }

    if (coordinates && coordinates.length) {
      // Clear any tooltips that might be showing
      if (this.heatMap.tooltipManager) {
        this.heatMap.tooltipManager.clearToolTip();
      }

      // Add the shape to the drawing data source (e itself is the shape or e.drawing)
      if (e.data) {
        this.heatMap.drawingDataSource.add(e);
      } else if (e.drawing) {
        this.heatMap.drawingDataSource.add(e.drawing);
      }

      // Calculate the bounding box from the coordinates
      // For a rectangle, we need the min/max longitude and latitude
      let minLon = Number.MAX_VALUE;
      let minLat = Number.MAX_VALUE;
      let maxLon = -Number.MAX_VALUE;
      let maxLat = -Number.MAX_VALUE;

      // Loop through all coordinates to find min/max values
      for (let i = 0; i < coordinates.length; i++) {
        const lon = coordinates[i][0];
        const lat = coordinates[i][1];

        minLon = Math.min(minLon, lon);
        minLat = Math.min(minLat, lat);
        maxLon = Math.max(maxLon, lon);
        maxLat = Math.max(maxLat, lat);
      }

      // Set global selection point variables
      window.selectionPoint1 = {
        longitude: minLon,
        latitude: maxLat, // Northwest point
      };
      window.selectionPoint2 = {
        longitude: maxLon,
        latitude: minLat, // Southeast point
      };

      // Save the rectangle coordinates for persistence
      this.saveRectangleCoordinates();

      // Trigger search with the calculated bounds
      this.triggerSearchWithBounds(minLon, minLat, maxLon, maxLat);
    } else {
      console.warn("Drawing event doesn't match expected structure:", e);
    }
  }

  /**
   * Saves rectangle coordinates to the server for persistence
   */
  saveRectangleCoordinates() {
    if (!window.selectionPoint1 || !window.selectionPoint2) {
      console.error("Cannot save rectangle: missing selection points");
      return;
    }

    // Format coordinates to 5 decimal places for consistency as in the original
    const point1Lng = digits5(window.selectionPoint1.longitude);
    const point1Lat = digits5(window.selectionPoint1.latitude);
    const point2Lng = digits5(window.selectionPoint2.longitude);
    const point2Lat = digits5(window.selectionPoint2.latitude);

    // Create query parameters string (using same format as original)
    const queryParams =
      "?point1Lng=" +
      point1Lng +
      "&point1Lat=" +
      point1Lat +
      "&point2Lng=" +
      point2Lng +
      "&point2Lat=" +
      point2Lat;

    // Save to server
    this.heatMap.postToServer(queryParams, (messageText) => {
      // Optionally update message element with the result
      const messageElement =
        window.messageElement || this.heatMap.messageElement;
      if (messageElement && messageText) {
        messageElement.innerHTML = messageText;
      }
    });
  }

  /**
   * Triggers a search using the calculated bounds
   * @param {number} west - The western longitude (min longitude)
   * @param {number} south - The southern latitude (min latitude)
   * @param {number} east - The eastern longitude (max longitude)
   * @param {number} north - The northern latitude (max latitude)
   */
  triggerSearchWithBounds(west, south, east, north) {
    // Format for display
    const boundingBoxText =
      "North: " +
      digits5(north) +
      ", South: " +
      digits5(south) +
      ", East: " +
      digits5(east) +
      ", West: " +
      digits5(west);

    // Display the search area details
    const selectionMessage = "Searching within: " + boundingBoxText;

    // Get message element from global or heatMap
    const messageElement = window.messageElement || this.heatMap.messageElement;

    if (messageElement) {
      messageElement.innerHTML = selectionMessage;
    }

    // Create query parameters for the server - EXACTLY as in the original
    const params =
      "?point1Lat=" +
      digits5(south) + // South latitude is the first point's latitude
      "&point1Lng=" +
      digits5(west) + // West longitude is the first point's longitude
      "&point2Lat=" +
      digits5(north) + // North latitude is the second point's latitude
      "&point2Lng=" +
      digits5(east); // East longitude is the second point's longitude

    // Send the search query to the server
    this.heatMap.postToServer(params, this.handleSearchResponse.bind(this));
  }

  /**
   * Handles the search response from the server
   * @param {string} responseText - The response from the server
   */
  handleSearchResponse(responseText) {
    // Get message element from global or heatMap
    const messageElement = window.messageElement || this.heatMap.messageElement;

    // Update message element if available
    if (messageElement && responseText) {
      messageElement.innerHTML = responseText;
    }

    try {
      // Parse the response data if it's JSON formatted
      let claimData;
      if (responseText && responseText.trim().startsWith("{")) {
        claimData = JSON.parse(responseText);
        // Access the map and claimDataSource from the Azure Maps module
        const mapModule = window.azureHeatMapModule || {};
        const claimDataSource = mapModule.getClaimDataSource
          ? mapModule.getClaimDataSource()
          : this.heatMap.claimSymbolsDataSource;

        if (claimDataSource && claimData && claimData.claims) {
          // Clear existing data
          claimDataSource.clear();

          // Add points to the data source
          claimData.claims.forEach((claim) => {
            if (claim.latitude && claim.longitude) {
              // Create a point feature with properties
              const point = new atlas.data.Feature(
                new atlas.data.Point([
                  parseFloat(claim.longitude),
                  parseFloat(claim.latitude),
                ]),
                {
                  claimNumber: claim.claimNumber || "",
                  claimId: claim.claimId || "",
                  policyNumber: claim.policyNumber || "",
                  // Add any other properties from the claim object
                  title: claim.claimNumber || "Claim",
                  // Store the raw claim object for tooltip display
                  claimData: claim,
                }
              );

              // Add the point to the data source
              claimDataSource.add(point);
            }
          });
        } else {
          console.error(
            "Failed to add claims: claimDataSource not available or data format incorrect",
            {
              hasDataSource: !!claimDataSource,
              hasClaimData: !!claimData,
              hasClaimsArray: !!(claimData && claimData.claims),
            }
          );
        }
      } else {
        // Response is not JSON, treating as HTML message only
      }
    } catch (error) {
      console.error("Error processing claim data:", error);
    }

    // Refresh the Guidewire window if needed
    if (window.refreshUponSelection) {
      // Use the same refresh logic as in ClaimCenterHeatMapAzure.js
      if (
        window.parent &&
        window.parent.gw &&
        window.parent.gw.globals &&
        window.parent.gw.globals.gwUtil &&
        typeof window.parent.gw.globals.gwUtil.refresh === "function"
      ) {
        window.parent.gw.globals.gwUtil.refresh();
      } else {
        console.error(
          "Guidewire refresh function (window.parent.gw.globals.gwUtil.refresh) not found. Cannot refresh."
        );
      }
    }
  }
}

export default SearchManager;
