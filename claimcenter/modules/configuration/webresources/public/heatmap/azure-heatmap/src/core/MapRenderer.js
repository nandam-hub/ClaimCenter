/**
 * MapRenderer.js
 * Handles map initialization and rendering for Azure Maps
 */
import { DEFAULT_COLORS } from "../config/colors.js";

class MapRenderer {
  constructor(heatMapInstance) {
    this.heatMap = heatMapInstance;
  }

  /**
   * Initializes the Azure Maps instance and sets up base layers
   */
  initializeMap() {
    // Convert center point to Azure format if needed
    const azureCenter = this.heatMap.convertToAzurePoint(
      window.centerLatLong,
      "centerLatLong"
    );

    // Default to center of US if conversion fails
    const center = azureCenter || [-98.5795, 39.8283];

    // Determine initial zoom level
    const initialZoom = window.autoScale
      ? window.zoom
      : typeof window.zoomLevel !== "undefined"
      ? window.zoomLevel
      : window.zoom;

    // Create the map instance
    this.heatMap.map = new atlas.Map("mapDiv", {
      center: center,
      zoom: initialZoom,
      authOptions: {
        authType: "subscriptionKey",
        subscriptionKey: window.credential,
      },
    });

    // Set cursor style for the map
    document.getElementById("mapDiv").style.cursor = "pointer";

    // Create the tooltip popup
    this.heatMap.tooltipPopup = new atlas.Popup({
      pixelOffset: [0, -18],
      closeButton: true,
      fillColor: "white",
      shadowColor: "gray",
      shadowBlur: 10,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      position: [0, 0],
      showPointer: true,
      pointerColor: "white",
      pointerWidth: 14,
      pointerHeight: 12,
      textWrappingWidth: 300,
      maxWidth: 300,
      contentStyle: {
        padding: '15px',
        maxWidth: '300px',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'normal'
      }
    });

    // Assign the map to the global variable for backward compatibility
    window.map = this.heatMap.map;

    // Wait for the map to be ready before adding controls and layers
    this.heatMap.map.events.add("ready", this.onMapReady.bind(this));

    // Add global event handlers
    this.heatMap.map.events.add(
      "click",
      this.heatMap.handleGlobalMapClick.bind(this.heatMap)
    );
    this.heatMap.map.events.add(
      "moveend",
      this.heatMap.handleMapViewChanged.bind(this.heatMap)
    );
    this.heatMap.map.events.add(
      "zoomend",
      this.heatMap.handleMapViewChanged.bind(this.heatMap)
    );
    this.heatMap.map.events.add(
      "dragend",
      this.heatMap.handleMapViewChanged.bind(this.heatMap)
    );
  }

  /**
   * Handler for map ready event - adds controls and data layers
   */
  onMapReady() {
    this.addMapControls();
    this.initializeDrawingTools();
    this.initializeDataSources();
    this.drawInitialShapes();

    // Load previously saved drawings
    this.heatMap.loadBeforeSavedDrawing();

    // Initial resize to ensure proper layout
    this.heatMap.onResize();
  }

  /**
   * Adds UI controls to the map
   */
  addMapControls() {
    const map = this.heatMap.map;

    // Add style control for map types
    map.controls.add(
      new atlas.control.StyleControl({
        mapStyles: "all", // Show all available map styles
      }),
      {
        position: "top-right",
      }
    );

    // Add geolocation control with color from configuration
    map.controls.add(
      new atlas.control.GeolocationControl({
        style: "auto",
        showUserLocation: true,
        trackUserLocation: false,
        updateMapCamera: true,
        markerColor: DEFAULT_COLORS.getGeolocationMarker(),
      }),
      {
        position: "top-right",
      }
    );

    // Add zoom control
    map.controls.add(new atlas.control.ZoomControl(), {
      position: "top-right",
    });
  }

  /**
   * Initializes drawing tools for selection
   */
  initializeDrawingTools() {
    // Create drawing manager with rectangle tool
    this.heatMap.drawingManager = new atlas.drawing.DrawingManager(
      this.heatMap.map,
      {
        toolbar: new atlas.control.DrawingToolbar({
          buttons: ["draw-rectangle"],
          position: "top-right",
        }),
        rectangleOptions: {
          strokeWidth: 2,
          strokeOpacity: 1,
          draggable: false,
          strokeColor: "rgb(0, 150, 0)",
          fill: false,
          fillColor: "transparent",
        },
        polygonOptions: {
          fillOpacity: 0,
          strokeWidth: 2,
          strokeOpacity: 1,
          draggable: false,
          strokeColor: "rgb(0, 150, 0)",
          fill: false,
          fillColor: "transparent",
        },
      }
    );

    // Assign to global for backward compatibility
    window.drawingManager = this.heatMap.drawingManager;

    // Set up drawing event handlers
    this.heatMap.map.events.add(
      "drawingmodechanged",
      this.heatMap.drawingManager,
      this.heatMap.handleDrawingModeChanged.bind(this.heatMap)
    );

    this.heatMap.map.events.add(
      "drawingcomplete",
      this.heatMap.drawingManager,
      this.heatMap.handleDrawingComplete.bind(this.heatMap)
    );
  }

