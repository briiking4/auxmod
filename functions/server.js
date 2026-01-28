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
  parseRawPattern,
  pattern
} from 'obscenity';
import { spanishDataset, spanishEnglishBlacklistTransformers } from '../src/spanishDataset.js';
import PQueue from 'p-queue';
import { encode } from "gpt-tokenizer";
import { acquire, release } from '../src/openaiLimiter.js';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

dotenv.config()

// // Initialize Firebase Admin
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();


let prod = true; 


var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = prod ? process.env.REDIRECT_URI : 'http://127.0.0.1:3333/api/callback';
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

 app.get('/api/guest_token', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    res.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get token' });
  }
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

// going to be for creating user document in Firebase // havent added this to the flow yet
// async function createNewUser(displayName, service, service_userId) {
//   const uuid = crypto.randomUUID();
//   const current_date = date.now();
//   await setDoc(doc(db, "users", uuid), {
//     display_name: displayName,
//     service: service,
//     service_user_id: service_userId,
//     created_at: current_date,
//   });
//   console.log("New user created! +", name);
// }


// Lyrics fetching function
async function getLyrics(songTitle, songArtists, albumName, duration) {
  try {
    // const encodedArtist = encodeURIComponent(songArtist);
    // const encodedTitle = encodeURIComponent(songTitle);
    // const url = `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`;


    const encodedArtist = encodeURIComponent(songArtists[0]);
    const encodedTitle = encodeURIComponent(songTitle);
    const encodedAlbum = encodeURIComponent(albumName);
    

    const url = `https://lrclib.net/api/search?artist_name=${encodedArtist}&track_name=${encodedTitle}&album_name=${encodedAlbum}`

    const response = await fetch(url);
    const data = await response.json();

    const normalize = s => (
      s == null ? '' :
      String(s)
      .replace(/[\[\]\(\)\{\}-]/g, ' ')  
      .replace(/[^\w\s]/g, '')           
      .replace(/\s+/g, ' ')                      
        .trim()                                   
        .toLowerCase()
    );

    const matchesAllArtists = lyric =>
      songArtists.every(artist => normalize(lyric.artistName).includes(normalize(artist)));

    const matchesMainArtist = lyric =>
      normalize(lyric.artistName).includes(normalize(songArtists[0]));

    const roundDuration = d => Math.round(d);

    const filterLyric = (lyric, durationCheck, artistCheck) => {
      const roundedLyricDuration = roundDuration(lyric.duration);
      const roundedTargetDuration = roundDuration(duration);

      return (
        durationCheck(roundedLyricDuration, roundedTargetDuration) &&
        normalize(lyric.albumName) === normalize(albumName) &&
        normalize(lyric.trackName) === normalize(songTitle) &&
        artistCheck(lyric)
      );
    };


    //finding the best lyrics match

    // 1st try Exact duration, all artists
    let filteredResult = data.find(lyric =>
      filterLyric(lyric, (lyricDur, targetDur) => lyricDur === targetDur, matchesAllArtists)
    );
    // if (filteredResult) console.log("Found in step 1: Exact duration + all artists");

    // 2️nd try Exact duration, main artist only
    if (!filteredResult) {
      filteredResult = data.find(lyric =>
        filterLyric(lyric, (lyricDur, targetDur) => lyricDur === targetDur, matchesMainArtist)
      );
      // if (filteredResult) console.log("Found in step 2: Exact duration + main artist");
    }

    // 3rd try ±2 seconds, all artists
    if (!filteredResult) {
      filteredResult = data.find(lyric =>
        filterLyric(
          lyric,
          (lyricDur, targetDur) => Math.abs(lyricDur - targetDur) <= 2,
          matchesAllArtists
        )
      );
      // if (filteredResult) console.log("Found in step 3: ±2 seconds + all artists");
    }

    // 4th try ±2 seconds, main artist only
    if (!filteredResult) {
      filteredResult = data.find(lyric =>
        filterLyric(
          lyric,
          (lyricDur, targetDur) => Math.abs(lyricDur - targetDur) <= 2,
          matchesMainArtist
        )
      );
      // if (filteredResult) console.log("Found in step 4: ±2 seconds + main artist");
    }

    if(filteredResult?.instrumental){
      // console.log("song is instrumental", filteredResult)
      return "instrumental"
    }else{
      let lyrics = filteredResult.plainLyrics
      return lyrics
    }
    

  } catch (error) {
    console.error("Error in getLyrics:", error.message);
    throw error;
  }
}

