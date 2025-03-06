import { showLLMSuggestionDialog, getScopeFromPosition } from './llmHelper.js';

export function initMonacoEditor() {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        window.editor = monaco.editor.create(document.getElementById('codeEditor'), {
            value: getDefaultCode(),
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            contextmenu: true
        });
        
        // Add command for requesting LLM suggestion on selection
        window.editor.addAction({
            id: 'request-llm-suggestion',
            label: 'Ask AI to Revise Code',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL],
            contextMenuGroupId: 'ai',
            run: requestLLMSuggestion
        });
        
        // Add command for scope selection and LLM suggestion
        window.editor.addAction({
            id: 'request-llm-suggestion-scope',
            label: 'Ask AI to Revise Current Scope',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
            contextMenuGroupId: 'ai',
            run: requestLLMSuggestionForScope
        });
    });
}

function requestLLMSuggestion(editor) {
    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) {
        alert('Please select code to revise first');
        return;
    }
    
    const selectedText = editor.getModel().getValueInRange(selection);
    
    showLLMSuggestionDialog(selectedText, selection, (suggestion, accepted, lineNumbers) => {
        if (accepted && suggestion) {
            // If specific line numbers were provided, adjust the range accordingly
            let targetRange = selection;
            
            if (lineNumbers && lineNumbers.length === 2) {
                const model = editor.getModel();
                const startLine = selection.startLineNumber + lineNumbers[0] - 1;
                const endLine = selection.startLineNumber + lineNumbers[1] - 1;
                
                // Get the start and end positions for the specified lines
                const startColumn = 1;
                const endColumn = model.getLineMaxColumn(endLine);
                
                targetRange = new monaco.Range(
                    startLine,
                    startColumn,
                    endLine,
                    endColumn
                );
            }
            
            editor.executeEdits('llm-suggestion', [
                {
                    range: targetRange,
                    text: suggestion
                }
            ]);
        }
    });
}

function requestLLMSuggestionForScope(editor) {
    const position = editor.getPosition();
    const scope = getScopeFromPosition(editor, position);
    
    if (!scope) {
        alert('Could not detect a code scope at the cursor position. Please place cursor inside a function or block.');
        return;
    }
    
    const range = new monaco.Range(
        scope.startPosition.lineNumber,
        scope.startPosition.column,
        scope.endPosition.lineNumber,
        scope.endPosition.column
    );
    
    showLLMSuggestionDialog(scope.text, range, (suggestion, accepted, lineNumbers) => {
        if (accepted && suggestion) {
            // If specific line numbers were provided, adjust the range accordingly
            let targetRange = range;
            
            if (lineNumbers && lineNumbers.length === 2) {
                const model = editor.getModel();
                const startLine = range.startLineNumber + lineNumbers[0] - 1;
                const endLine = range.startLineNumber + lineNumbers[1] - 1;
                
                // Get the start and end positions for the specified lines
                const startColumn = 1;
                const endColumn = model.getLineMaxColumn(endLine);
                
                targetRange = new monaco.Range(
                    startLine,
                    startColumn,
                    endLine,
                    endColumn
                );
            }
            
            editor.executeEdits('llm-suggestion', [
                {
                    range: targetRange,
                    text: suggestion
                }
            ]);
        }
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