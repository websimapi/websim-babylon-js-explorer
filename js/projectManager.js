export function initProjectManager() {
    // Create initial project structure
    if (!window.projectFiles) {
        window.projectFiles = {
            'main.js': getDefaultMainScript(),
            'scene.js': getDefaultSceneScript(),
            'materials.js': getDefaultMaterialsScript(),
            'helpers.js': getDefaultHelpersScript()
        };
        
        window.currentFile = 'scene.js';
    }
    
    // Populate the file tree
    updateFileTreeView();
    
    // Set up event listeners
    document.getElementById('addFileButton').addEventListener('click', addNewFile);
    document.getElementById('renameFileButton').addEventListener('click', renameSelectedFile);
    document.getElementById('deleteFileButton').addEventListener('click', deleteSelectedFile);
}

export function updateFileTreeView() {
    const fileTree = document.getElementById('fileTree');
    fileTree.innerHTML = '';
    
    Object.keys(window.projectFiles).sort().forEach(filename => {
        const li = document.createElement('li');
        li.className = 'file-item';
        if (filename === window.currentFile) {
            li.classList.add('active');
        }
        
        li.textContent = filename;
        li.setAttribute('data-filename', filename);
        
        li.addEventListener('click', () => {
            // Save current file content before switching
            if (window.currentFile) {
                window.projectFiles[window.currentFile] = window.editor.getValue();
            }
            
            // Switch to the selected file
            selectFile(filename);
        });
        
        fileTree.appendChild(li);
    });
}

function selectFile(filename) {
    // Update UI
    document.querySelectorAll('.file-item').forEach(el => {
        el.classList.remove('active');
    });
    
    const fileEl = document.querySelector(`.file-item[data-filename="${filename}"]`);
    if (fileEl) {
        fileEl.classList.add('active');
    }
    
    // Load file content to editor
    window.currentFile = filename;
    window.editor.setValue(window.projectFiles[filename]);
    
    // Update title
    document.getElementById('currentFileName').textContent = filename;
}

function addNewFile() {
    const filename = prompt('Enter new file name (e.g. utils.js):', 'new-file.js');
    if (filename && !window.projectFiles[filename]) {
        // Save current file
        window.projectFiles[window.currentFile] = window.editor.getValue();
        
        // Create new file with template
        window.projectFiles[filename] = getEmptyFileTemplate();
        
        // Update tree and switch to new file
        updateFileTreeView();
        selectFile(filename);
    } else if (window.projectFiles[filename]) {
        alert('A file with this name already exists.');
    }
}

function renameSelectedFile() {
    if (!window.currentFile) return;
    
    const newFilename = prompt('Enter new name for ' + window.currentFile + ':', window.currentFile);
    if (newFilename && newFilename !== window.currentFile && !window.projectFiles[newFilename]) {
        // Save current content
        const content = window.editor.getValue();
        
        // Create new file with the same content
        window.projectFiles[newFilename] = content;
        
        // Delete old file
        delete window.projectFiles[window.currentFile];
        
        // Update tree and switch to renamed file
        window.currentFile = newFilename;
        updateFileTreeView();
        selectFile(newFilename);
    } else if (window.projectFiles[newFilename] && newFilename !== window.currentFile) {
        alert('A file with this name already exists.');
    }
}

function deleteSelectedFile() {
    if (!window.currentFile || Object.keys(window.projectFiles).length <= 1) {
        alert('Cannot delete the last file in the project.');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${window.currentFile}?`)) {
        // Delete the file
        delete window.projectFiles[window.currentFile];
        
        // Switch to another file
        const newCurrentFile = Object.keys(window.projectFiles)[0];
        updateFileTreeView();
        selectFile(newCurrentFile);
    }
}

// Templates for new files
function getEmptyFileTemplate() {
    return `// New file
// Add your code here
`;
}

function getDefaultMainScript() {
    return `// main.js - Entry point
// This file imports and initializes everything

import { createScene } from './scene.js';
import { setupMaterials } from './materials.js';
import { setupHelpers } from './helpers.js';

// Create our scene
const scene = createScene();

// Initialize materials
setupMaterials(scene);

// Setup helpers
setupHelpers(scene);

// Return the created scene
return scene;`;
}

function getDefaultSceneScript() {
    return `// scene.js - Scene setup and main objects

export function createScene() {
    // Create a basic Babylon Scene object
    const scene = new BABYLON.Scene(engine);
    
    // Create a camera
    const camera = new BABYLON.ArcRotateCamera("camera", 
        Math.PI / 2, Math.PI / 2.5, 10, 
        new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    
    // Create a light
    const light = new BABYLON.HemisphericLight("light", 
        new BABYLON.Vector3(0, 1, 0), scene);
    
    // Create a sphere
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", 
        {diameter: 2, segments: 32}, scene);
    
    return scene;
}`;
}

function getDefaultMaterialsScript() {
    return `// materials.js - Materials for the scene

export function setupMaterials(scene) {
    // Create a material
    const material = new BABYLON.StandardMaterial("material", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0.5, 0.7);
    
    // Find meshes to apply material to
    const sphere = scene.getMeshByName("sphere");
    if (sphere) {
        sphere.material = material;
    }
}`;
}

function getDefaultHelpersScript() {
    return `// helpers.js - Utility functions

export function setupHelpers(scene) {
    // Add axes viewer
    new BABYLON.AxesViewer(scene, 2);
    
    // Environment helper (optional)
    // new BABYLON.EnvironmentHelper({
    //     skyboxSize: 100,
    //     groundColor: new BABYLON.Color3(0.3, 0.3, 0.3)
    // }, scene);
}`;
}