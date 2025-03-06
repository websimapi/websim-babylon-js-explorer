// Main entry point for the application
import { initMonacoEditor } from 'editor/editor.js';
import { initBabylonScene, runCode } from 'scene/babylonScene.js';
import { extractAPIInfo, populateAPITree, filterAPITree } from 'api/apiExtractor.js';
import { setupEventListeners } from 'core/eventHandlers.js';
import { showNotification } from './utils.js';
import { babylonAPIData, updateAPIClasses } from 'api/apiDataService.js';

// Global variables that need to be accessed across modules
window.editor = null;
window.scene = null;
window.engine = null;
window.apiData = {};
window.babylonAPIData = babylonAPIData; // Make API data available globally

// Sample classes data structure to be populated
const classesData = {
    "BABYLON": {},
    "BABYLON.GUI": {},
    "BABYLON.Materials": {},
    "BABYLON.PostProcesses": {},
    "BABYLON.ProceduralTextures": {},
    "BABYLON.Serializers": {}
};

// Wait for the window to load
window.addEventListener('load', function() {
    // Initialize Monaco Editor
    initMonacoEditor();
    
    // Initialize Babylon.js scene
    initBabylonScene();
    
    // Extract API information from all libraries
    extractAPIInfo();
    
    // Update API classes data
    updateAPIClasses(classesData);
    
    // Set up event listeners
    setupEventListeners();
});