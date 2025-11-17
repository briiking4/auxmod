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



dotenv.config()

let prod = true; 


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

    // removing the duplicated lines from the lyrics

    const removeDuplicateLines = str => {
      const seen = new Set();
      return str
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => {
          // normalize for comparison
          const key = line
            .toLowerCase()
            .replace(/[^\w\s]/g, '')  // strip punctuation
            .replace(/\s+/g, ' ');    // collapse spaces
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .join('\n');
    };


    if(filteredResult.instrumental){
      // console.log("song is instrumental", filteredResult)
      return "instrumental"
    }else{
      let lyrics = removeDuplicateLines(filteredResult.plainLyrics)
      return lyrics
    }



    // const url = `https://api.musixmatch.com/ws/1.1/track.lyrics.get?apikey=564d37f16aeeda836dfa71dde9556561&track_isrc=${track_isrc}`;
    // const options = {method: 'GET', body: undefined};

    // try {
    //   const response = await fetch(url, options);
    //   const data = await response.json();
    //   console.log(data);
    //   let lyrics = data.message.body.lyrics.lyrics_body;
    
    //   // Cut off everything starting from the first occurrence of '...'
    //   const cutOffIndex = lyrics.indexOf('...');
    //   if (cutOffIndex !== -1) {
    //     lyrics = lyrics.slice(0, cutOffIndex).trim();
    //   }
    
    //   console.log(lyrics);
    //   return lyrics;
    // } catch (error) {
    //   console.error(error);
    // }
    

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

// Main analyze song endpoint
// app.post('/api/analyze-song', async (req, res) => {
//   const { songTitle, songArtist, chosenFilters } = req.body;

//   if (!songTitle || !songArtist) {
//     return res.status(400).json({ error: 'Missing songTitle or songArtist' });
//   }

//   try {
//     console.log(`Analyzing song: ${songTitle} by ${songArtist}`);
    
//     // Get lyrics first
//     const lyrics = await getLyrics(songTitle, songArtist);

//     console.log("lyrics returned from getLyrics: ", lyrics)
    
//     if (!lyrics || lyrics.trim() === '') {
//       console.warn("No lyrics found. Skipping analysis.");
//       return res.json({ 
//         status: 'no-lyrics', 
//         lyrics: null,
//         sexually_explicit: null, 
//         profanity: null, 
//         violence: null 
//       });
//     }

//     // Extract filter settings and run checks accordingly 
//     const profanityFilter = chosenFilters?.find(filter => filter.label === "Profanity");
//     const violenceFilter = chosenFilters?.find(filter => filter.label === "Violence");
//     const sexualFilter = chosenFilters?.find(filter => filter.label === "Sexual");
    
//     const shouldCheckProfanity = !!profanityFilter;
//     const shouldCheckModeration = !!(violenceFilter || sexualFilter);
//     const whitelist = profanityFilter?.options?.whitelist || [];

//     const [themeModeration, profanityResult] = await Promise.all([
//       shouldCheckModeration ? checkModerationBatch(lyrics) : Promise.resolve({ sexual: null, violence: null, status: 'success' }),
//       shouldCheckProfanity ? checkProfanity(lyrics, whitelist) : Promise.resolve(null)
//     ]);

//     console.log("Analysis complete");
    
//     // Return comprehensive results
//     res.json({
//       status: themeModeration.status,
//       lyrics: lyrics,
//       sexually_explicit: themeModeration.sexual,
//       profanity: profanityResult,
//       violence: themeModeration.violence,
//     });

//   } catch (error) {
//     console.error("Error analyzing song:", error);
    
//     // Handle specific error cases
//     if (error.message.includes('No lyrics found')) {
//       return res.json({
//         status: 'no-lyrics',
//         lyrics: null,
//         sexually_explicit: null,
//         profanity: null,
//         violence: null
//       });
//     }

//     res.status(500).json({
//       error: 'Failed to analyze song',
//       details: error.message
//     });
//   }
// });

const TOKEN_LIMIT = 10000; // TPM from OpenAI
const REFILL_INTERVAL_MS = 100; //
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

  return new Promise((resolve, reject) => {
    if (tokensNeeded > TOKEN_LIMIT) {
      reject(new Error(`CHUNK_TOO_LARGE:${tokensNeeded}`));
      return;
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
  return encode(text).length;
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
    if (!song.songTitle || !song.songArtists) {
      return res.status(400).json({ error: 'Each song must have songTitle and songArtists' });
    }
  }

  try {
    console.log(`Analyzing chunk of ${songs.length} songs`);

    const lyricsResults = await Promise.all(
      songs.map(async (song, index) => {
        try {
          console.log("SONG TITLE FROM REQ:", song.songTitle)
          console.log("SONG ARTIST FROM REQ:", song.songArtists)


          const lyrics = await getLyrics(song.songTitle, song.songArtists, song.songAlbum, song.songDuration);
          return { index, song, lyrics: lyrics?.trim() ? lyrics : null, error: null };
        } catch (error) {
          console.warn(`Failed to get lyrics for ${song.songTitle} by ${song.songArtists[0]}:`, error.message);
          return { index, song, lyrics: null, error: error.message };
        }
      })
    );
    

    console.log(`Fetched lyrics for ${lyricsResults.filter(r => r.lyrics).length}/${songs.length} songs`);

    const profanityFilter = chosenFilters?.find(filter => filter.label === "Profanity");
    const violenceFilter = chosenFilters?.find(filter => filter.label === "Violence");
    const sexualFilter = chosenFilters?.find(filter => filter.label === "Sexual");
    const selfHarmFilter = chosenFilters?.find(filter => filter.label === "Self-Harm");

    
    const shouldCheckProfanity = !!profanityFilter;
    const shouldCheckModeration = !!(violenceFilter || sexualFilter || selfHarmFilter);
    const whitelist = profanityFilter?.options?.whitelist || [];
    const blacklist = profanityFilter?.options?.blacklist || [];


    const songsWithLyrics = lyricsResults.filter(result => result.lyrics && result.lyrics !== "instrumental");
    const songsWithoutLyrics = lyricsResults.filter(result => !result.lyrics);
    const songsInstrumental= lyricsResults.filter(result => result.lyrics === "instrumental");


    const analysisResults = new Array(songs.length);
    
    if (songsWithLyrics.length > 0) {

      const lyricsArray = songsWithLyrics.map(s => s.lyrics);

      let moderationResults = [];
      if (shouldCheckModeration) {
        console.log(`Running moderation checks for ${songsWithLyrics.length} songs`);
        
        moderationResults = await checkModerationBatch(lyricsArray);
        console.log(`Moderation complete for ${moderationResults.length} songs`);
      }

      // Process profanity checks in parallel
      const profanityResults = [];
      if (shouldCheckProfanity) {
        const profanityPromises = lyricsArray.map(lyrics => {
          return Promise.resolve().then(() => checkProfanity(lyrics, whitelist, blacklist)).catch(error => {
            console.error(`Profanity check failed:`, error.message);
            return null;
          });
        });
        profanityResults.push(...await Promise.all(profanityPromises));
      }

      // Combine results
      songsWithLyrics.forEach(({ index, song, lyrics }, i) => {
        const moderationResult = shouldCheckModeration 
          ? moderationResults[i] || { sexual: null, violence: null, self_harm: null, status: 'failed' }
          : { sexual: null, violence: null, self_harm: null, status: 'success' };
          
        const profanityResult = shouldCheckProfanity ? profanityResults[i] : null;

        analysisResults[index] = {
          status: moderationResult.status,
          lyrics: lyrics,
          sexually_explicit: moderationResult.sexual,
          profanity: profanityResult,
          violence: moderationResult.violence,
          self_harm: moderationResult.self_harm
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
        self_harm: null,
        error: error || 'No lyrics found'
      };
    });

    songsInstrumental.forEach(({ index, song }) => {
      analysisResults[index] = {
        status: 'instrumental',
        lyrics: null,
        sexually_explicit: null,
        profanity: null,
        violence: null,
        self_harm: null
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

  const combinedText = lyricsArray.join('\n');
  const estimatedTokens = estimateTokens(combinedText);

  console.log(`[Moderation Batch] ${lyricsArray.length} songs, ~${estimatedTokens} tokens`);

  // Check if batch is too large for token bucket
  if (estimatedTokens > TOKEN_LIMIT) {
    console.warn(`[Moderation] Batch too large (${estimatedTokens} tokens), splitting in half`);
    
    // Split the batch in half and process recursively
    const midpoint = Math.floor(lyricsArray.length / 2);
    const firstHalf = lyricsArray.slice(0, midpoint);
    const secondHalf = lyricsArray.slice(midpoint);
    
    console.log(`[Moderation] Split: ${firstHalf.length} + ${secondHalf.length} songs`);
    
    // Process both halves (they'll queue up in the token bucket)
    const [firstResults, secondResults] = await Promise.all([
      checkModerationBatch(firstHalf),
      checkModerationBatch(secondHalf)
    ]);
    
    return [...firstResults, ...secondResults];
  }

  // Normal processing path - wait for tokens
  try {
    await waitForTokens(estimatedTokens);
  } catch (error) {
    if (error.message.startsWith('CHUNK_TOO_LARGE:')) {
      // This shouldn't happen due to the check above, but handle it anyway
      console.error(`[Moderation] Token limit exceeded unexpectedly, splitting batch`);
      const midpoint = Math.floor(lyricsArray.length / 2);
      const [firstResults, secondResults] = await Promise.all([
        checkModerationBatch(lyricsArray.slice(0, midpoint)),
        checkModerationBatch(lyricsArray.slice(midpoint))
      ]);
      return [...firstResults, ...secondResults];
    }
    throw error;
  }

  try {
    const moderation = await retry(() =>
      openai.moderations.create({
        model: "omni-moderation-latest",
        input: lyricsArray,
      })
    );

    if (!moderation.results || moderation.results.length !== lyricsArray.length) {
      console.warn("Mismatch in moderation results length.");
      return lyricsArray.map(() => ({ 
        sexual: null, 
        violence: null, 
        self_harm: null, 
        status: 'failed' 
      }));
    }

    return moderation.results.map(result => ({
      sexual: result.category_scores?.sexual ?? null,
      violence: result.category_scores?.violence ?? null,
      self_harm: result.category_scores?.['self-harm'] ?? null,
      status: 'success'
    }));
  } catch (error) {
    console.error("Error in batch moderation:", error);
    return lyricsArray.map(() => ({ 
      sexual: null, 
      violence: null, 
      self_harm: null, 
      status: 'failed' 
    }));
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
