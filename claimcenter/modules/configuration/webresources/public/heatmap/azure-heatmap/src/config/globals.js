/**
 * globals.js
 * This module initializes all global variables needed by the heatmap
 * These maintain compatibility with the original implementation
 */

// Initialize global variables with default values if they don't already exist
// The original script may have defined some of these already
if (typeof window.mapName === 'undefined') window.mapName = '';
if (typeof window.credential === 'undefined') window.credential = '';
if (typeof window.selectionMessageNodeID === 'undefined') window.selectionMessageNodeID = null;
if (typeof window.refreshUponSelection === 'undefined') window.refreshUponSelection = false;
if (typeof window.zoom === 'undefined') window.zoom = 4;
if (typeof window.autoScale === 'undefined') window.autoScale = false;
if (typeof window.centerLatLong === 'undefined') window.centerLatLong = null;
if (typeof window._margin === 'undefined') window._margin = 10;
if (typeof window._boundingBoxWidth === 'undefined') window._boundingBoxWidth = 0;
if (typeof window._boundingBoxHeight === 'undefined') window._boundingBoxHeight = 0;
if (typeof window.MAX_ZOOM === 'undefined') window.MAX_ZOOM = 19;
if (typeof window.haveLegendImage === 'undefined') window.haveLegendImage = false;

if (typeof window.popupMapWidth === 'undefined') window.popupMapWidth = 800;
if (typeof window.popupMapHeight === 'undefined') window.popupMapHeight = 600;
if (typeof window.popupMapElementName === 'undefined') window.popupMapElementName = 'popupMapLink';

if (typeof window.cantLoadMapMessage === 'undefined') window.cantLoadMapMessage = 'Could not load Azure Maps SDK.';

if (typeof window.selectionColor === 'undefined') window.selectionColor = 'rgba(0, 150, 255, 0.3)';
if (typeof window.selectionPoint1 === 'undefined') window.selectionPoint1 = null;
if (typeof window.selectionPoint2 === 'undefined') window.selectionPoint2 = null;

if (typeof window.areaOfInterestColor === 'undefined') window.areaOfInterestColor = 'rgba(247, 242, 242, 0.85)';
if (typeof window.areaOfInterestPoint1 === 'undefined') window.areaOfInterestPoint1 = null;
if (typeof window.areaOfInterestPoint2 === 'undefined') window.areaOfInterestPoint2 = null;

if (typeof window.map === 'undefined') window.map = null;
if (typeof window.url === 'undefined') window.url = './MapOverlay.do';
if (typeof window.height === 'undefined') window.height = 0;
if (typeof window.width === 'undefined') window.width = 0;
if (typeof window.messageElement === 'undefined') window.messageElement = null;
if (typeof window.x === 'undefined') window.x = 0;
if (typeof window.y === 'undefined') window.y = 0;

// Azure Maps specific variables
if (typeof window.drawingDataSource === 'undefined') window.drawingDataSource = null;
if (typeof window.selectionPolygonLayer === 'undefined') window.selectionPolygonLayer = null;
if (typeof window.aoiDataSource === 'undefined') window.aoiDataSource = null;
if (typeof window.aoiPolygonLayer === 'undefined') window.aoiPolygonLayer = null;
if (typeof window.tooltipPopup === 'undefined') window.tooltipPopup = null;
if (typeof window.drawingManager === 'undefined') window.drawingManager = null;
if (typeof window.geolocationControl === 'undefined') window.geolocationControl = null;

// Export functions to get/set globals if needed
export const getGlobalVariable = (name) => window[name];
export const setGlobalVariable = (name, value) => { window[name] = value; };

// Export a function to reset all globals (useful for testing)
export const resetGlobals = () => {
  window.mapName = '';
  window.credential = '';
  window.selectionMessageNodeID = null;
  window.refreshUponSelection = false;
  window.zoom = 4;
  window.autoScale = false;
  window.centerLatLong = null;
  window._margin = 10;
  window._boundingBoxWidth = 0;
  window._boundingBoxHeight = 0;
  window.MAX_ZOOM = 19;
  window.haveLegendImage = false;
  
  window.popupMapWidth = 800;
  window.popupMapHeight = 600;
  window.popupMapElementName = 'popupMapLink';
  
  window.cantLoadMapMessage = 'Could not load Azure Maps SDK.';
  
  window.selectionColor = 'rgba(0, 150, 255, 0.3)';
  window.selectionPoint1 = null;
  window.selectionPoint2 = null;
  
  window.areaOfInterestColor = 'rgba(247, 242, 242, 0.85)';
  window.areaOfInterestPoint1 = null;
  window.areaOfInterestPoint2 = null;
  
  window.map = null;
  window.url = './MapOverlay.do';
  window.height = 0;
  window.width = 0;
  window.messageElement = null;
  window.x = 0;
  window.y = 0;
  
  window.drawingDataSource = null;
  window.selectionPolygonLayer = null;
  window.aoiDataSource = null;
  window.aoiPolygonLayer = null;
  window.tooltipPopup = null;
  window.drawingManager = null;
  window.geolocationControl = null;
};
