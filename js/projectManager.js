export class ProjectFile {
    constructor(name, content = '', parentPath = '') {
        this.name = name;
        this.content = content;
        this.path = parentPath ? `${parentPath}/${name}` : name;
        this.type = 'file';
        this.isUnsaved = false;
    }
}

export class ProjectFolder {
    constructor(name, parentPath = '') {
        this.name = name;
        this.path = parentPath ? `${parentPath}/${name}` : name;
        this.type = 'folder';
        this.children = [];
    }

    addChild(item) {
        this.children.push(item);
    }

    removeChild(path) {
        const index = this.children.findIndex(child => child.path === path);
        if (index !== -1) {
            this.children.splice(index, 1);
            return true;
        }
        return false;
    }

    getChild(name) {
        return this.children.find(child => child.name === name);
    }
}

export class ProjectManager {
    constructor() {
        this.rootFolder = new ProjectFolder('');
        this.openFilePath = null;
        this.fileChangeCallbacks = [];
        this.onInit = null;
        
        // Default project structure
        this.defaultProject = {
            'index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Babylon.js Project</title>\n    <style>\n        html, body {\n            width: 100%;\n            height: 100%;\n            margin: 0;\n            padding: 0;\n            overflow: hidden;\n        }\n        #renderCanvas {\n            width: 100%;\n            height: 100%;\n            touch-action: none;\n        }\n    </style>\n    <script src="https://cdn.babylonjs.com/babylon.js"></script>\n</head>\n<body>\n    <canvas id="renderCanvas"></canvas>\n    <script src="main.js"></script>\n</body>\n</html>',
            'main.js': 'window.addEventListener("DOMContentLoaded", function() {\n    const canvas = document.getElementById("renderCanvas");\n    const engine = new BABYLON.Engine(canvas, true);\n\n    // Create a basic scene\n    const createScene = function() {\n        const scene = new BABYLON.Scene(engine);\n        \n        // Camera\n        const camera = new BABYLON.ArcRotateCamera("camera", \n            Math.PI / 2, Math.PI / 2.5, 10, \n            new BABYLON.Vector3(0, 0, 0), scene);\n        camera.attachControl(canvas, true);\n        \n        // Light\n        const light = new BABYLON.HemisphericLight("light", \n            new BABYLON.Vector3(0, 1, 0), scene);\n        \n        // Sphere\n        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", \n            {diameter: 2, segments: 32}, scene);\n        \n        return scene;\n    };\n\n    const scene = createScene();\n\n    // Run render loop\n    engine.runRenderLoop(function() {\n        scene.render();\n    });\n\n    // Handle window resize\n    window.addEventListener("resize", function() {\n        engine.resize();\n    });\n});',
            'styles': {
                'main.css': 'body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n}'
            }
        };
    }

    init() {
        this.loadFromLocalStorage();
        
        if (this.rootFolder.children.length === 0) {
            this.createDefaultProject();
        }
        
        if (this.onInit) {
            this.onInit();
        }
    }

    createDefaultProject() {
        this.createProjectStructure(this.defaultProject, '');
        this.saveToLocalStorage();
    }

    createProjectStructure(structure, parentPath) {
        for (const key in structure) {
            if (typeof structure[key] === 'string') {
                // This is a file
                const file = new ProjectFile(key, structure[key], parentPath);
                this.addFileToPath(file);
            } else {
                // This is a folder
                const folderPath = parentPath ? `${parentPath}/${key}` : key;
                const folder = new ProjectFolder(key, parentPath);
                this.addFileToPath(folder);
                this.createProjectStructure(structure[key], folderPath);
            }
        }
    }

    loadFromLocalStorage() {
        try {
            const projectData = localStorage.getItem('babylonProjectFiles');
            if (projectData) {
                const parsedData = JSON.parse(projectData);
                this.rootFolder = this.deserializeFolder(parsedData);
                
                // Also load the last open file if exists
                const lastOpenFile = localStorage.getItem('babylonLastOpenFile');
                if (lastOpenFile) {
                    this.openFilePath = lastOpenFile;
                }
            }
        } catch (e) {
            console.error('Error loading project from localStorage:', e);
        }
    }

    saveToLocalStorage() {
        try {
            const serializedData = this.serializeFolder(this.rootFolder);
            localStorage.setItem('babylonProjectFiles', JSON.stringify(serializedData));
            
            // Also save the last open file
            if (this.openFilePath) {
                localStorage.setItem('babylonLastOpenFile', this.openFilePath);
            }
        } catch (e) {
            console.error('Error saving project to localStorage:', e);
        }
    }

    serializeFolder(folder) {
        const result = {
            name: folder.name,
            path: folder.path,
            type: 'folder',
            children: []
        };
        
        folder.children.forEach(child => {
            if (child.type === 'folder') {
                result.children.push(this.serializeFolder(child));
            } else {
                result.children.push({
                    name: child.name,
                    path: child.path,
                    type: 'file',
                    content: child.content,
                    isUnsaved: child.isUnsaved
                });
            }
        });
        
        return result;
    }

    deserializeFolder(data) {
        const folder = new ProjectFolder(data.name, data.path.replace(`/${data.name}`, ''));
        
        data.children.forEach(childData => {
            if (childData.type === 'folder') {
                folder.addChild(this.deserializeFolder(childData));
            } else {
                const file = new ProjectFile(
                    childData.name, 
                    childData.content, 
                    childData.path.replace(`/${childData.name}`, '')
                );
                file.isUnsaved = childData.isUnsaved || false;
                folder.addChild(file);
            }
        });
        
        return folder;
    }

