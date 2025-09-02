/**
 * Azure HeatMap Module
 * Entry point for the modernized HeatMap implementation
 * Maintains backward compatibility with global variables
 */

import "./config/globals.js";
import HeatMap from "./core/HeatMap.js";
import MapRenderer from "./core/MapRenderer.js";
import TooltipManager from "./ui/TooltipManager.js";
import SearchManager from "./ui/SearchManager.js";
import * as Utils from "./utils/utils.js";

// We'll keep a reference to the heatmap instance
let heatMapInstance = null;

/**
 * Initialize the HeatMap implementation
 * This will use the global variables directly without wrapping them
 */
const initHeatMap = () => {
  // Create a new instance if it doesn't exist
  if (!heatMapInstance) {
    // Use existing globals - we're not trying to encapsulate them
    heatMapInstance = new HeatMap();

    // This will properly set HeatMap.instance for backward compatibility
    window.HeatMap.instance = heatMapInstance;
  }

  return heatMapInstance;
};

// Class-based implementation of the global HeatMap
class GlobalHeatMap {
  // Static property for singleton pattern
  static instance = null;

  constructor() {
    // If instance already exists, return it (singleton pattern)
    if (GlobalHeatMap.instance) {
      return GlobalHeatMap.instance;
    }

    // Otherwise, set this as the instance
    GlobalHeatMap.instance = this;

    // Initialize the actual HeatMap instance that we'll delegate to
    this._heatMapInstance = null;

    return this;
  }

  // Get the actual HeatMap instance (lazy initialization)
  get _instance() {
    if (!this._heatMapInstance) {
      this._heatMapInstance = initHeatMap();
    }
    return this._heatMapInstance;
  }

  LoadMap() {
    this._instance.LoadMap();
  }

  UnloadMap() {
    if (this._instance) {
      this._instance.UnloadMap();
    }
  }

  addRectangleToDataSource(dataSource, pointA, pointB) {
    if (this._instance) {
      this._instance.addRectangleToDataSource(dataSource, pointA, pointB);
    }
  }

  handleGlobalMapClick(e) {
    if (this._instance) {
      this._instance.handleGlobalMapClick(e);
    }
  }

  showToolTip(tooltipText, position) {
    if (this._instance && this._instance.tooltipManager) {
      this._instance.tooltipManager.showToolTip(tooltipText, position);
    }
  }

  getClaimTooltip(latitude, longitude) {
    if (this._instance && this._instance.tooltipManager) {
      this._instance.tooltipManager.getClaimTooltip(latitude, longitude);
    }
  }

  processPopupContent(htmlContent) {
    return Utils.processPopupContent(htmlContent);
  }

  onClaimNumberClick(claimNumber) {
    if (this._instance) {
      this._instance.onClaimNumberClick(claimNumber);
    }
  }

  handleKeyDown(e) {
    if (this._instance) {
      this._instance.handleKeyDown(e);
    }
  }

  clearToolTip() {
    if (this._instance && this._instance.tooltipManager) {
      this._instance.tooltipManager.clearToolTip();
    }
  }

  handleDrawingModeChanged(e) {
    if (this._instance) {
      this._instance.handleDrawingModeChanged(e);
    }
  }

  handleDrawingComplete(e) {
    if (this._instance) {
      this._instance.handleDrawingComplete(e);
    }
  }

  saveRectangleCoordinates() {
    if (this._instance && this._instance.searchManager) {
      this._instance.searchManager.saveRectangleCoordinates();
    }
  }

  triggerSearchWithBounds(west, south, east, north) {
    if (this._instance && this._instance.searchManager) {
      this._instance.searchManager.triggerSearchWithBounds(
        west,
        south,
        east,
        north
      );
    }
  }

  handleSearchResponse(responseText) {
    if (this._instance && this._instance.searchManager) {
      this._instance.searchManager.handleSearchResponse(responseText);
    }
  }

  postToServer(urlParamString, callback) {
    if (this._instance) {
      this._instance.postToServer(urlParamString, callback);
    }
  }

  updateZoom(zoom) {
    if (this._instance) {
      this._instance.updateZoom(zoom);
    }
  }

  /**
   * Updates the center coordinates to the server
   * Required for persisting map state
   */
  updateCenter() {
    if (this._instance) {
      this._instance.updateCenter();
    }
  }

  clip(value, min, max) {
    return Utils.clip(value, min, max);
  }

  setOpacity(el, opacity) {
    Utils.setOpacity(el, opacity);
  }

  logBase2(value) {
    return Utils.logBase2(value);
  }

  getMapSize() {
    if (this._instance) {
      return this._instance.getMapSize();
    }
  }

  onResize() {
    if (this._instance) {
      this._instance.onResize();
    }
  }

  computeZoom() {
    if (this._instance) {
      return this._instance.computeZoom();
    }
    return 0;
  }

  digits5(x) {
    return Utils.digits5(x);
  }

  findByIDSuffix(idSuffix) {
    return Utils.findByIDSuffix(idSuffix);
  }

  loadBeforeSavedDrawing() {
    if (this._instance) {
      this._instance.loadBeforeSavedDrawing();
    }
  }

  convertToAzurePoint(point, label) {
    if (this._instance) {
      return this._instance.convertToAzurePoint(point, label);
    }
    return null;
  }
}

// Assign class to window.HeatMap for backward compatibility
window.HeatMap = GlobalHeatMap;

// Initialize global heatMap instance for backward compatibility
window.heatMap = new window.HeatMap();

// Export the init function as default
export default initHeatMap;

// Export all classes and utilities
export { HeatMap, MapRenderer, TooltipManager, SearchManager, Utils };