  /**
   * Initializes data sources and layers for map visualization
   */
  initializeDataSources() {
    const map = this.heatMap.map;

    // --- SELECTION DataSource and Layer ---
    this.heatMap.drawingDataSource = new atlas.source.DataSource();
    map.sources.add(this.heatMap.drawingDataSource);

    // Use color configuration for selection polygon
    this.heatMap.selectionPolygonLayer = new atlas.layer.PolygonLayer(
      this.heatMap.drawingDataSource,
      null,
      {
        fillOpacity: 0.3, // Reduced fill opacity for drawing tool
        strokeWidth: 2,
        strokeThickness: 2,
        fill: false,
        fillColor: "transparent",
        strokeColor: "rgb(0, 150, 0)",
      }
    );
    map.layers.add(this.heatMap.selectionPolygonLayer);

    // Add a separate line layer for selection borders
    this.heatMap.selectionLineLayer = new atlas.layer.LineLayer(
      this.heatMap.drawingDataSource,
      null,
      {
        strokeWidth: 2,
        strokeDashArray: [1, 0],
        strokeOpacity: 1,
        fill: false,
        fillColor: "transparent",
        strokeColor: "rgb(0, 150, 0)",
      }
    );
    map.layers.add(this.heatMap.selectionLineLayer);

    // Assign to global for backward compatibility
    window.selectionPolygonLayer = this.heatMap.selectionPolygonLayer;

    // --- AREA OF INTEREST (AOI) DataSource and Layer ---
    this.heatMap.aoiDataSource = new atlas.source.DataSource();
    map.sources.add(this.heatMap.aoiDataSource);

    // Assign to global for backward compatibility
    window.aoiDataSource = this.heatMap.aoiDataSource;

    // --- CLAIM SYMBOLS DataSource and Layer ---
    this.heatMap.claimSymbolsDataSource = new atlas.source.DataSource();
    map.sources.add(this.heatMap.claimSymbolsDataSource);

    // Use color configuration for claim symbols
    this.heatMap.claimSymbolLayer = new atlas.layer.BubbleLayer(
      this.heatMap.claimSymbolsDataSource,
      "claimSymbolLayer",
      {
        color: DEFAULT_COLORS.getClaimMarker(),
        radius: 20,
        strokeColor: DEFAULT_COLORS.getClaimMarkerStroke(),
        strokeWidth: 3,
        filter: ["any", ["==", ["geometry-type"], "Point"]],
        opacity: 0.85,
      }
    );
    map.layers.add(this.heatMap.claimSymbolLayer);

    // --- Tile Layer for Overlay ---
    const tileLayer = new atlas.layer.TileLayer({
      tileUrl: window.url + "?tile={quadkey}.png&mapName=" + window.mapName,
      tileSize: 256,
    });
    map.layers.add(tileLayer);

    // --- AOI Polygon Layer (Highlighted Section) for Data ---
    this.heatMap.aoiPolygonLayer = new atlas.layer.PolygonLayer(
      this.heatMap.aoiDataSource,
      null,
      {
        strokeColor: DEFAULT_COLORS.getAoiStroke(),
        strokeWidth: 2,
        strokeThickness: 2,
        opacity: 0.7,
        fill: false,
        fillColor: "transparent",
      }
    );

    map.layers.add(this.heatMap.aoiPolygonLayer);

    // --- AOI Line Layer for Data ---
    this.heatMap.aoiLineLayer = new atlas.layer.LineLayer(
      this.heatMap.aoiDataSource,
      null,
      {
        strokeColor: DEFAULT_COLORS.getAoiStroke(),
        strokeWidth: 2,
        strokeDashArray: [1, 0],
        strokeOpacity: 1,
        fill: false,
        fillColor: "transparent",
      }
    );

    map.layers.add(this.heatMap.aoiLineLayer);

    // Assign to global for backward compatibility
    window.aoiPolygonLayer = this.heatMap.aoiPolygonLayer;
    window.drawingDataSource = this.heatMap.drawingDataSource;
  }

  /**
   * Draws initial shapes (AOI and Selection) if coordinates are available
   */
  drawInitialShapes() {
    // Draw selection rectangle if points exist
    const azureSelectionPoint1 = this.heatMap.convertToAzurePoint(
      window.selectionPoint1,
      "selectionPoint1"
    );

    const azureSelectionPoint2 = this.heatMap.convertToAzurePoint(
      window.selectionPoint2,
      "selectionPoint2"
    );

    if (azureSelectionPoint1 && azureSelectionPoint2) {
      this.heatMap.addRectangleToDataSource(
        this.heatMap.drawingDataSource,
        azureSelectionPoint1,
        azureSelectionPoint2
      );
    }

    // Draw area of interest rectangle if points exist
    const azureAoiPoint1 = this.heatMap.convertToAzurePoint(
      window.areaOfInterestPoint1,
      "areaOfInterestPoint1"
    );

    const azureAoiPoint2 = this.heatMap.convertToAzurePoint(
      window.areaOfInterestPoint2,
      "areaOfInterestPoint2"
    );

    if (azureAoiPoint1 && azureAoiPoint2) {
      this.heatMap.addRectangleToDataSource(
        this.heatMap.aoiDataSource,
        azureAoiPoint1,
        azureAoiPoint2
      );
    }
  }
}

export default MapRenderer;
