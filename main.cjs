const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fetch = require('node-fetch');

let mainWindow;

let accessToken = '';

async function updateAccessToken() {
  try {
    const res = await fetch('http://127.0.0.1:8888/token');
    const data = await res.json();
    accessToken = data.access_token;
    console.log('Access token updated.');
  } catch (err) {
    console.error('Failed to update access token:', err);
  }
}

// run once at startup, then every 55 minutes
updateAccessToken();
setInterval(updateAccessToken, 55 * 60 * 1000);


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 150,
    frame: false,
    transparent: true,         // makes the window background transparent
    alwaysOnTop: true,         // stays above other windows
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.setIgnoreMouseEvents(false); // still clickable; true makes it click-through
  mainWindow.setAlwaysOnTop(true, 'floating');
}

app.whenReady().then(createWindow);

// every 5 seconds, get the current Spotify track
setInterval(async () => {
  if (!accessToken || !mainWindow) return;

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (res.status === 204) return; // no track playing
    const data = await res.json();

    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-track', {
        name: data.item?.name,
        artist: data.item?.artists?.map(a => a.name).join(', '),
        albumArt: data.item?.album?.images[0]?.url
      });
    }
  } catch (err) {
    console.error(err);
  }
}, 5000);
