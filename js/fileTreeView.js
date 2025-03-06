import { showNotification } from './utils.js';

export class FileTreeView {
    constructor(fileTreeElement, projectManager) {
        this.fileTreeElement = fileTreeElement;
        this.projectManager = projectManager;
        this.contextMenu = null;
        this.selectedItemPath = null;
        
        // Create context menu
        this.createContextMenu();
        
        // Setup event listeners
        document.addEventListener('click', this.handleDocumentClick.bind(this));
    }

    render() {
        // Clear the file tree
        this.fileTreeElement.innerHTML = '';
        
        // Render the root children
        const rootFolder = this.projectManager.rootFolder;
        this.renderFolder(this.fileTreeElement, rootFolder);
        
        // Mark the open file as selected
        const openFilePath = this.projectManager.openFilePath;
        if (openFilePath) {
            this.selectItemByPath(openFilePath);
        }
    }

    renderFolder(parentElement, folder) {
        // Sort children: folders first, then files - both alphabetically
        const sortedChildren = [...folder.children].sort((a, b) => {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        
        sortedChildren.forEach(child => {
            const li = document.createElement('li');
            
            if (child.type === 'folder') {
                li.innerHTML = `
                    <div class="file-tree-item" data-path="${child.path}">
                        <span class="file-icon folder-icon">📁</span>
                        <span class="file-name">${child.name}</span>
                        <span class="context-menu-trigger">⋮</span>
                    </div>
                    <ul class="folder-contents"></ul>
                `;
                
                const folderItem = li.querySelector('.file-tree-item');
                folderItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFolder(li);
                    this.selectItem(folderItem);
                });
                
                const contextTrigger = li.querySelector('.context-menu-trigger');
                contextTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showContextMenu(e, child.path);
                });
                
                const folderContents = li.querySelector('.folder-contents');
                this.renderFolder(folderContents, child);
            } else {
                // Get file icon based on extension
                const fileIconClass = this.getFileIconClass(child.name);
                
                li.innerHTML = `
                    <div class="file-tree-item" data-path="${child.path}">
                        <span class="file-icon ${fileIconClass}">📄</span>
                        <span class="file-name">${child.name}</span>
                        ${child.isUnsaved ? '<span class="unsaved-indicator"></span>' : ''}
                        <span class="context-menu-trigger">⋮</span>
                    </div>
                `;
                
                const fileItem = li.querySelector('.file-tree-item');
                fileItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectItem(fileItem);
                    this.openFile(child.path);
                });
                
