export async function promptLLMForCodeRevision(code, instruction) {
    try {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert Babylon.js code assistant. Provide code revisions based on user instructions. If you want to modify specific lines, include line numbers in your response. Return only valid JSON in the format {\"revision\": \"your revised code here\", \"lineNumbers\": [start, end]} with no markdown formatting, code blocks, or additional text. If you want to modify the entire selection, omit the lineNumbers property."
                },
                {
                    role: "user",
                    content: `I need help revising this Babylon.js code:\n\n${code}\n\nInstructions: ${instruction}`
                }
            ],
            json: true
        });
        
        // Parse the JSON response to extract the code and optional line numbers
        const responseData = JSON.parse(completion.content);
        return responseData;
    } catch (error) {
        console.error("Error getting LLM suggestions:", error);
        return null;
    }
}

export function showLLMSuggestionDialog(originalCode, selectedScope, callback) {
    // Create dialog if it doesn't exist
    let dialog = document.getElementById('llmSuggestionDialog');
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'llmSuggestionDialog';
        dialog.className = 'llm-dialog';
        dialog.innerHTML = `
            <div class="llm-dialog-content">
                <h3>Request Code Revision</h3>
                <div class="llm-form">
                    <div class="llm-input-group">
                        <label for="promptInput">Describe what you want to change:</label>
                        <textarea id="promptInput" rows="3" placeholder="E.g., Optimize this loop for better performance"></textarea>
                    </div>
                    <div class="llm-buttons">
                        <button id="submitPromptBtn">Submit</button>
                        <button id="cancelPromptBtn">Cancel</button>
                    </div>
                </div>
                <div class="llm-result" style="display: none;">
                    <h4>Suggested Code Change:</h4>
                    <pre id="llmSuggestion"></pre>
                    <div class="llm-decision-buttons">
                        <button id="acceptSuggestionBtn">Accept</button>
                        <button id="declineSuggestionBtn">Decline</button>
                    </div>
                </div>
                <div class="llm-loading" style="display: none;">
                    <p>Generating suggestion...</p>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        // Set up event listeners
        document.getElementById('cancelPromptBtn').addEventListener('click', () => {
            closeDialog();
        });
        
        const submitBtn = document.getElementById('submitPromptBtn');
        
        submitBtn.addEventListener('click', async () => {
            const promptInput = document.getElementById('promptInput');
            const instruction = promptInput.value.trim();
            
            if (!instruction) {
                alert('Please enter instructions for the code revision.');
                return;
            }
            
            // Show loading state
            document.querySelector('.llm-form').style.display = 'none';
            document.querySelector('.llm-loading').style.display = 'block';
            
            // Get suggestion from LLM
            const response = await promptLLMForCodeRevision(originalCode, instruction);
            
            // Hide loading, show result
            document.querySelector('.llm-loading').style.display = 'none';
            document.querySelector('.llm-result').style.display = 'block';
            
            // Display suggestion
            document.getElementById('llmSuggestion').textContent = response?.revision || "Unable to generate suggestion";
            
            // Set up decision buttons
            document.getElementById('acceptSuggestionBtn').onclick = () => {
                if (response) {
                    callback(response.revision, true, response.lineNumbers);
                }
                closeDialog();
            };
            
            document.getElementById('declineSuggestionBtn').onclick = () => {
                callback(null, false);
                closeDialog();
            };
        });
    }
    
    // Reset dialog state
    document.querySelector('.llm-form').style.display = 'block';
    document.querySelector('.llm-result').style.display = 'none';
    document.querySelector('.llm-loading').style.display = 'none';
    document.getElementById('promptInput').value = '';
    
    // Show dialog
    dialog.style.display = 'flex';
    
    // Focus the prompt input
    setTimeout(() => document.getElementById('promptInput').focus(), 0);
    
    function closeDialog() {
        dialog.style.display = 'none';
    }
}

export function getScopeFromPosition(editor, position) {
    // Get the current model and position
    const model = editor.getModel();
    if (!model) return null;
    
    // Try to get the current scope based on brackets
    const text = model.getValue();
    const offset = model.getOffsetAt(position);
    
    // Simple scope detection - find matching brackets
    let startPos = offset;
    let endPos = offset;
    let depth = 0;
    let foundStart = false;
    
    // Search backwards for scope start
    for (let i = offset; i >= 0; i--) {
        if (text[i] === '}') depth++;
        if (text[i] === '{') {
            depth--;
            if (depth < 0) {
                startPos = i;
                foundStart = true;
                break;
            }
        }
    }
    
    // If no opening bracket found, return null
    if (!foundStart) return null;
    
    // Search forward for scope end
    depth = 0;
    for (let i = offset; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') {
            depth--;
            if (depth < 0) {
                endPos = i + 1;
                break;
            }
        }
    }
    
    // Get the scope text
    const scopeText = text.substring(startPos, endPos);
    
    return {
        text: scopeText,
        startPosition: model.getPositionAt(startPos),
        endPosition: model.getPositionAt(endPos)
    };
}