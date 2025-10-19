const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fetch = require('node-fetch');

let mainWindow;
let accessToken = ''; // you'll pass this from auth or .env

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// every 5 seconds, get the current Spotify track
setInterval(async () => {
  if (!accessToken) return;

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (res.status === 204) return; // no track playing

    const data = await res.json();

    mainWindow.webContents.send('update-track', {
      name: data.item?.name,
      artist: data.item?.artists?.map(a => a.name).join(', '),
      albumArt: data.item?.album?.images[0]?.url
    });
  } catch (err) {
    console.error(err);
  }
}, 5000);