// Profanity checking function
function checkProfanity(lyrics, whitelist = [], blacklist = []) {
  const normalizedWhitelist = whitelist.map((w) => w.toLowerCase());
  const normalizedBlacklist = blacklist.map((w) => w.toLowerCase());


  const defaultWhitelist = ['scat'];

  const myDataset = new DataSet()
    .addAll(englishDataset)
    .addAll(spanishDataset);


      // Remove phrases that match whitelist items
  myDataset.removePhrasesIf((phrase) => {
    return normalizedWhitelist.map(w => w.toLowerCase()).includes(phrase.metadata.originalWord.toLowerCase());
  });

  // adding in custom blacklist words
  normalizedBlacklist.forEach((word) => {
    myDataset.addPhrase((phrase) =>
      phrase
        .setMetadata({ originalWord: word, customBlacklist: true })
        .addPattern(pattern`${word}`)
    );
  });
  
  const builtDataset = myDataset.build();


  const spanishWhitelist = [
    'cumpleaños', 'cumplido', 'cumplir',
    'analizar', 'análisis',
    'sexual', 'sexualidad',
  ];

  // Set up the matcher
  const matcher = new RegExpMatcher({
    blacklistedTerms: builtDataset.blacklistedTerms,
    whitelistedTerms: [...normalizedWhitelist, ...spanishWhitelist, ...defaultWhitelist, ...builtDataset.whitelistedTerms],
    blacklistMatcherTransformers: spanishEnglishBlacklistTransformers,
  });

  const whitelistWordsFound = new Set();
  const blacklistedWordsFound = new Set();
  const customBlacklistedWordsFound = new Set();
  const whitelistWordCountOccurrences = {};
  const blacklistWordCountOccurrences = {};

  // Handle whitelist matching
  if (whitelist && whitelist.length > 0) {
    const listForWhitelistMatcher = normalizedWhitelist.map((word, index) => ({
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
      customBlacklistedWordsFound: [],
      blacklistOccurrences: {}
    };
  }

  if (matcher.hasMatch(lyrics)) {
    // console.log("Profanity detected!");
    const blacklistMatches = matcher.getAllMatches(lyrics);
    const blacklistMatchesMeta = blacklistMatches.map(myDataset.getPayloadWithPhraseMetadata.bind(myDataset));

    blacklistMatchesMeta.forEach((word) => {
      if(word.phraseMetadata.customBlacklist){
        customBlacklistedWordsFound.add(word.phraseMetadata.originalWord);
        blacklistWordCountOccurrences[word.phraseMetadata.originalWord] = 
          (blacklistWordCountOccurrences[word.phraseMetadata.originalWord] || 0) + 1;
      }else{
        blacklistedWordsFound.add(word.phraseMetadata.originalWord);
        blacklistWordCountOccurrences[word.phraseMetadata.originalWord] = 
          (blacklistWordCountOccurrences[word.phraseMetadata.originalWord] || 0) + 1;

      }

    });

    return {
      hasProfanity: true,
      whitelistedWordsFound: Array.from(whitelistWordsFound),
      whitelistOccurrences: whitelistWordCountOccurrences,
      blacklistedWordsFound: Array.from(blacklistedWordsFound),
      customBlacklistedWordsFound: Array.from(customBlacklistedWordsFound),
      blacklistOccurrences: blacklistWordCountOccurrences
    };
  } else {
    // console.log("No profanity found.");
    return {
      hasProfanity: false,
      whitelistedWordsFound: Array.from(whitelistWordsFound),
      whitelistOccurrences: whitelistWordCountOccurrences,
      blacklistedWordsFound: Array.from(blacklistedWordsFound),
      customBlacklistedWordsFound: Array.from(customBlacklistedWordsFound),
      blacklistOccurrences: blacklistWordCountOccurrences
    };
  }
}

const MAX_TPM = 9800;
const WINDOW_MS = 60_000;

// rolling window store
const tokenEvents = [];

function tryAcquireTokens(tokensNeeded) {
  const now = Date.now();

  // remove expired events
  while (tokenEvents.length && tokenEvents[0].time < now - WINDOW_MS) {
    tokenEvents.shift();
  }

  const used = tokenEvents.reduce((sum, e) => sum + e.tokens, 0);

  if (used + tokensNeeded > MAX_TPM) {
    return false;
  }

  tokenEvents.push({ time: now, tokens: tokensNeeded });
  return true;
}

  
function estimateTokens(text) {
  return encode(text).length;
}

function getWaitTime(tokensNeeded) {
  const now = Date.now();
  
  // Remove expired events
  while (tokenEvents.length && tokenEvents[0].time < now - WINDOW_MS) {
    tokenEvents.shift();
  }
  
  const used = tokenEvents.reduce((sum, e) => sum + e.tokens, 0);
  const available = MAX_TPM - used;
  
  if (available >= tokensNeeded) {
    return 0; // No wait needed
  }
  
  // Calculate how long until oldest event expires to free up tokens
  if (tokenEvents.length === 0) return 0;
  
  const oldestEvent = tokenEvents[0];
  const timeUntilExpiry = WINDOW_MS - (now - oldestEvent.time);
  
  return Math.max(timeUntilExpiry, 1000); // Minimum 1 second
}


app.post('/api/analyze-songs-batch', async (req, res) => {
  try {
    const { songs, chosenFilters, batchContext, sessionId } = req.body;

    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'Songs array is required'
      });
    }

    console.log(`Processing batch ${batchContext?.batchNumber || 'unknown'} with ${songs.length} songs`);


    const shouldCheckModeration = chosenFilters.find(filter => filter.id === "sexual") || chosenFilters.find(filter => filter.id === "violence") || chosenFilters.find(filter => filter.id === "self-harm");
    const shouldCheckProfanity = chosenFilters.find(filter => filter.id === "profanity")

    const profanityFilter = chosenFilters?.find(filter => filter.id === "profanity");
    const whitelist = profanityFilter?.options?.whitelist || [];
    const blacklist = profanityFilter?.options?.blacklist || [];


    // Initialize results array
    const analysisResults = new Array(songs.length);

    // Fetch lyrics for all songs
    console.log('Fetching lyrics...');
    const lyricsPromises = songs.map((song, idx) => 
      getLyrics(song.songTitle, song.songArtists, song.songAlbum, song.songDuration)
        .then(lyrics => ({ index: idx, song, lyrics, error: null }))
        .catch(error => ({ index: idx, song, lyrics: null, error: error.message }))
    );

    const lyricsResults = await Promise.all(lyricsPromises);

    // Categorize songs
    const songsWithLyrics = [];
    const songsWithoutLyrics = [];
    const songsInstrumental = [];

    lyricsResults.forEach(result => {
      if (result.song.isInstrumental) {
        songsInstrumental.push(result);
      } else if (result.lyrics) {
        songsWithLyrics.push(result);
      } else {
        songsWithoutLyrics.push(result);
      }
    });

    console.log(`Lyrics fetched: ${songsWithLyrics.length} with lyrics, ${songsWithoutLyrics.length} without, ${songsInstrumental.length} instrumental`);

    // Process songs with lyrics
    if (songsWithLyrics.length > 0) {
      const lyricsArray = songsWithLyrics.map(s => s.lyrics);

      // Moderation check
      let moderationResults = [];
      if (shouldCheckModeration) {
        console.log('Starting moderation checks...');

        // Prepare all lyrics
        const preparedLyrics = lyricsArray.map(lyrics => prepareLyricsForModeration(lyrics)).filter(Boolean);

        if (preparedLyrics.length === 0) {
          moderationResults = songsWithLyrics.map(() => ({ 
            sexual: null, 
            violence: null, 
            self_harm: null, 
            status: 'no-lyrics' 
          }));
        } else {
          // Calculate total tokens needed
          const tokensNeeded = preparedLyrics.reduce((sum, l) => sum + l.tokens, 0);
          console.log(`Total tokens needed: ${tokensNeeded}`);

          // Check rate limit - if not available, return 429 immediately
          if (!tryAcquireTokens(tokensNeeded)) {
            const waitTime = getWaitTime(tokensNeeded);
            console.log(`Rate limited, need to wait ${waitTime}ms`);
            return res.status(429).json({
              error: 'rate_limited',
              retryAfterMs: Math.ceil(waitTime)
            });
          }

          // Call OpenAI once with all prepared lyrics
          try {
              let chunk_result = await runModeration(preparedLyrics);
              moderationResults = chunk_result.map((result) => ({   
                sexual: result.category_scores?.sexual ?? null,
                violence: result.category_scores?.violence ?? null,
                self_harm: result.category_scores?.['self-harm'] ?? null,
                status: 'success' 
              }));

            console.log('Moderation checks complete');

          } catch (error) {
            console.error('OpenAI moderation error:', error);

            // If OpenAI returns rate limit, pass it to frontend
            if (error.status === 429 || error.code === 'rate_limit_exceeded') {
              return res.status(429).json({
                error: 'rate_limited',
                retryAfterMs: 3000
              });
            }else{
              moderationResults = preparedLyrics.map(() => ({
                sexual: null,
                violence: null,
                self_harm: null,
                status: 'failed'
              }));
            }

          }
        }
      } else {
        moderationResults = songsWithLyrics.map(() => ({
          sexual: null,
          violence: null,
          self_harm: null,
          status: 'success'
        }));
      }

      // Profanity check (runs in parallel, no rate limiting needed)
      let profanityResults = [];
      if (shouldCheckProfanity) {
        console.log('Starting profanity checks...');
        profanityResults = lyricsArray.map(lyrics => {
          try {
            const result = checkProfanity(lyrics, whitelist, blacklist);
            return result
          } catch (error) {
            console.error('Profanity check error:', error);
            return null;
          }
        });

        console.log('Profanity checks complete');

      } else {
        profanityResults = songsWithLyrics.map(() => null);
      }

      // Combine results
      songsWithLyrics.forEach(({ index }, i) => {
        analysisResults[index] = {
          status: moderationResults[i].status,
          sexually_explicit: moderationResults[i].sexual,
          profanity: profanityResults[i],
          violence: moderationResults[i].violence,
          self_harm: moderationResults[i].self_harm
        };
      });
    }

    // Handle songs without lyrics
    songsWithoutLyrics.forEach(({ index, error }) => {
      analysisResults[index] = {
        status: 'no-lyrics',
        sexually_explicit: null,
        profanity: null,
        violence: null,
        self_harm: null,
        error: error || 'No lyrics found'
      };
    });

    // Handle instrumental songs
    songsInstrumental.forEach(({ index }) => {
      analysisResults[index] = {
        status: 'instrumental',
        sexually_explicit: null,
        profanity: null,
        violence: null,
        self_harm: null
      };
    });

    console.log(`Batch ${batchContext?.batchNumber || 'unknown'} complete`);

    res.json({
      results: analysisResults,
      summary: {
        total: songs.length,
        withLyrics: songsWithLyrics.length,
        withoutLyrics: songsWithoutLyrics.length,
        instrumental: songsInstrumental.length
      }
    });

  } catch (error) {
    console.error("Error in batch song analysis:", error);
    res.status(500).json({
      error: 'Failed to analyze songs batch',
      details: error.message
    });
  }
});


