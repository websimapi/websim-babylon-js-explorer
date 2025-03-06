export function initBabylonScene() {
    const canvas = document.getElementById("renderCanvas");
    window.engine = new BABYLON.Engine(canvas, true);
    
    // Create empty scene initially
    window.scene = new BABYLON.Scene(window.engine);
    
    // Create a camera for the empty scene
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0), window.scene);
    camera.attachControl(canvas, true);
    
    // Add a light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), window.scene);
    
    // Run the render loop
    window.engine.runRenderLoop(function() {
        window.scene.render();
    });
    
    // Handle window resize
    window.addEventListener("resize", function() {
        window.engine.resize();
    });
}

export function runCode() {
    try {
        // Dispose old scene
        if (window.scene) {
            window.scene.dispose();
        }
        
        // Get canvas
        const canvas = document.getElementById("renderCanvas");
        
        // Evaluate the code from the editor to create a new scene
        const createSceneFunction = new Function('engine', 'canvas', window.editor.getValue());
        window.scene = createSceneFunction(window.engine, canvas);
        
        // Check if the scene was created correctly
        if (!window.scene || !(window.scene instanceof BABYLON.Scene)) {
            throw new Error("The code did not return a valid Babylon.js Scene.");
        }
        
        // Update the render loop
        window.engine.runRenderLoop(function() {
            window.scene.render();
        });
        
        // Show success message
        console.log("Scene created successfully");
    } catch (error) {
        console.error("Error running code:", error);
        // Create a simple scene with an error message
        window.scene = new BABYLON.Scene(window.engine);
        const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0), window.scene);
        camera.attachControl(canvas, true);
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), window.scene);
        
        // Display error using GUI
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const errorText = new BABYLON.GUI.TextBlock();
        errorText.text = "Error: " + error.message;
        errorText.color = "red";
        errorText.fontSize = 24;
        advancedTexture.addControl(errorText);
    }
}

export function resetView() {
    if (window.scene.cameras.length > 0) {
        if (window.scene.cameras[0] instanceof BABYLON.ArcRotateCamera) {
            window.scene.cameras[0].alpha = Math.PI / 2;
            window.scene.cameras[0].beta = Math.PI / 2.5;
            window.scene.cameras[0].radius = 10;
        }
    }
}

export function toggleInspector() {
    if (window.scene.debugLayer.isVisible()) {
        window.scene.debugLayer.hide();
    } else {
        window.scene.debugLayer.show();
    }
}