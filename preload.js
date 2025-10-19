const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onTrackUpdate: (callback) => ipcRenderer.on('update-track', (_, data) => callback(data))
});
