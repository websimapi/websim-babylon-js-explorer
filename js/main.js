// Main entry point for the application
import { initMonacoEditor } from './editor.js';
import { initBabylonScene, runCode } from './babylonScene.js';
import { extractAPIInfo, populateAPITree, filterAPITree } from './apiExtractor.js';
import { setupEventListeners } from './eventHandlers.js';
import { showNotification } from './utils.js';
import { babylonAPIData } from './apiDataService.js';

// Global variables that need to be accessed across modules
window.editor = null;
window.scene = null;
window.engine = null;
window.apiData = {};
window.babylonAPIData = babylonAPIData; // Make API data available globally

// Wait for the window to load
window.addEventListener('load', function() {
    // Initialize Monaco Editor
    initMonacoEditor();
    
    // Initialize Babylon.js scene
    initBabylonScene();
    
    // Extract API information from all libraries
    extractAPIInfo();
    
    // Set up event listeners
    setupEventListeners();
});