/**
 * colors.js
 * Centralized color configuration for the Azure heatmap
 */

// Default colors with fallbacks for backward compatibility
export const DEFAULT_COLORS = {
  // Selection rectangle
  SELECTION_FILL: "rgba(0, 150, 255, 0.3)",
  SELECTION_STROKE: "rgba(0, 150, 255, 1)",

  // Area of interest
  AOI_FILL: "rgba(247, 242, 242, 0.5)",
  AOI_STROKE: "rgb(189, 188, 188)",

  // Claim markers
  CLAIM_MARKER: "blue",
  CLAIM_MARKER_STROKE: "rgba(13, 13, 13, 0.5)",

  // Geolocation marker
  GEOLOCATION_MARKER: "#007bff",

  // Helper function to get color with fallback
  getSelectionFill: () =>
    typeof window.selectionColor === "string"
      ? window.selectionColor
      : DEFAULT_COLORS.SELECTION_FILL,

  getSelectionStroke: () =>
    typeof window.selectionColor === "string"
      ? window.selectionColor
      : DEFAULT_COLORS.SELECTION_STROKE,

  getAoiFill: () =>
    typeof window.areaOfInterestColor === "string"
      ? window.areaOfInterestColor
      : DEFAULT_COLORS.AOI_FILL,

  getAoiStroke: () => DEFAULT_COLORS.AOI_STROKE,

  getClaimMarker: () => DEFAULT_COLORS.CLAIM_MARKER,

  getClaimMarkerStroke: () => DEFAULT_COLORS.CLAIM_MARKER_STROKE,

  getGeolocationMarker: () => DEFAULT_COLORS.GEOLOCATION_MARKER,
};

export default DEFAULT_COLORS;
