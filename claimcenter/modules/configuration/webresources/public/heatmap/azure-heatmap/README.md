# Azure Maps Heatmap for Claim Center

A modular implementation of the Claim Center heatmap visualization using Azure Maps. This library provides an interactive map interface for visualizing claim data geographically.

## Features

- **Azure Maps Integration**: Leverages Azure Maps SDK for modern mapping capabilities
- **Interactive Visualization**: Displays claim data on a heatmap for intuitive geographical insights
- **Area Selection**: Tools for selecting regions to filter claims
- **Tooltip Display**: Detailed information about claims when hovering/clicking on the map
- **Search Functionality**: Find claims within a specific geographical boundary
- **Class-Based Architecture**: Modern class-based implementation for better maintainability
- **Backward Compatibility**: Preserves compatibility with existing ClaimCenterHeatMapAzure.js

## Project Structure

```
azure-heatmap/
├── dist/                  # Compiled outputs
│   ├── ClaimCenterHeatMapAzure.js        # Non-minified version
│   └── ClaimCenterHeatMapAzure.min.js    # Minified version for production
├── plugin/                # Plugin files to handle current location tool
├── src/                   # Source code
│   ├── config/            # Configuration
│   │   └── globals.js     # Global variables and configuration
│   ├── core/              # Core functionality
│   │   ├── HeatMap.js     # Main HeatMap implementation
│   │   └── MapRenderer.js # Azure Maps rendering and setup
│   ├── ui/                # User interface components
│   │   ├── SearchManager.js # Search functionality
│   │   └── TooltipManager.js # Tooltip and popup management
│   ├── utils/             # Utility functions
│   │   └── utils.js       # Helper functions and common utilities
│   └── index.js           # Entry point and backward compatibility
├── package.json           # Project metadata and dependencies
├── webpack.config.js      # Build configuration
└── README.md              # This file
```

## Module Structure and Responsibilities

### Core Modules

- **HeatMap.js**: Main class that orchestrates all components of the heatmap. Manages map initialization, event handling, and state. Implements a singleton pattern to ensure only one instance exists.
- **MapRenderer.js**: Handles the visualization aspects of the map, including setting up the Azure Maps instance, layers, data sources, and controls.

### UI Modules

- **TooltipManager.js**: Manages the display of tooltips and popups when users interact with map elements. Handles formatting and positioning of information bubbles.
- **SearchManager.js**: Provides functionality for searching and filtering claims based on geographical boundaries. Manages the drawing tools for area selection.

### Configuration

- **globals.js**: Sets up global variables needed for backward compatibility with the original implementation.

### Utilities

- **utils.js**: Contains utility functions used across the application, including coordinate formatting, CSRF token handling, DOM manipulation, and other helpers.

### Entry Point

- **index.js**: Exports the main functionality and provides a backward-compatible interface for legacy code. Implements a GlobalHeatMap class that delegates to the modern implementation.

## Key Implementation Details

### Map State Persistence

- The implementation correctly saves map position using `centerLat` and `centerLng` parameters
- Zoom levels are stored using the `zoomLevel` parameter and are converted to integers

### Integration with Guidewire

- Uses `window.parent.gw.globals.gwUtil.refresh()` for refreshing the page instead of `window.location.reload()`
- Properly handles CSRF token acquisition and submission for server requests

## Usage

### 1. Include the Script

Include either the minified or non-minified version in your HTML:

```html
<!-- For production -->
<script src="path/to/ClaimCenterHeatMapAzure.min.js"></script>

<!-- OR for development/debugging -->
<script src="path/to/ClaimCenterHeatMapAzure.js"></script>
```

### 2. Setup Required HTML

Create a map container in your HTML:

```html
<div id="mapDiv" style="width: 100%; height: 600px;"></div>
<div id="loading_msg">Loading map...</div>
```

### 3. Initialize the Map

Initialize the map using the global heatMap instance:

```javascript
// The global instance is automatically created and accessible as window.heatMap
window.heatMap.LoadMap();
```

## Building the Project

To build both the minified and non-minified versions:

```bash
npm run build
```

For development with auto-recompilation on changes:

```bash
npm run watch
```

For a development build with source maps:

```bash
npm run dev
```

The build output will be in the `dist/` directory.

## Notes

- The application assumes the server endpoint is `./MapOverlay.do` for data retrieval
- Global configuration variables must be set before initializing the map
- Make sure to include the Azure Maps SDK in your HTML before this library
- The code maintains backward compatibility with the original implementation while using modern JavaScript patterns
