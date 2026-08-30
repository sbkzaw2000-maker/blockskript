const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    isDesktop: true,

    // Wersja aplikacji
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Aktualizacje
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),

    // Status aktualizacji
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (event, data) => {
            callback(data);
        });
    },

    // Odbieranie wersji aplikacji
    onAppVersion: (callback) => {
        ipcRenderer.on('app-version', (event, version) => {
            callback(version);
        });
    },

    // O programie
    showAbout: () => ipcRenderer.invoke('show-about')
});