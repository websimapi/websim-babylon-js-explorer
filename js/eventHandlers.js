import { getDefaultCode } from './editor.js';
import { runCode, resetView, toggleInspector } from './babylonScene.js';
import { populateAPITree, filterAPITree, exportAPIData } from './apiExtractor.js';

export function setupEventListeners() {
    // Run Code button
    document.getElementById('runButton').addEventListener('click', function() {
        runCode();
    });
    
    // Clear button
    document.getElementById('clearButton').addEventListener('click', function() {
        window.editor.setValue(getDefaultCode());
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