                const contextTrigger = li.querySelector('.context-menu-trigger');
                contextTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showContextMenu(e, child.path);
                });
            }
            
            parentElement.appendChild(li);
        });
    }

    getFileIconClass(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'js':
                return 'file-icon-js';
            case 'html':
                return 'file-icon-html';
            case 'css':
                return 'file-icon-css';
            case 'json':
                return 'file-icon-json';
            default:
                return 'file-icon-default';
        }
    }

    toggleFolder(folderLi) {
        folderLi.classList.toggle('folder-open');
    }

    selectItem(element) {
        // Remove selection from previously selected item
        const prevSelected = this.fileTreeElement.querySelector('.file-tree-item.active');
        if (prevSelected) {
            prevSelected.classList.remove('active');
        }
        
        // Mark the new item as selected
        element.classList.add('active');
        this.selectedItemPath = element.dataset.path;
    }

    selectItemByPath(path) {
        const item = this.fileTreeElement.querySelector(`.file-tree-item[data-path="${path}"]`);
        if (item) {
            this.selectItem(item);
            
            // Make sure all parent folders are open
            let parent = item.parentElement;
            while (parent) {
                if (parent.classList.contains('folder-contents')) {
                    const folderLi = parent.parentElement;
                    folderLi.classList.add('folder-open');
                }
                parent = parent.parentElement;
            }
        }
    }

    openFile(path) {
        const file = this.projectManager.openFile(path);
        if (file) {
            // Dispatch an event to inform other components
            const event = new CustomEvent('file-opened', {
                detail: { file }
            });
            document.dispatchEvent(event);
        }
    }

    createContextMenu() {
        // Create the context menu element
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu';
        this.contextMenu.style.display = 'none';
        document.body.appendChild(this.contextMenu);
    }

    showContextMenu(event, path) {
        const item = this.projectManager.getFileByPath(path);
        if (!item) return;
        
        // Set the target path
        this.selectedItemPath = path;
        
        // Select the item
        const treeItem = event.target.closest('.file-tree-item');
        this.selectItem(treeItem);
        
        // Generate menu items based on the item type
        let menuItems = '';
        
        if (item.type === 'folder') {
            menuItems = `
                <div class="context-menu-item" data-action="new-file">New File</div>
                <div class="context-menu-item" data-action="new-folder">New Folder</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="rename">Rename</div>
                <div class="context-menu-item" data-action="delete">Delete</div>
            `;
        } else {
            menuItems = `
                <div class="context-menu-item" data-action="open">Open</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="rename">Rename</div>
                <div class="context-menu-item" data-action="delete">Delete</div>
            `;
        }
        
        this.contextMenu.innerHTML = menuItems;
        
        // Position the menu
        const rect = event.target.getBoundingClientRect();
        this.contextMenu.style.top = `${rect.bottom}px`;
        this.contextMenu.style.left = `${rect.left}px`;
        this.contextMenu.style.display = 'block';
        
        // Add event listeners to menu items
        const menuItemElements = this.contextMenu.querySelectorAll('.context-menu-item');
        menuItemElements.forEach(item => {
            item.addEventListener('click', this.handleContextMenuAction.bind(this));
        });
        
        event.stopPropagation();
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    }

    handleDocumentClick() {
        this.hideContextMenu();
    }

    handleContextMenuAction(event) {
        const action = event.target.dataset.action;
        const path = this.selectedItemPath;
        const item = this.projectManager.getFileByPath(path);
        
        if (!item) {
            this.hideContextMenu();
            return;
        }
        
        switch (action) {
            case 'open':
                this.openFile(path);
                break;
                
            case 'new-file':
                this.promptNewItem('file', path);
                break;
                
            case 'new-folder':
                this.promptNewItem('folder', path);
                break;
                
            case 'rename':
                this.promptRenameItem(path);
                break;
                
            case 'delete':
                this.confirmDeleteItem(path);
                break;
        }
        
        this.hideContextMenu();
    }

    promptNewItem(type, parentPath) {
        const title = type === 'file' ? 'New File' : 'New Folder';
        const placeholder = type === 'file' ? 'filename.js' : 'folder-name';
        
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog';
        dialog.innerHTML = `
            <div class="file-dialog-content">
                <h3>${title}</h3>
                <div class="file-dialog-form">
                    <div class="llm-input-group">
                        <label>Name:</label>
                        <input type="text" id="newItemName" placeholder="${placeholder}">
                    </div>
                </div>
                <div class="file-dialog-buttons">
                    <button id="cancelNewItem">Cancel</button>
                    <button id="confirmNewItem">Create</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        dialog.style.display = 'flex';
        
        const nameInput = dialog.querySelector('#newItemName');
        nameInput.focus();
        
        dialog.querySelector('#cancelNewItem').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('#confirmNewItem').addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (!name) {
                showNotification('Please enter a valid name');
                return;
            }
            
            // Get the correct parent path if our selected item is a file
            let targetParentPath = parentPath;
            if (item && item.type === 'file') {
                const pathParts = parentPath.split('/');
                pathParts.pop();
                targetParentPath = pathParts.join('/');
            }
            
            let result;
            if (type === 'file') {
                result = this.projectManager.createFile(name, targetParentPath);
            } else {
                result = this.projectManager.createFolder(name, targetParentPath);
            }
            
            if (result) {
                this.render();
                if (type === 'file') {
                    this.openFile(result.path);
                }
            } else {
                showNotification(`Failed to create ${type}`);
            }
            
            document.body.removeChild(dialog);
        });
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                dialog.querySelector('#confirmNewItem').click();
            }
        });
    }

    promptRenameItem(path) {
        const item = this.projectManager.getFileByPath(path);
        if (!item) return;
        
        const treeItem = this.fileTreeElement.querySelector(`.file-tree-item[data-path="${path}"]`);
        if (!treeItem) return;
        
        const nameElement = treeItem.querySelector('.file-name');
        const originalName = nameElement.textContent;
        
        // Create an input field for renaming
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'file-rename-input';
        input.value = originalName;
        
        // Replace the name element with the input
        nameElement.parentNode.replaceChild(input, nameElement);
        input.focus();
        input.select();
        
        // Handle saving the new name
        const saveNewName = () => {
            const newName = input.value.trim();
            
            if (newName && newName !== originalName) {
                const success = this.projectManager.renameItem(path, newName);
                
                if (success) {
                    this.render();
                } else {
                    // Restore the original name
                    input.parentNode.replaceChild(nameElement, input);
                    showNotification('Failed to rename item.');
                }
            } else {
                // Restore the original name if empty or unchanged
                input.parentNode.replaceChild(nameElement, input);
            }
        };
        
        // Handle saving on blur and Enter key
        input.addEventListener('blur', saveNewName);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveNewName();
                e.preventDefault();
            }
        });
        
        // Handle canceling on Escape key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.parentNode.replaceChild(nameElement, input);
                e.preventDefault();
            }
        });
    }

    confirmDeleteItem(path) {
        const item = this.projectManager.getFileByPath(path);
        if (!item) return;
        
        const isFolder = item.type === 'folder';
        const message = isFolder 
            ? `Are you sure you want to delete the folder "${item.name}" and all its contents?`
            : `Are you sure you want to delete the file "${item.name}"?`;
        
        if (confirm(message)) {
            const success = this.projectManager.deleteItem(path);
            
            if (success) {
                this.render();
                
                // If this was the open file, clear the editor
                if (this.projectManager.openFilePath === path) {
                    // Dispatch an event to inform other components
                    const event = new CustomEvent('file-closed');
                    document.dispatchEvent(event);
                }
            } else {
                showNotification('Failed to delete item.');
            }
        }
    }
}