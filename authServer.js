import express from "express";
import cors from "cors";
import open from "open";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = "http://127.0.0.1:8888/callback";

app.get("/login", (req, res) => {
    const scopes = "user-read-currently-playing user-read-playback-state";
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.search = new URLSearchParams({
        client_id,
        response_type: "code",
        redirect_uri,
        scope: scopes,
    }).toString();

    // This line actually sends you to Spotify’s login
    res.redirect(authUrl.toString());
});

let access_token = null;
let refresh_token = null;
let token_expires_in = null;

app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "http://127.0.0.1:8888/callback",
    }),
  });

  const data = await response.json();
  console.log("Initial token:", data);

  access_token = data.access_token;
  refresh_token = data.refresh_token;
  token_expires_in = data.expires_in;

  // Schedule auto-refresh 1 minute before expiry
  scheduleTokenRefresh(token_expires_in - 60);

  res.send("Authenticated! You can close this tab.");
});

// --- REFRESH LOGIC ---
async function refreshAccessToken() {
  console.log("Refreshing access token...");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    }),
  });

  const data = await response.json();
  console.log("Refreshed token:", data);

  access_token = data.access_token;
  token_expires_in = data.expires_in;

  // reschedule refresh
  scheduleTokenRefresh(token_expires_in - 60);
}

function scheduleTokenRefresh(seconds) {
  setTimeout(refreshAccessToken, seconds * 1000);
  console.log(`Scheduled next refresh in ${seconds / 60} minutes.`);
}


app.listen(8888, () => {
    console.log("Auth server running on http://127.0.0.1:8888");
    // open login page, NOT callback
    open("http://127.0.0.1:8888/login");
});

app.get("/currently-playing", async (req, res) => {
  const token = access_token;

  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    res.status(401).send("Token expired, need refresh");
    return;
  }

  const data = await response.json();
  res.json(data);
});

app.get("/refresh_token", async (req, res) => {
  const refresh_token = globalThis.spotifyRefreshToken;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    }),
  });

  const data = await response.json();
  console.log("Refreshed:", data);
  globalThis.spotifyAccessToken = data.access_token;
  res.json(data);
});

app.get('/token', (req, res) => {
  res.json({ access_token: access_token });
});
