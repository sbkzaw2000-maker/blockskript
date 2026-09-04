const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let localAiReady;

const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

function ollamaExecutable() {
  if (process.platform !== 'win32') return 'ollama';

  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe'),
    path.join(process.env.ProgramFiles || '', 'Ollama', 'ollama.exe')
  ];

  return candidates.find(candidate => fs.existsSync(candidate)) || 'ollama';
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        downloadFile(response.headers.location, destination).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Nie udało się pobrać Ollama (${response.statusCode}).`));
        return;
      }

      const file = fs.createWriteStream(destination);
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', error => {
        file.destroy();
        reject(error);
      });
    }).on('error', reject);
  });
}

function runHidden(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      windowsHide: true,
      stdio: 'ignore'
    });

    child.once('error', reject);
    child.once('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Proces Ollama zakończył się kodem ${code}.`));
    });
  });
}

async function ollamaIsRunning() {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureLocalAi() {
  if (process.platform !== 'win32' && !(await ollamaIsRunning())) {
    throw new Error('Na tym systemie uruchom Ollama ręcznie przed użyciem AI.');
  }

  let executable = ollamaExecutable();

  if (!(await ollamaIsRunning())) {
    if (process.platform === 'win32' && executable === 'ollama') {
      const installer = path.join(app.getPath('temp'), 'OllamaSetup.exe');
      await downloadFile('https://ollama.com/download/OllamaSetup.exe', installer);
      await runHidden(installer, ['/S']);
      fs.rmSync(installer, { force: true });
      executable = ollamaExecutable();
    }

    const server = spawn(executable, ['serve'], {
      detached: true,
      windowsHide: true,
      stdio: 'ignore'
    });
    server.unref();
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await ollamaIsRunning()) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const tags = await fetch(`${ollamaUrl}/api/tags`).then(response => response.json());
  const hasModel = tags.models?.some(model => model.name === ollamaModel);

  if (!hasModel) {
    await runHidden(executable, ['pull', ollamaModel]);
  }
}

function prepareLocalAi() {
  if (!localAiReady) {
    localAiReady = ensureLocalAi().catch(error => {
      localAiReady = null;
      throw error;
    });
  }
  return localAiReady;
}

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
// ASYSTENT AI
// ==========================================

ipcMain.handle('generate-ai', async (_event, request = {}) => {
  const prompt = String(request.prompt || '').trim().slice(0, 12000);

  if (!prompt) {
    return {
      ok: false,
      message: 'Wpisz opis skryptu, który ma przygotować AI.'
    };
  }

  try {
    await prepareLocalAi();

    const response = await fetch(
      process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat',
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
        stream: false,
        options: { temperature: 0.2 },
        messages: [
          {
            role: 'system',
            content: [
              'Jesteś lokalnym generatorem kodu Minecraft Skript.',
              'Twoim jedynym zadaniem jest generowanie lub poprawianie skryptów Skript.',
              'Zwracaj wyłącznie kompletny kod Skript bez markdownu, objaśnień, komentarzy i backticków.',
              'Nie odpowiadaj na pytania niezwiązane z kodem Skript.',
              'Kod ma być poprawny składniowo i kompatybilny z Minecraft 1.21+.'
            ].join(' ')
          },
          { role: 'user', content: prompt }
        ]
      })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || `Błąd Ollama (${response.status})`);
    }

    const code = data?.message?.content
      ?.replace(/^```[^\n]*\n?/i, '')
      ?.replace(/\n?```$/i, '')
      ?.trim();

    if (!code) {
      throw new Error('AI nie zwróciło kodu Skript.');
    }

    return { ok: true, code };
  } catch (error) {
    console.error('Błąd asystenta AI:', error);
    return {
      ok: false,
      message:
        error?.cause?.code === 'ECONNREFUSED'
          ? 'Ollama nie działa. Uruchom Ollama i pobierz model qwen2.5-coder:7b.'
          : error?.message || 'Nie udało się połączyć z lokalnym AI.'
    };
  }
});

// ==========================================
// START APLIKACJI
// ==========================================

app.whenReady().then(async () => {

    Menu.setApplicationMenu(null);

  createWindow();
  prepareLocalAi().catch(error => {
    console.error('Nie udało się przygotować lokalnego AI:', error.message);
  });

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