    addFileToPath(file) {
        if (!file.path || file.path === '') {
            this.rootFolder.addChild(file);
            return;
        }
        
        const pathParts = file.path.split('/');
        pathParts.pop(); // Remove the filename from the path
        
        let currentFolder = this.rootFolder;
        let currentPath = '';
        
        // Navigate to the parent folder
        for (const part of pathParts) {
            if (!part) continue; // Skip empty parts
            
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            let nextFolder = currentFolder.children.find(
                child => child.type === 'folder' && child.name === part
            );
            
            if (!nextFolder) {
                nextFolder = new ProjectFolder(part, currentPath.replace(`/${part}`, ''));
                currentFolder.addChild(nextFolder);
            }
            
            currentFolder = nextFolder;
        }
        
        // Add the file to the parent folder
        currentFolder.addChild(file);
    }

    getFileByPath(path) {
        if (!path) return null;
        
        const pathParts = path.split('/');
        let currentItem = this.rootFolder;
        
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (!part) continue; // Skip empty parts
            
            if (i === pathParts.length - 1) {
                // Last part is the filename
                const file = currentItem.children.find(child => child.name === part);
                return file || null;
            } else {
                // Navigate to next folder
                const folder = currentItem.children.find(
                    child => child.type === 'folder' && child.name === part
                );
                
                if (!folder) return null;
                currentItem = folder;
            }
        }
        
        return null;
    }

    createFile(name, parentPath = '') {
        if (!name) return null;
        
        // Determine content based on file extension
        let content = '';
        const extension = name.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'js':
                content = '// JavaScript code\n';
                break;
            case 'html':
                content = '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>';
                break;
            case 'css':
                content = '/* CSS Styles */\n';
                break;
            case 'json':
                content = '{\n    \n}';
                break;
        }
        
        const file = new ProjectFile(name, content, parentPath);
        this.addFileToPath(file);
        this.saveToLocalStorage();
        
        return file;
    }

    createFolder(name, parentPath = '') {
        if (!name) return null;
        
        const folder = new ProjectFolder(name, parentPath);
        this.addFileToPath(folder);
        this.saveToLocalStorage();
        
        return folder;
    }

    deleteItem(path) {
        if (!path) return false;
        
        const pathParts = path.split('/');
        const itemName = pathParts.pop();
        const parentPath = pathParts.join('/');
        
        const parentFolder = parentPath ? this.getFileByPath(parentPath) : this.rootFolder;
        
        if (!parentFolder || parentFolder.type !== 'folder') return false;
        
        const result = parentFolder.removeChild(path);
        
        if (result) {
            this.saveToLocalStorage();
            
            // If the deleted item was the open file, clear the editor
            if (this.openFilePath === path) {
                this.openFilePath = null;
            }
        }
        
        return result;
    }

    renameItem(path, newName) {
        const item = this.getFileByPath(path);
        if (!item) return false;
        
        // Check if an item with the new name already exists in the same folder
        const pathParts = path.split('/');
        pathParts.pop();
        const parentPath = pathParts.join('/');
        const parentFolder = parentPath ? this.getFileByPath(parentPath) : this.rootFolder;
        
        if (parentFolder.getChild(newName)) {
            return false; // An item with this name already exists
        }
        
        // Update the path and name
        const oldPath = item.path;
        item.name = newName;
        
        // Update the path
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        this.updateItemPath(item, oldPath, newPath);
        
        // If this was the open file, update the open file path
        if (this.openFilePath === oldPath) {
            this.openFilePath = newPath;
        }
        
        this.saveToLocalStorage();
        return true;
    }

    updateItemPath(item, oldPath, newPath) {
        item.path = newPath;
        
        // If it's a folder, update all children paths too
        if (item.type === 'folder' && item.children) {
            item.children.forEach(child => {
                const childOldPath = child.path;
                const childNewPath = childOldPath.replace(oldPath, newPath);
                this.updateItemPath(child, childOldPath, childNewPath);
            });
        }
    }

    saveFile(path, content) {
        const file = this.getFileByPath(path);
        if (!file || file.type !== 'file') return false;
        
        file.content = content;
        file.isUnsaved = false;
        this.saveToLocalStorage();
        
        this.fileChangeCallbacks.forEach(callback => callback(file));
        
        return true;
    }

    markFileAsUnsaved(path) {
        const file = this.getFileByPath(path);
        if (!file || file.type !== 'file') return false;
        
        file.isUnsaved = true;
        this.saveToLocalStorage();
        
        this.fileChangeCallbacks.forEach(callback => callback(file));
        
        return true;
    }

    openFile(path) {
        const file = this.getFileByPath(path);
        if (!file || file.type !== 'file') return null;
        
        this.openFilePath = path;
        this.saveToLocalStorage();
        
        return file;
    }

    getOpenFile() {
        if (!this.openFilePath) return null;
        return this.getFileByPath(this.openFilePath);
    }

    onFileChange(callback) {
        if (typeof callback === 'function') {
            this.fileChangeCallbacks.push(callback);
        }
    }

    exportProject() {
        return this.serializeFolder(this.rootFolder);
    }

    importProject(data) {
        this.rootFolder = this.deserializeFolder(data);
        this.saveToLocalStorage();
    }
}