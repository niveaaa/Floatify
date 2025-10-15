const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 420,
    height: 120,
    minWidth: 260,
    minHeight: 80,
    frame: false,               // frameless so we control look
    transparent: true,          // allows opacity and glassy look
    alwaysOnTop: true,          // overlay behavior
    resizable: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false
    }
  });

  win.loadFile('index.html');

  // Optional: show devtools during development
  // win.webContents.openDevTools({ mode: 'detach' });

  // restore to a sane default when app restarts (you can persist pos/size later)
  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// IPC handlers
ipcMain.handle('set-opacity', (_, value) => {
  if (win) win.setOpacity(value);
});

ipcMain.handle('set-ignore-mouse', (_, ignore) => {
  if (win) win.setIgnoreMouseEvents(ignore, { forward: false });
});

ipcMain.handle('minimize', () => {
  if (win) win.minimize();
});

ipcMain.handle('close', () => {
  if (win) win.close();
});

ipcMain.handle('set-position', (_, { x, y }) => {
  if (win && typeof x === 'number' && typeof y === 'number') win.setPosition(Math.round(x), Math.round(y));
});

ipcMain.handle('get-bounds', () => {
  return win ? win.getBounds() : null;
});

app.on('window-all-closed', function () {
  // keep app running in tray is a later step — for prototype, quit on close.
  if (process.platform !== 'darwin') app.quit();
});
