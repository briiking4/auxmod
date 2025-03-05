import express from 'express';
import cors from 'cors';
import path from 'path';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors_proxy from 'cors-anywhere';
import axios from 'axios';
import OpenAI from "openai";
import serverless from 'serverless-http';




dotenv.config()


const __dirname = path.resolve();


var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI || 'http://localhost:3333/callback';



var stateKey = 'spotify_auth_state';

var app = express();

app.use(cors({
  origin: 'https://briiking4.github.io',  // Allow all origins (* for testing purposes)
  methods: ['GET', 'POST'],
}));

app.use(express.static(__dirname + '/build'))
   .use(cookieParser());

   app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
   app.use(express.json()); // Continue to parse JSON data


function generateRandomString(length){
   var text = '';
   var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

   for (var i = 0; i < length; i++) {
     text += possible.charAt(Math.floor(Math.random() * possible.length));
   }
   return text;
 };

 app.get('/login', function(req, res) {
   var state = generateRandomString(16);
   res.cookie(stateKey, state);

   var scope = 'streaming user-top-read user-read-currently-playing user-read-recently-played user-library-read user-library-modify user-modify-playback-state user-read-playback-state app-remote-control user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';

   res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));

 });

 app.get('/callback', async (req, res) => {
  const code = req.query['code'];

  try {
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
        code: code,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: client_id,
          password: client_secret,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const frontendUri = process.env.FRONTEND_URI || 'http://localhost:3000';
    res.redirect(
      `${frontendUri}/#${querystring.stringify({
        access_token,
        refresh_token,
        expires_in
      })}`
    );
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.redirect('/#error=invalid_token');
  }
});


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

app.post('/api/moderate-lyrics', async (req, res) => {
  const { lyrics } = req.body;

  try {
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: lyrics,
    });

    res.json(moderation);
  } catch (error) {
    console.error("Error checking moderation:", error);
    res.status(500).json({ error: "Failed to check moderation" });
  }
});


app.post('/refresh_token', async (req, res) => {
  const refreshToken = req.body.refresh_token;
  console.log('Received refresh token:', req.body.refresh_token);


  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
      },
      body: params,
    });

    const data = await response.json();

    if (data.access_token) {
      res.json(data);
    } else {
      res.status(400).json({ error: 'Failed to refresh token' });
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// AFTER defining routes:
// production:
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
});



let port = process.env.PORT || 3333
console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`)
app.listen(port)

// Listen on a specific host via the HOST environment variable
var cors_host = '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var cors_port = 8080;

cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(cors_port, cors_host, function() {
    console.log('Running CORS Anywhere on ' + cors_host + ':' + cors_port);
});

export const handler = serverless(app);
