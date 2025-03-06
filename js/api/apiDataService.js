// This service provides access to Babylon.js API data for the LLM
export const babylonAPIData = {
    methods: {
        BABYLON: {},
        "BABYLON.GUI": {},
        "BABYLON.Materials": {},
        "BABYLON.PostProcesses": {},
        "BABYLON.ProceduralTextures": {},
        "BABYLON.Serializers": {}
    },
    properties: {
        BABYLON: {
            // Full BABYLON properties data with types and values
            Debug: { type: "property", value: "object" },
            AddressMode: { type: "property", value: "object" },
            Aggregations: { type: "property", value: "object" },
            // ... and hundreds more properties
        },
        "BABYLON.GUI": {
            __esModule: { type: "property", value: "boolean" },
            HandleState: { type: "property", value: "object" },
            TextWrapping: { type: "property", value: "object" },
            name: { type: "property", value: "string" }
        },
        "BABYLON.Materials": {
            BRDFTextureTools: { type: "property", value: "object" },
            EnvironmentTextureTools: { type: "property", value: "object" },
            // ... and more material properties
        },
        "BABYLON.PostProcesses": {
            DepthOfFieldEffectBlurLevel: { type: "property", value: "object" },
            ThinDepthOfFieldEffectBlurLevel: { type: "property", value: "object" },
            // ... and more post-process properties
        },
        "BABYLON.ProceduralTextures": {},
        "BABYLON.Serializers": {}
    }
};

// Returns information about a specific property or method
export function getAPIInfo(namespace, name) {
    if (!namespace || !name) return null;
    
    if (babylonAPIData.methods[namespace] && babylonAPIData.methods[namespace][name]) {
        return {
            type: 'method',
            namespace: namespace,
            name: name,
            details: babylonAPIData.methods[namespace][name]
        };
    }
    
    if (babylonAPIData.properties[namespace] && babylonAPIData.properties[namespace][name]) {
        return {
            type: 'property',
            namespace: namespace,
            name: name,
            details: babylonAPIData.properties[namespace][name]
        };
    }
    
    return null;
}

// Search for API items by name
export function searchAPI(query) {
    if (!query) return [];
    
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Search in methods
    Object.keys(babylonAPIData.methods).forEach(namespace => {
        Object.keys(babylonAPIData.methods[namespace]).forEach(name => {
            if (name.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'method',
                    namespace: namespace,
                    name: name,
                    details: babylonAPIData.methods[namespace][name]
                });
            }
        });
    });
    
    // Search in properties
    Object.keys(babylonAPIData.properties).forEach(namespace => {
        Object.keys(babylonAPIData.properties[namespace]).forEach(name => {
            if (name.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'property',
                    namespace: namespace,
                    name: name,
                    details: babylonAPIData.properties[namespace][name]
                });
            }
        });
    });
    
    return results;
}

// Get all items from a namespace
export function getNamespaceItems(namespace) {
    if (!namespace || !babylonAPIData.properties[namespace]) return [];
    
    const results = [];
    
    // Get methods
    if (babylonAPIData.methods[namespace]) {
        Object.keys(babylonAPIData.methods[namespace]).forEach(name => {
            results.push({
                type: 'method',
                namespace: namespace,
                name: name,
                details: babylonAPIData.methods[namespace][name]
            });
        });
    }
    
    // Get properties
    Object.keys(babylonAPIData.properties[namespace]).forEach(name => {
        results.push({
            type: 'property',
            namespace: namespace,
            name: name,
            details: babylonAPIData.properties[namespace][name]
        });
    });
    
    return results;
}

// Structure the API data for use in LLM responses
export function formatAPIDataForLLM(apiData) {
    if (Array.isArray(apiData)) {
        return apiData.map(item => {
            return {
                type: item.type,
                namespace: item.namespace,
                name: item.name,
                valueType: item.details?.value || null
            };
        });
    } else if (apiData) {
        return {
            type: apiData.type,
            namespace: apiData.namespace,
            name: apiData.name,
            valueType: apiData.details?.value || null
        };
    }
    return null;
}

// Updates the babylonAPIData with classes information
export function updateAPIClasses(classesData) {
    if (!classesData) return;
    
    babylonAPIData.classes = {};
    
    // Process each namespace
    Object.keys(classesData).forEach(namespace => {
        babylonAPIData.classes[namespace] = {};
        
        // Process each class in the namespace
        Object.keys(classesData[namespace]).forEach(className => {
            babylonAPIData.classes[namespace][className] = classesData[namespace][className];
        });
    });
}

// Get class information by namespace and name
export function getClassInfo(namespace, name) {
    if (!namespace || !name || !babylonAPIData.classes || !babylonAPIData.classes[namespace]) {
        return null;
    }
    
    if (babylonAPIData.classes[namespace][name]) {
        return {
            type: 'class',
            namespace: namespace,
            name: name,
            details: babylonAPIData.classes[namespace][name]
        };
    }
    
    return null;
}

// Search for classes by name
export function searchClasses(query) {
    if (!query || !babylonAPIData.classes) return [];
    
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    Object.keys(babylonAPIData.classes).forEach(namespace => {
        Object.keys(babylonAPIData.classes[namespace]).forEach(name => {
            if (name.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'class',
                    namespace: namespace,
                    name: name,
                    details: babylonAPIData.classes[namespace][name]
                });
            }
        });
    });
    
    return results;
}

// Enhanced search that includes methods, properties and classes
export function searchAllAPIElements(query) {
    if (!query) return [];
    
    const methodResults = searchAPI(query);
    const classResults = searchClasses(query);
    
    return [...methodResults, ...classResults];
}

// Get comprehensive API data for LLM processing
export function getAPIDataForLLM(query = null) {
    let data;
    
    if (query) {
        data = searchAllAPIElements(query);
    } else {
        // Return a structured representation of the entire API
        data = {
            methods: babylonAPIData.methods,
            properties: babylonAPIData.properties,
            classes: babylonAPIData.classes
        };
    }
    
    return formatAPIDataForLLM(data);
}