// Main entry point for the application
import { initMonacoEditor } from './editor.js';
import { initBabylonScene, runCode } from './babylonScene.js';
import { extractAPIInfo, populateAPITree, filterAPITree } from './apiExtractor.js';
import { setupEventListeners } from './eventHandlers.js';
import { showNotification } from './utils.js';
import { babylonAPIData, updateAPIClasses } from './apiDataService.js';
import { initProjectManager } from './projectManager.js';

// Global variables that need to be accessed across modules
window.editor = null;
window.scene = null;
window.engine = null;
window.apiData = {};
window.babylonAPIData = babylonAPIData; // Make API data available globally
window.projectFiles = null;
window.currentFile = null;

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
    
    // Initialize project manager
    initProjectManager();
    
    // Extract API information from all libraries
    extractAPIInfo();
    
    // Update API classes data
    updateAPIClasses(classesData);
    
    // Set up event listeners
    setupEventListeners();
});