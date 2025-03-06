// Main entry point for the application
import { initMonacoEditor, setEditorLanguage } from './editor.js';
import { initBabylonScene, runCode } from './babylonScene.js';
import { extractAPIInfo, populateAPITree, filterAPITree } from './apiExtractor.js';
import { setupEventListeners } from './eventHandlers.js';
import { showNotification } from './utils.js';
import { babylonAPIData, updateAPIClasses } from './apiDataService.js';
import { ProjectManager } from './projectManager.js';
import { FileTreeView } from './fileTreeView.js';

// Global variables that need to be accessed across modules
window.editor = null;
window.scene = null;
window.engine = null;
window.apiData = {};
window.babylonAPIData = babylonAPIData; // Make API data available globally
window.projectManager = new ProjectManager(); // Add project manager

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
    // Initialize Project Manager
    window.projectManager.onInit = function() {
        // Initialize file tree view
        const fileTreeElement = document.getElementById('fileTree');
        window.fileTreeView = new FileTreeView(fileTreeElement, window.projectManager);
        window.fileTreeView.render();
    };
    window.projectManager.init();
    
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
    setupProjectEventListeners();
});

function setupProjectEventListeners() {
    // Handle tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${tabId}Tab`).style.display = 'flex';
        });
    });
    
    // New file button
    document.getElementById('newFileBtn').addEventListener('click', function() {
        window.fileTreeView.promptNewItem('file', '');
    });
    
    // New folder button
    document.getElementById('newFolderBtn').addEventListener('click', function() {
        window.fileTreeView.promptNewItem('folder', '');
    });
    
    // Listen for file open events
    document.addEventListener('file-opened', function(e) {
        const file = e.detail.file;
        
        // Set editor content
        if (window.editor) {
            window.editor.setValue(file.content);
            setEditorLanguage(file.name);
        }
        
        // Update document title
        document.title = `${file.name} - Babylon.js Explorer`;
    });
    
    // Listen for file close events
    document.addEventListener('file-closed', function() {
        // Clear editor
        if (window.editor) {
            window.editor.setValue('');
        }
        
        // Reset document title
        document.title = 'Babylon.js Explorer';
    });
    
    // Listen for editor content changes
    document.addEventListener('editor-content-changed', function() {
        if (!window.projectManager.openFilePath) return;
        
        window.projectManager.markFileAsUnsaved(window.projectManager.openFilePath);
        window.fileTreeView.render();
    });
    
    // Listen for editor ready event
    document.addEventListener('editor-ready', function() {
        // Load the default file if available
        const openFile = window.projectManager.getOpenFile();
        if (openFile) {
            window.editor.setValue(openFile.content);
            setEditorLanguage(openFile.name);
            document.title = `${openFile.name} - Babylon.js Explorer`;
        }
    });
    
    // Update save button to work with project files
    document.getElementById('runButton').addEventListener('click', function() {
        if (window.projectManager.openFilePath) {
            // Save the current file
            window.projectManager.saveFile(
                window.projectManager.openFilePath, 
                window.editor.getValue()
            );
            window.fileTreeView.render();
            
            // Run the code if it's a JavaScript file
            if (window.projectManager.openFilePath.endsWith('.js')) {
                runCode();
            }
        } else {
            runCode();
        }
    });
}