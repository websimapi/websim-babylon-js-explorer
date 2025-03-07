import { getDefaultCode } from './editor.js';
import { runCode, resetView, toggleInspector } from './babylonScene.js';
import { populateAPITree, filterAPITree, exportAPIData } from './apiExtractor.js';
import { updateFileTreeView } from './projectManager.js';

export function setupEventListeners() {
    // Run Code button
    document.getElementById('runButton').addEventListener('click', function() {
        runCode();
    });
    
    // Clear button
    document.getElementById('clearButton').addEventListener('click', function() {
        if (window.confirm('Clear the current file content?')) {
            window.editor.setValue(getDefaultCode());
            if (window.currentFile) {
                window.projectFiles[window.currentFile] = getDefaultCode();
                updateFileTreeView();
            }
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
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}