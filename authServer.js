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

app.get("/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.send("Missing authorization code");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic " +
                Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirect_uri,
        }),
    });

    const data = await response.json();
    console.log(data);
    res.json(data);

    let access_token = data.access_token;
    let refresh_token = data.refresh_token;

    // Save these somewhere — e.g., in memory for now
    globalThis.spotifyAccessToken = access_token;
    globalThis.spotifyRefreshToken = refresh_token;

});

app.listen(8888, () => {
    console.log("Auth server running on http://127.0.0.1:8888");
    // open login page, NOT callback
    open("http://127.0.0.1:8888/login");
});

app.get("/currently-playing", async (req, res) => {
  const token = globalThis.spotifyAccessToken;

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