function removeDuplicateLines(str) {
  const seen = new Set();
  return str
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      const key = line
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// Remove filler words line by line, keep line structure
function removeFillerWords(lines) {
  const filler_words = [ 'oh','ohh','yeah','yuh','yeahh','hey','ha','uh','uhh','ah','ahh','woo','whoa','huh', 'mmm','uh-huh','ha-ha','yo','ayy','ay','nah','hmm', 'come on','let’s go','uh-oh','hey hey','la la la','na na na','woo hoo', "hol' up", ];

  const regex = new RegExp(`\\b(${filler_words.join('|')})\\b`, 'gi');
  return lines.map(line => line.replace(regex, '').replace(/\s+/g, ' ').trim())
              .filter(line => line); // remove empty lines
}

function sampleLyrics(lines, maxTokens = 650) {
  if (!lines.length) return '';

  const totalTokens = estimateTokens(lines.join('\n'));
  let fraction = 0.5; // default fraction (half)

  if (totalTokens > 1200) {
    fraction = 0.25; // very large song → 1/4 of each section
  } else if (totalTokens > 800) {
    fraction = 1/3; // medium-large → 1/3 of each section
  }

  const sectionLength = Math.floor(lines.length / 3);
  const takeLength = Math.max(1, Math.floor(sectionLength * fraction));

  const sampledLines = [
    ...lines.slice(0, takeLength),
    ...lines.slice(sectionLength, sectionLength + takeLength),
    ...lines.slice(2 * sectionLength, 2 * sectionLength + takeLength)
  ];

  // Ensure we don't exceed maxTokens
  let result = sampledLines.join('\n');
  let tokens = estimateTokens(result);

  while (tokens > maxTokens && sampledLines.length > 1) {
    // remove one line from each section evenly
    if (sampledLines.length >= 3) {
      sampledLines.splice(-3, 3); // remove last line from each section
    } else {
      sampledLines.pop();
    }
    result = sampledLines.join('\n');
    tokens = estimateTokens(result);
  }

  return {text: result, tokens: tokens};
}


function prepareLyricsForModeration(lyrics) {
  if (!lyrics) return null;

  let lines = removeDuplicateLines(lyrics);
  lines = removeFillerWords(lines);

  const sample_lyrics = sampleLyrics(lines);

  return {
    text: sample_lyrics.text,
    tokens: sample_lyrics.tokens
  };
}


async function runModeration(chunk) {
  let result = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: chunk.map(c => c.text),
  });
  return result.results
}


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
