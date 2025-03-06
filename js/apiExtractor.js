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
    // Show export settings modal
    showExportModal();
}

function showExportModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('exportModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'exportModal';
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-modal-content">
                <h3>Export Settings</h3>
                <div class="export-options">
                    <label><input type="checkbox" id="exportMethods" checked> Methods</label>
                    <label><input type="checkbox" id="exportProperties" checked> Properties</label>
                    <label><input type="checkbox" id="exportClasses" checked> Classes</label>
                    <label><input type="checkbox" id="exportAll"> All (Override)</label>
                </div>
                <div class="export-buttons">
                    <button id="exportConfirm">Export</button>
                    <button id="exportCancel">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Set up event listeners
        document.getElementById('exportAll').addEventListener('change', function() {
            const checked = this.checked;
            document.getElementById('exportMethods').checked = checked;
            document.getElementById('exportProperties').checked = checked;
            document.getElementById('exportClasses').checked = checked;
            
            // Disable individual checkboxes if "All" is checked
            const checkboxes = document.querySelectorAll('#exportMethods, #exportProperties, #exportClasses');
            checkboxes.forEach(checkbox => {
                checkbox.disabled = checked;
            });
        });
        
        document.getElementById('exportConfirm').addEventListener('click', function() {
            const includeMethods = document.getElementById('exportMethods').checked;
            const includeProperties = document.getElementById('exportProperties').checked;
            const includeClasses = document.getElementById('exportClasses').checked;
            
            performExport(includeMethods, includeProperties, includeClasses);
            modal.style.display = 'none';
        });
        
        document.getElementById('exportCancel').addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Reset checkboxes to default state
    document.getElementById('exportMethods').checked = true;
    document.getElementById('exportMethods').disabled = false;
    document.getElementById('exportProperties').checked = true;
    document.getElementById('exportProperties').disabled = false;
    document.getElementById('exportClasses').checked = true;
    document.getElementById('exportClasses').disabled = false;
    document.getElementById('exportAll').checked = false;
    
    // Show modal
    modal.style.display = 'flex';
}

function performExport(includeMethods, includeProperties, includeClasses) {
    // Filter API data based on selected options
    const filteredData = {};
    
    for (const namespace in window.apiData) {
        filteredData[namespace] = {};
        
        for (const key in window.apiData[namespace]) {
            const item = window.apiData[namespace][key];
            
            if ((item.type === 'method' && includeMethods) || 
                (item.type === 'property' && includeProperties) || 
                (item.type === 'class' && includeClasses)) {
                
                const filteredItem = JSON.parse(JSON.stringify(item));
                
                // Filter class members if necessary
                if (item.type === 'class') {
                    // Filter static members
                    if (item.static && !includeMethods && !includeProperties) {
                        delete filteredItem.static;
                    } else if (item.static) {
                        filteredItem.static = {};
                        for (const staticKey in item.static) {
                            const staticItem = item.static[staticKey];
                            if ((staticItem.type === 'method' && includeMethods) || 
                                (staticItem.type === 'property' && includeProperties)) {
                                filteredItem.static[staticKey] = staticItem;
                            }
                        }
                    }
                    
                    // Filter prototype members
                    if (item.prototype && !includeMethods && !includeProperties) {
                        delete filteredItem.prototype;
                    } else if (item.prototype) {
                        filteredItem.prototype = {};
                        for (const protoKey in item.prototype) {
                            const protoItem = item.prototype[protoKey];
                            if ((protoItem.type === 'method' && includeMethods) || 
                                (protoItem.type === 'property' && includeProperties)) {
                                filteredItem.prototype[protoKey] = protoItem;
                            }
                        }
                    }
                }
                
                filteredData[namespace][key] = filteredItem;
            }
        }
    }
    
    // Export the filtered data
    const exportData = JSON.stringify(filteredData, null, 2);
    const exportArea = document.getElementById('exportArea');
    exportArea.value = exportData;
    exportArea.select();
    document.execCommand('copy');
    
    import('./utils.js').then(module => {
        module.showNotification('API data copied to clipboard!');
    });
}