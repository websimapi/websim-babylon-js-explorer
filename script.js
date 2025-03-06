// Initialize the Monaco editor and Babylon.js scene
let editor;
let scene;
let engine;
let apiData = {};

// Wait for the window to load
window.addEventListener('load', function() {
    // Initialize Monaco Editor
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        editor = monaco.editor.create(document.getElementById('codeEditor'), {
            value: getDefaultCode(),
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true
        });
    });

    // Initialize Babylon.js scene
    initBabylonScene();

    // Extract API information from all libraries
    extractAPIInfo();

    // Set up event listeners
    setupEventListeners();
});

function getDefaultCode() {
    return `// Create a simple scene with a sphere
function createScene() {
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
    
    // Create a material
    const material = new BABYLON.StandardMaterial("material", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0.5, 0.7);
    sphere.material = material;
    
    return scene;
}

// Call createScene to get our scene
const createdScene = createScene();

// Make sure to return the created scene
return createdScene;`;
}

function initBabylonScene() {
    const canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);
    
    // Create empty scene initially
    scene = new BABYLON.Scene(engine);
    
    // Create a camera for the empty scene
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    
    // Add a light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    
    // Run the render loop
    engine.runRenderLoop(function() {
        scene.render();
    });
    
    // Handle window resize
    window.addEventListener("resize", function() {
        engine.resize();
    });
}

function setupEventListeners() {
    // Run Code button
    document.getElementById('runButton').addEventListener('click', function() {
        runCode();
    });
    
    // Clear button
    document.getElementById('clearButton').addEventListener('click', function() {
        editor.setValue(getDefaultCode());
    });
    
    // Toggle Inspector button
    document.getElementById('inspectorButton').addEventListener('click', function() {
        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
        } else {
            scene.debugLayer.show();
        }
    });
    
    // Reset View button
    document.getElementById('resetViewButton').addEventListener('click', function() {
        if (scene.cameras.length > 0) {
            if (scene.cameras[0] instanceof BABYLON.ArcRotateCamera) {
                scene.cameras[0].alpha = Math.PI / 2;
                scene.cameras[0].beta = Math.PI / 2.5;
                scene.cameras[0].radius = 10;
            }
        }
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
}

function runCode() {
    try {
        // Dispose old scene
        if (scene) {
            scene.dispose();
        }
        
        // Get canvas
        const canvas = document.getElementById("renderCanvas");
        
        // Evaluate the code from the editor to create a new scene
        const createSceneFunction = new Function('engine', 'canvas', editor.getValue());
        scene = createSceneFunction(engine, canvas);
        
        // Check if the scene was created correctly
        if (!scene || !(scene instanceof BABYLON.Scene)) {
            throw new Error("The code did not return a valid Babylon.js Scene.");
        }
        
        // Update the render loop
        engine.runRenderLoop(function() {
            scene.render();
        });
        
        // Show success message
        console.log("Scene created successfully");
    } catch (error) {
        console.error("Error running code:", error);
        // Create a simple scene with an error message
        scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0), scene);
        camera.attachControl(canvas, true);
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        
        // Display error using GUI
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const errorText = new BABYLON.GUI.TextBlock();
        errorText.text = "Error: " + error.message;
        errorText.color = "red";
        errorText.fontSize = 24;
        advancedTexture.addControl(errorText);
    }
}

function extractAPIInfo() {
    // Core Babylon.js
    apiData.BABYLON = extractObjectMethods(BABYLON);
    
    // GUI
    if (BABYLON.GUI) {
        apiData["BABYLON.GUI"] = extractObjectMethods(BABYLON.GUI);
    }
    
    // Materials
    const materials = {};
    for (const key in BABYLON) {
        if (key.includes("Material") || key.includes("Texture")) {
            materials[key] = BABYLON[key];
        }
    }
    apiData["BABYLON.Materials"] = extractObjectMethods(materials);
    
    // Post Processes
    const postProcesses = {};
    for (const key in BABYLON) {
        if (key.includes("PostProcess") || key.includes("Effect")) {
            postProcesses[key] = BABYLON[key];
        }
    }
    apiData["BABYLON.PostProcesses"] = extractObjectMethods(postProcesses);
    
    // Procedural Textures
    const proceduralTextures = {};
    if (BABYLON.ProceduralTexture) {
        for (const key in BABYLON) {
            if (key.includes("ProceduralTexture")) {
                proceduralTextures[key] = BABYLON[key];
            }
        }
    }
    apiData["BABYLON.ProceduralTextures"] = extractObjectMethods(proceduralTextures);
    
    // Serializers
    const serializers = {};
    if (BABYLON.SceneSerializer) {
        serializers.SceneSerializer = BABYLON.SceneSerializer;
        if (BABYLON.GLTFFileLoader) {
            serializers.GLTFFileLoader = BABYLON.GLTFFileLoader;
        }
    }
    apiData["BABYLON.Serializers"] = extractObjectMethods(serializers);
    
    // Populate the initial API tree
    populateAPITree("BABYLON");
}

