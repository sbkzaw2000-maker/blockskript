const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  showAbout: () => ipcRenderer.invoke('show-about'),
  onUpdateStatus: callback => ipcRenderer.on('update-status', (_event, data) => callback(data)),
  onAppVersion: callback => ipcRenderer.on('app-version', (_event, version) => callback(version))
});
