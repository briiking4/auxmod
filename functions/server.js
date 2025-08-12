import axios from 'axios';
import express from 'express';
import cors from 'cors';
import path from 'path';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import OpenAI from "openai";
import serverless from 'serverless-http';
import pLimit from 'p-limit';
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  DataSet,
  parseRawPattern
} from 'obscenity';
import { spanishDataset, spanishEnglishBlacklistTransformers } from '../src/spanishDataset.js';
import Genius from 'genius-lyrics';
import PQueue from 'p-queue';


dotenv.config()

let prod = false; 


var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = prod ? process.env.REDIRECT_URI : 'http://localhost:3333/api/callback';
const corsOrigin = prod ? 'https://auxmod.netlify.app' : '*' 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});


var stateKey = 'spotify_auth_state';

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working in dev!' });
});

if (!prod) {
  const port = 3333;
  app.listen(port, () => {
    console.log(`Dev server running at http://localhost:${port}/api/test`);
  });
}


function generateRandomString(length){
   var text = '';
   var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

   for (var i = 0; i < length; i++) {
     text += possible.charAt(Math.floor(Math.random() * possible.length));
   }
   return text;
 };

 app.get('/api/login', function(req, res) {
   var state = generateRandomString(16);
   res.cookie(stateKey, state);

   var scope = 'user-library-read user-library-modify user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';

   res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));

 });

 app.get('/api/callback', async (req, res) => {
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

    const frontendUri = prod ? process.env.FRONTEND_URI : 'http://localhost:3000/app';
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

async function getPosthogUser(userId) {
  const projectId = '144587';
  try {
    const response = await fetch(`https://us.posthog.com/api/projects/${projectId}/persons/?distinct_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.POSTHOG_PERSONAL_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error fetching PostHog user:', err);
    return null;
  }
}

app.post('/api/getPosthogUser', async (req, res) => {
  const { userId } = req.body;


  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in request body' });
  }
  const userData = await getPosthogUser(userId);

  if (!userData) {
    return res.status(500).json({ error: 'Failed to retrieve user data' });
  }

  res.json(userData);
});


function cleanLyrics(rawLyrics) {
  if (!rawLyrics) return null;

  let text = rawLyrics;

  // First, find and remove everything from "Lyrics" onwards (including "Lyrics")
  const lyricsIndex = text.indexOf("Lyrics");
  if (lyricsIndex !== -1) {
    text = text.substring(lyricsIndex + "Lyrics".length);
  }

  const lines = text.split('\n');
  const readMoreIndex = lines.findIndex(line =>
    line.toLowerCase().includes('read more')
  );

  // If "Read More" is found, return everything after it
  if (readMoreIndex !== -1 && readMoreIndex < lines.length - 1) {
    text = lines.slice(readMoreIndex + 1).join('\n');
  }

  // Remove text in brackets [like this]
  text = text.replace(/\[.*?\]/g, '');

  // Clean up extra whitespace and empty lines
  const cleanedLines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return cleanedLines.join('\n').trim();
}


// Lyrics fetching function
async function getLyrics(songTitle, songArtist) {
  try {
    // const encodedArtist = encodeURIComponent(songArtist);
    // const encodedTitle = encodeURIComponent(songTitle);
    // const url = `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`;
    const Client = new Genius.Client(process.env.GENIUS_API_KEY);

    const query = `${songTitle} ${songArtist}`;
    const results = await Client.songs.search(query);

  if (!results.length) {
    throw new Error("No results found on Genius");
  }

  const firstSong = results[0];

  const lyrics = await firstSong.lyrics();

  const cleanedLyrics = cleanLyrics(lyrics);


  console.log(cleanedLyrics);

  return cleanedLyrics;

  } catch (error) {
    console.error("Error in getLyrics:", error.message);
    throw error;
  }
}

// Profanity checking function
function checkProfanity(lyrics, whitelist = []) {
  console.log("whitelist: ", whitelist);
  const defaultWhitelist = ['scat'];

  const myDataset = new DataSet()
    .addAll(englishDataset)
    .addAll(spanishDataset);

  // Remove phrases that match whitelist items
  myDataset.removePhrasesIf((phrase) => {
    return whitelist.map(w => w.toLowerCase()).includes(phrase.metadata.originalWord.toLowerCase());
  });

  const spanishWhitelist = [
    'cumpleaños', 'cumplido', 'cumplir',
    'analizar', 'análisis',
    'sexual', 'sexualidad',
  ];

  // Set up the matcher
  const matcher = new RegExpMatcher({
    blacklistedTerms: myDataset.build().blacklistedTerms,
    whitelistedTerms: [...whitelist, ...spanishWhitelist, ...defaultWhitelist],
    blacklistMatcherTransformers: spanishEnglishBlacklistTransformers,
  });

  const whitelistWordsFound = new Set();
  const blacklistedWordsFound = new Set();
  const whitelistWordCountOccurrences = {};
  const blacklistWordCountOccurrences = {};

  // Handle whitelist matching
  if (whitelist && whitelist.length > 0) {
    const listForWhitelistMatcher = whitelist.map((word, index) => ({
      id: index,
      pattern: parseRawPattern(word),
      originalWord: word
    }));

    const whitelistMatcher = new RegExpMatcher({
      blacklistedTerms: listForWhitelistMatcher,
      ...englishRecommendedTransformers,
    });

    const whitelistMatches = whitelistMatcher.getAllMatches(lyrics);
    whitelistMatches.forEach(word => {
      const originalWord = listForWhitelistMatcher.find(originalWord => originalWord.id === word.termId).originalWord;
      whitelistWordCountOccurrences[originalWord] = (whitelistWordCountOccurrences[originalWord] || 0) + 1;
      whitelistWordsFound.add(originalWord);
    });
  }

  if (!lyrics) {
    return {
      hasProfanity: false,
      whitelistedWordsFound: [],
      whitelistOccurrences: {},
      blacklistedWordsFound: [],
      blacklistOccurrences: {}
    };
  }

  if (matcher.hasMatch(lyrics)) {
    console.log("Profanity detected!");
    const blacklistMatches = matcher.getAllMatches(lyrics);
    const blacklistMatchesMeta = blacklistMatches.map(myDataset.getPayloadWithPhraseMetadata.bind(myDataset));

    blacklistMatchesMeta.forEach((word) => {
      blacklistedWordsFound.add(word.phraseMetadata.originalWord);
      blacklistWordCountOccurrences[word.phraseMetadata.originalWord] = 
        (blacklistWordCountOccurrences[word.phraseMetadata.originalWord] || 0) + 1;
    });

    return {
      hasProfanity: true,
      whitelistedWordsFound: Array.from(whitelistWordsFound),
      whitelistOccurrences: whitelistWordCountOccurrences,
      blacklistedWordsFound: Array.from(blacklistedWordsFound),
      blacklistOccurrences: blacklistWordCountOccurrences
    };
  } else {
    console.log("No profanity found.");
    return {
      hasProfanity: false,
      whitelistedWordsFound: Array.from(whitelistWordsFound),
      whitelistOccurrences: whitelistWordCountOccurrences,
      blacklistedWordsFound: Array.from(blacklistedWordsFound),
      blacklistOccurrences: blacklistWordCountOccurrences
    };
  }
}

// Main analyze song endpoint
app.post('/api/analyze-song', async (req, res) => {
  const { songTitle, songArtist, chosenFilters } = req.body;

  if (!songTitle || !songArtist) {
    return res.status(400).json({ error: 'Missing songTitle or songArtist' });
  }

  try {
    console.log(`Analyzing song: ${songTitle} by ${songArtist}`);
    
    // Get lyrics first
    const lyrics = await getLyrics(songTitle, songArtist);
    
    if (!lyrics || lyrics.trim() === '') {
      console.warn("No lyrics found. Skipping analysis.");
      return res.json({ 
        status: 'no-lyrics', 
        lyrics: null,
        sexually_explicit: null, 
        profanity: null, 
        violence: null 
      });
    }

    // Extract filter settings and run checks accordingly 
    const profanityFilter = chosenFilters?.find(filter => filter.label === "Profanity");
    const violenceFilter = chosenFilters?.find(filter => filter.label === "Violence");
    const sexualFilter = chosenFilters?.find(filter => filter.label === "Sexual");
    
    const shouldCheckProfanity = !!profanityFilter;
    const shouldCheckModeration = !!(violenceFilter || sexualFilter);
    const whitelist = profanityFilter?.options?.whitelist || [];

    const [themeModeration, profanityResult] = await Promise.all([
      shouldCheckModeration ? checkModerationBatch(lyrics) : Promise.resolve({ sexual: null, violence: null, status: 'success' }),
      shouldCheckProfanity ? checkProfanity(lyrics, whitelist) : Promise.resolve(null)
    ]);

    console.log("Analysis complete");
    
    // Return comprehensive results
    res.json({
      status: themeModeration.status,
      lyrics: lyrics,
      sexually_explicit: themeModeration.sexual,
      profanity: profanityResult,
      violence: themeModeration.violence,
    });

  } catch (error) {
    console.error("Error analyzing song:", error);
    
    // Handle specific error cases
    if (error.message.includes('No lyrics found')) {
      return res.json({
        status: 'no-lyrics',
        lyrics: null,
        sexually_explicit: null,
        profanity: null,
        violence: null
      });
    }

    res.status(500).json({
      error: 'Failed to analyze song',
      details: error.message
    });
  }
});

const TOKEN_LIMIT = 10000; // TPM from OpenAI
const REFILL_INTERVAL_MS = 50; //
const TOKEN_REFILL_RATE = TOKEN_LIMIT / 60000; // tokens per ms

let tokensAvailable = TOKEN_LIMIT;
let lastRefillTimestamp = Date.now();

const tokenQueue = [];


function refillTokens() {
  const now = Date.now();
  const elapsed = now - lastRefillTimestamp;
  lastRefillTimestamp = now;
  tokensAvailable = Math.min(tokensAvailable + elapsed * TOKEN_REFILL_RATE, TOKEN_LIMIT);
  processQueue();
}

function processQueue() {
  while (tokenQueue.length > 0 && tokensAvailable >= tokenQueue[0].tokensNeeded) {
    const request = tokenQueue.shift();
    tokensAvailable -= request.tokensNeeded;
    request.resolve();
  }
}

function waitForTokens(tokensNeeded) {
  const startTime = Date.now();

  return new Promise(resolve => {
    if (tokensNeeded > TOKEN_LIMIT) {
      throw new Error(`Requested tokens (${tokensNeeded}) exceed the TOKEN_LIMIT (${TOKEN_LIMIT})`);
    }
    if (tokensAvailable >= tokensNeeded) {
      tokensAvailable -= tokensNeeded;
      const waitedMs = Date.now() - startTime;
      console.log(`[Limiter] Immediate allocation of ${tokensNeeded} tokens, waited ${waitedMs}ms`);
      resolve();
    } else {
      tokenQueue.push({
        tokensNeeded,
        resolve: () => {
          const waitedMs = Date.now() - startTime;
          console.log(`[Limiter] Allocated ${tokensNeeded} tokens after waiting ${waitedMs}ms`);
          resolve();
        }
      });
    }
  });
}

setInterval(refillTokens, REFILL_INTERVAL_MS);

function estimateTokens(text) {
  if (!text) return 0;
  const tokens = text.trim().split(/[\s.,!?;:"'()\-]+/).filter(Boolean);
  return tokens.length;
}


async function retry(func, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}



app.post('/api/analyze-songs-batch', async (req, res) => {
  const { songs, chosenFilters } = req.body;

  if (!songs || !Array.isArray(songs) || songs.length === 0) {
    return res.status(400).json({ error: 'Missing songs array or empty array' });
  }

  for (const song of songs) {
    if (!song.songTitle || !song.songArtist) {
      return res.status(400).json({ error: 'Each song must have songTitle and songArtist' });
    }
  }

  try {
    console.log(`Analyzing chunk of ${songs.length} songs`);

    const lyricsResults = await Promise.all(
      songs.map(async (song, index) => {
        try {
          const lyrics = await getLyrics(song.songTitle, song.songArtist);
          return { index, song, lyrics: lyrics?.trim() ? lyrics : null, error: null };
        } catch (error) {
          console.warn(`Failed to get lyrics for ${song.songTitle} by ${song.songArtist}:`, error.message);
          return { index, song, lyrics: null, error: error.message };
        }
      })
    );
    

    console.log(`Fetched lyrics for ${lyricsResults.filter(r => r.lyrics).length}/${songs.length} songs`);

    const profanityFilter = chosenFilters?.find(filter => filter.label === "Profanity");
    const violenceFilter = chosenFilters?.find(filter => filter.label === "Violence");
    const sexualFilter = chosenFilters?.find(filter => filter.label === "Sexual");
    
    const shouldCheckProfanity = !!profanityFilter;
    const shouldCheckModeration = !!(violenceFilter || sexualFilter);
    const whitelist = profanityFilter?.options?.whitelist || [];

    const songsWithLyrics = lyricsResults.filter(result => result.lyrics);
    const songsWithoutLyrics = lyricsResults.filter(result => !result.lyrics);

    const analysisResults = new Array(songs.length);
    
    if (songsWithLyrics.length > 0) {
      let moderationResults = [];
      if (shouldCheckModeration) {
        console.log(`Running moderation checks for ${songsWithLyrics.length} songs`);
        const lyricsArray = songsWithLyrics.map(s => s.lyrics);
        
        // THIS IS THE KEY FIX: Properly batch the moderation calls
        moderationResults = await checkModerationBatch(lyricsArray);
        console.log(`Moderation complete for ${moderationResults.length} songs`);
      }

      // Process profanity checks in parallel
      const profanityResults = [];
      if (shouldCheckProfanity) {
        const profanityPromises = songsWithLyrics.map(({ lyrics }) => {
          return Promise.resolve().then(() => checkProfanity(lyrics, whitelist)).catch(error => {
            console.error(`Profanity check failed:`, error.message);
            return null;
          });
        });
        profanityResults.push(...await Promise.all(profanityPromises));
      }

      // Combine results
      songsWithLyrics.forEach(({ index, song, lyrics }, i) => {
        const moderationResult = shouldCheckModeration 
          ? moderationResults[i] || { sexual: null, violence: null, status: 'failed' }
          : { sexual: null, violence: null, status: 'success' };
          
        const profanityResult = shouldCheckProfanity ? profanityResults[i] : null;

        analysisResults[index] = {
          status: moderationResult.status,
          lyrics: lyrics,
          sexually_explicit: moderationResult.sexual,
          profanity: profanityResult,
          violence: moderationResult.violence
        };
      });
    }

    // Handle songs without lyrics
    songsWithoutLyrics.forEach(({ index, song, error }) => {
      analysisResults[index] = {
        status: 'no-lyrics',
        lyrics: null,
        sexually_explicit: null,
        profanity: null,
        violence: null,
        error: error || 'No lyrics found'
      };
    });

    console.log(`Chunk analysis complete for ${songs.length} songs`);
    
    res.json({
      results: analysisResults,
      summary: {
        total: songs.length,
        withLyrics: songsWithLyrics.length,
        withoutLyrics: songsWithoutLyrics.length,
        processed: analysisResults.filter(r => r).length
      }
    });

  } catch (error) {
    console.error("Error in chunk song analysis:", error);
    
    res.status(500).json({
      error: 'Failed to analyze songs chunk',
      details: error.message
    });
  }
});

async function checkModerationBatch(lyricsArray) {
  if (!Array.isArray(lyricsArray) || lyricsArray.length === 0) {
    return [];
  }

  console.log(`Processing ${lyricsArray.length} songs as a single batch`);

  const combinedText = lyricsArray.join('\n');
  const estimatedTokens = estimateTokens(combinedText);

  console.log(`[Moderation Batch] ${lyricsArray.length} songs, ~${estimatedTokens} tokens`);
  await waitForTokens(estimatedTokens);

  try {
    const moderation = await retry(() =>
      openai.moderations.create({
        model: "omni-moderation-latest",
        input: lyricsArray,
      })
    );

    if (!moderation.results || moderation.results.length !== lyricsArray.length) {
      console.warn("Mismatch in moderation results length.");
      return lyricsArray.map(() => ({ sexual: null, violence: null, status: 'failed' }));
    } else {
      return moderation.results.map(result => ({
        sexual: result.category_scores?.sexual ?? null,
        violence: result.category_scores?.violence ?? null,
        status: 'success'
      }));
    }
  } catch (error) {
    console.error("Error in batch moderation:", error);
    return lyricsArray.map(() => ({ sexual: null, violence: null, status: 'failed' }));
  }
}



// app.get('/api/lyrics', async (req, res) => {

//   const { artist, title } = req.query;

//   if (!artist || !title) {
//     return res.status(400).json({ error: 'Missing artist or title query parameters' });
//   }

//   const lyricsURL = `https://api.lyrics.ovh/v1/${artist}/${title}`;

//   try {
//     const response = await fetch(lyricsURL);
//     console.log(response)
//     if (!response.ok) {
//       return res.status(response.status).json({ error: 'Failed to fetch lyrics' });
//     }
//     const data = await response.json();
//     console.log(data)
//     res.json(data);
//   } catch (err) {
//     console.error('Error fetching lyrics:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


// app.post('/api/moderate-lyrics', async (req, res) => {
//   const { lyrics } = req.body;

//   try {
//     const moderation = await openai.moderations.create({
//       model: "omni-moderation-latest",
//       input: lyrics,
//     });

//     res.json(moderation);
//   }  catch (error) {
//     const status = error?.status || 500;
//     console.error("Error checking moderation:", error);

//     res.status(status).json({
//       error: error.message || "Failed to check moderation",
//       details: error?.response?.data || null
//     });
//   }
// });


app.post('/api/refresh_token', async (req, res) => {
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


// // AFTER defining routes (removing not sure if i need this for netlify):
// // production:
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'build', 'index.html'))
// });



// let port = process.env.PORT || 3333
// console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`)
// app.listen(port)

// think this is only needed for dev: not in prod w netlify

// // Listen on a specific host via the HOST environment variable
// var cors_host = '0.0.0.0';
// // Listen on a specific port via the PORT environment variable
// var cors_port = 8080;

// cors_proxy.createServer({
//     originWhitelist: [], // Allow all origins
//     requireHeader: ['origin', 'x-requested-with'],
//     removeHeaders: ['cookie', 'cookie2']
// }).listen(cors_port, cors_host, function() {
//     console.log('Running CORS Anywhere on ' + cors_host + ':' + cors_port);
// });

export const handler = serverless(app);
