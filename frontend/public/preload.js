const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => ipcRenderer.invoke('select-folder'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    selectFile: (startingDirectory) => ipcRenderer.invoke('select-file', startingDirectory)
}); 