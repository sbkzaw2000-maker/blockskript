const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    minWidth: 1050,
    minHeight: 650,
    title: 'BlockSkript',
    backgroundColor: '#0b0f14',

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(
    path.join(__dirname, 'public', 'index.html')
  );

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send(
      'app-version',
      app.getVersion()
    );
  });
}

// ==========================================
// AKTUALIZACJE
// ==========================================

function sendUpdateStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', {
      status,
      ...data
    });
  }
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus('checking');
});

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus('available', {
    version: info.version
  });
});

autoUpdater.on('update-not-available', (info) => {
  sendUpdateStatus('not-available', {
    version: info.version
  });
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus('downloading', {
    percent: progress.percent
  });
});

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus('downloaded', {
    version: info.version
  });
});

autoUpdater.on('error', (error) => {
  sendUpdateStatus('error', {
    message: error?.message || 'Nieznany błąd'
  });
});

// ==========================================
// WERSJA APLIKACJI
// ==========================================

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ==========================================
// SPRAWDZANIE AKTUALIZACJI
// ==========================================

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return {
      status: 'dev',
      message: 'Aktualizacje działają po zbudowaniu aplikacji.'
    };
  }

  try {
    await autoUpdater.checkForUpdates();

    return {
      status: 'checked'
    };

  } catch (error) {
    console.error(
      'Błąd sprawdzania aktualizacji:',
      error
    );

    return {
      status: 'error',
      message:
        error?.message ||
        'Nie udało się sprawdzić aktualizacji.'
    };
  }
});

// ==========================================
// POBIERANIE AKTUALIZACJI
// ==========================================

ipcMain.handle('download-update', async () => {
  try {

    await autoUpdater.downloadUpdate();

    return {
      ok: true
    };

  } catch (error) {

    console.error(
      'Błąd pobierania aktualizacji:',
      error
    );

    return {
      ok: false,
      message:
        error?.message ||
        'Nie udało się pobrać aktualizacji.'
    };
  }
});

// ==========================================
// INSTALOWANIE AKTUALIZACJI
// ==========================================

ipcMain.handle('install-update', () => {

  if (!app.isPackaged) {
    return {
      ok: false,
      message:
        'Dostępne tylko w wersji zainstalowanej.'
    };
  }

  autoUpdater.quitAndInstall(false, true);

  return {
    ok: true
  };
});

// ==========================================
// O PROGRAMIE
// ==========================================

ipcMain.handle('show-about', async () => {

  await dialog.showMessageBox(mainWindow, {

    type: 'info',

    title: 'BlockSkript',

    message: 'BlockSkript',

    detail:
      `Kreator Skript oparty na klockach.\n` +
      `Wersja ${app.getVersion()}`
  });

});

// ==========================================
// START APLIKACJI
// ==========================================

app.whenReady().then(async () => {

    Menu.setApplicationMenu(null);

  createWindow();

  // Automatyczne sprawdzanie aktualizacji
  if (app.isPackaged) {

    try {

      await autoUpdater.checkForUpdates();

    } catch (error) {

      console.error(
        'Błąd automatycznego sprawdzania aktualizacji:',
        error
      );

    }
  }

  if (process.platform === 'darwin') {

    app.on('activate', () => {

      if (
        BrowserWindow.getAllWindows().length === 0
      ) {
        createWindow();
      }

    });

  }

});

// ==========================================
// ZAMKNIĘCIE
// ==========================================

app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit();
  }

});