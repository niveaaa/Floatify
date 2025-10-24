const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fetch = require('node-fetch');
const { getLyrics } = require('./lyrics.cjs');
require('dotenv').config();

const { screen } = require('electron');

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
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 300,
    height: 550,                // more height to fit track, artist, and album art
    x: width - 320,  // near bottom-right
    y: height - 580,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  
  mainWindow.loadFile('index.html');

  // remove scrollbar artifacts
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS('body { overflow: hidden !important; }');
  });

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

    // const lyrics = await getLyrics(data.item?.name, data.item?.artists?.[0]?.name);
    // console.log(lyrics);

    if (mainWindow && mainWindow.webContents) {
      const lyrics = await getLyrics(data.item?.name, data.item?.artists?.[0]?.name);
      mainWindow.webContents.send('update-track', {
        name: data.item?.name,
        artist: data.item?.artists?.map(a => a.name).join(', '),
        albumArt: data.item?.album?.images[0]?.url,
        lyrics
      });
      //console.log(lyrics);
    }
  } catch (err) {
    console.error(err);
  }
}, 5000);
