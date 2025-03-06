export function initMonacoEditor() {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        window.editor = monaco.editor.create(document.getElementById('codeEditor'), {
            value: getDefaultCode(),
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true
        });
    });
}

export function getDefaultCode() {
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

export function insertCodeSnippet(namespace, key, type) {
    let snippet = '';
    
    if (type === 'method') {
        snippet = `${key}()`;
    } else if (type === 'property') {
        snippet = key;
    } else if (type === 'class') {
        snippet = `new ${key}()`;
    }
    
    window.editor.trigger('keyboard', 'type', {
        text: snippet
    });
    
    // Focus the editor
    window.editor.focus();
}