function extractObjectMethods(obj) {
    const result = {};
    
    // Handle null or undefined
    if (!obj) return result;
    
    // Properties and methods directly on the object
    Object.getOwnPropertyNames(obj).forEach(function(key) {
        if (typeof obj[key] === 'function') {
            result[key] = { type: 'method' };
        } else if (key !== 'prototype') {
            result[key] = { type: 'property', value: typeof obj[key] };
        }
    });
    
    // Look for class constructors (properties that are functions)
    for (const key in obj) {
        if (typeof obj[key] === 'function') {
            // This is likely a class or constructor function
            result[key] = { type: 'class' };
            
            // Check for static methods and properties
            extractStaticMembers(obj[key], result[key]);
            
            // Check for prototype methods and properties
            if (obj[key].prototype) {
                result[key].prototype = {};
                extractPrototypeMembers(obj[key].prototype, result[key].prototype);
            }
        }
    }
    
    return result;
}

function extractStaticMembers(classObj, result) {
    result.static = {};
    Object.getOwnPropertyNames(classObj).forEach(function(key) {
        if (key !== 'prototype' && key !== 'length' && key !== 'name' && key !== 'caller' && key !== 'callee' && key !== 'arguments') {
            if (typeof classObj[key] === 'function') {
                result.static[key] = { type: 'method' };
            } else {
                result.static[key] = { type: 'property', value: typeof classObj[key] };
            }
        }
    });
}

function extractPrototypeMembers(prototype, result) {
    Object.getOwnPropertyNames(prototype).forEach(function(key) {
        if (key !== 'constructor') {
            const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
            if (descriptor && typeof descriptor.value === 'function') {
                result[key] = { type: 'method' };
            } else {
                result[key] = { type: 'property' };
            }
        }
    });
}

function populateAPITree(namespace) {
    const apiTree = document.getElementById('apiTree');
    apiTree.innerHTML = '';
    
    const data = apiData[namespace];
    if (!data) return;
    
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();
    
    sortedKeys.forEach(key => {
        const item = data[key];
        const li = document.createElement('li');
        const div = document.createElement('div');
        div.className = `api-tree-item ${item.type}`;
        div.textContent = key;
        div.setAttribute('data-type', item.type);
        
        // Add click handler to insert code
        div.addEventListener('click', function() {
            insertCodeSnippet(namespace, key, item.type);
        });
        
        li.appendChild(div);
        
        // If it's a class, add collapsible section for static and prototype members
        if (item.type === 'class') {
            const ul = document.createElement('ul');
            ul.style.marginLeft = '20px';
            ul.style.display = 'none';
            
            // Add static members
            if (item.static) {
                Object.keys(item.static).sort().forEach(staticKey => {
                    const staticItem = item.static[staticKey];
                    const staticLi = document.createElement('li');
                    const staticDiv = document.createElement('div');
                    staticDiv.className = `api-tree-item ${staticItem.type}`;
                    staticDiv.textContent = `${staticKey} (static)`;
                    staticDiv.setAttribute('data-type', staticItem.type);
                    staticDiv.addEventListener('click', function(e) {
                        e.stopPropagation();
                        insertCodeSnippet(namespace, `${key}.${staticKey}`, staticItem.type);
                    });
                    staticLi.appendChild(staticDiv);
                    ul.appendChild(staticLi);
                });
            }
            
            // Add prototype members
            if (item.prototype) {
                Object.keys(item.prototype).sort().forEach(protoKey => {
                    const protoItem = item.prototype[protoKey];
                    const protoLi = document.createElement('li');
                    const protoDiv = document.createElement('div');
                    protoDiv.className = `api-tree-item ${protoItem.type}`;
                    protoDiv.textContent = `${protoKey} (instance)`;
                    protoDiv.setAttribute('data-type', protoItem.type);
                    protoDiv.addEventListener('click', function(e) {
                        e.stopPropagation();
                        insertCodeSnippet(namespace, `${key}.prototype.${protoKey}`, protoItem.type);
                    });
                    protoLi.appendChild(protoDiv);
                    ul.appendChild(protoLi);
                });
            }
            
            li.appendChild(ul);
            
            // Toggle visibility of members
            div.addEventListener('click', function(e) {
                e.stopPropagation();
                ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        apiTree.appendChild(li);
    });
}

function filterAPITree(searchText) {
    const items = document.querySelectorAll('.api-tree-item');
    items.forEach(item => {
        const parent = item.parentElement;
        if (item.textContent.toLowerCase().includes(searchText)) {
            parent.style.display = 'block';
            
            // If it's within a collapsed list, make sure parent is also visible
            let ancestor = parent.parentElement;
            while (ancestor && ancestor.tagName === 'UL') {
                ancestor.style.display = 'block';
                ancestor = ancestor.parentElement.parentElement;
            }
        } else {
            // Only hide if it doesn't have visible children
            const subList = item.nextElementSibling;
            let hasVisibleChildren = false;
            
            if (subList && subList.tagName === 'UL') {
                const subItems = subList.querySelectorAll('li');
                subItems.forEach(subItem => {
                    if (subItem.style.display !== 'none') {
                        hasVisibleChildren = true;
                    }
                });
            }
            
            if (!hasVisibleChildren) {
                parent.style.display = 'none';
            }
        }
    });
}

function insertCodeSnippet(namespace, key, type) {
    let snippet = '';
    
    if (type === 'method') {
        snippet = `${key}()`;
    } else if (type === 'property') {
        snippet = key;
    } else if (type === 'class') {
        snippet = `new ${key}()`;
    }
    
    editor.trigger('keyboard', 'type', {
        text: snippet
    });
    
    // Focus the editor
    editor.focus();
}

