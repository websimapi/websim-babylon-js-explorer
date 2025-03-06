import { getDefaultCode } from './editor.js';
import { runCode, resetView, toggleInspector } from './babylonScene.js';
import { populateAPITree, filterAPITree, exportAPIData } from './apiExtractor.js';

export function setupEventListeners() {
    // Clear button
    document.getElementById('clearButton').addEventListener('click', function() {
        if (window.projectManager && window.projectManager.openFilePath) {
            if (confirm('Reset the current file to default code?')) {
                window.editor.setValue(getDefaultCode());
            }
        } else {
            window.editor.setValue(getDefaultCode());
        }
    });
    
    // Toggle Inspector button
    document.getElementById('inspectorButton').addEventListener('click', function() {
        toggleInspector();
    });
    
    // Reset View button
    document.getElementById('resetViewButton').addEventListener('click', function() {
        resetView();
    });
    
    // Library selector change
    document.getElementById('librarySelect').addEventListener('change', function() {
        populateAPITree(this.value);
    });
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        filterAPITree(searchText);
    });
    
    // Export API Data
    document.getElementById('exportButton').addEventListener('click', function() {
        exportAPIData();
    });
}