export function extractAPIInfo() {
    // Core Babylon.js
    window.apiData.BABYLON = extractObjectMethods(BABYLON);
    
    // GUI
    if (BABYLON.GUI) {
        window.apiData["BABYLON.GUI"] = extractObjectMethods(BABYLON.GUI);
    }
    
    // Materials
    const materials = {};
    for (const key in BABYLON) {
        if (key.includes("Material") || key.includes("Texture")) {
            materials[key] = BABYLON[key];
        }
    }
    window.apiData["BABYLON.Materials"] = extractObjectMethods(materials);
    
    // Post Processes
    const postProcesses = {};
    for (const key in BABYLON) {
        if (key.includes("PostProcess") || key.includes("Effect")) {
            postProcesses[key] = BABYLON[key];
        }
    }
    window.apiData["BABYLON.PostProcesses"] = extractObjectMethods(postProcesses);
    
    // Procedural Textures
    const proceduralTextures = {};
    if (BABYLON.ProceduralTexture) {
        for (const key in BABYLON) {
            if (key.includes("ProceduralTexture")) {
                proceduralTextures[key] = BABYLON[key];
            }
        }
    }
    window.apiData["BABYLON.ProceduralTextures"] = extractObjectMethods(proceduralTextures);
    
    // Serializers
    const serializers = {};
    if (BABYLON.SceneSerializer) {
        serializers.SceneSerializer = BABYLON.SceneSerializer;
        if (BABYLON.GLTFFileLoader) {
            serializers.GLTFFileLoader = BABYLON.GLTFFileLoader;
        }
    }
    window.apiData["BABYLON.Serializers"] = extractObjectMethods(serializers);
    
    // Populate the initial API tree
    populateAPITree("BABYLON");
}

export function extractObjectMethods(obj) {
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

export function populateAPITree(namespace) {
    const apiTree = document.getElementById('apiTree');
    apiTree.innerHTML = '';
    
    const data = window.apiData[namespace];
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
            import('./editor.js').then(module => {
                module.insertCodeSnippet(namespace, key, item.type);
            });
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
                        import('./editor.js').then(module => {
                            module.insertCodeSnippet(namespace, `${key}.${staticKey}`, staticItem.type);
                        });
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
                        import('./editor.js').then(module => {
                            module.insertCodeSnippet(namespace, `${key}.prototype.${protoKey}`, protoItem.type);
                        });
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

export function filterAPITree(searchText) {
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

export function exportAPIData() {
    const exportData = JSON.stringify(window.apiData, null, 2);
    const exportArea = document.getElementById('exportArea');
    exportArea.value = exportData;
    exportArea.select();
    document.execCommand('copy');
    
    import('./utils.js').then(module => {
        module.showNotification('API data copied to clipboard!');
    });
}