import express from "express";
// const express = require('express');
import request from "request";
// const request = require('request');
import cors from "cors";
// const cors = require('cors');
import querystring from "querystring";
// const querystring = require('querystring');
import open from "open";
// const open = require('open');

import { configDotenv } from "dotenv";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = 'http://127.0.0.1:8888/callback';

console.log(process.env.SPOTIFY_CLIENT_ID);


const app = express();
app.use(cors());



app.get('/login', (req, res) => {
  const scope = 'user-read-playback-state user-read-currently-playing';

  const authUrl = 'https://accounts.spotify.com/authorize?' +
//   const authUrl = 'https://accounts.spotify.com/authorize?client_id=5acf13ea1c4a4f44b0f5b64467e8ba1c&response_type=code&redirect_uri=http://localhost:8888/callback&scope=user-read-playback-state%20user-read-currently-playing' +
    querystring.stringify({
      response_type: 'code',
      client_id,
      scope,
      redirect_uri
    });
  res.redirect(authUrl);
});

app.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      const refresh_token = body.refresh_token;
      res.send(`<h2>Login success!</h2><p>Access Token:</p><pre>${access_token}</pre>`);
      console.log('ACCESS TOKEN:', access_token);
      console.log('REFRESH TOKEN:', refresh_token);
    } else {
      res.send('Auth failed.');
    }
  });
});

app.listen(8888, () => {
  console.log('Auth server running on http://127.0.0.1:8888/callback');
  open('http://127.0.0.1:8888/callback');
});
