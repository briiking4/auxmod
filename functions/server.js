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
import { acquire, release } from './openaiLimiter.js';




dotenv.config()

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

    if(filteredResult.instrumental){
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

const TOKEN_LIMIT = 10000; // TPM from OpenAI

let tokensUsedThisMinute = 0;
let minuteStartTime = Date.now();

async function waitForTokens(tokensNeeded) {
  const now = Date.now();
  
  // Reset counter every minute
  if (now - minuteStartTime > 60000) {
    tokensUsedThisMinute = 0;
    minuteStartTime = now;
  }
  
  // Warn if approaching limit
  if (tokensUsedThisMinute + tokensNeeded > TOKEN_LIMIT) {
    console.warn(`Approaching rate limit: ${tokensUsedThisMinute}/${TOKEN_LIMIT} tokens used`);
    // delay to spread requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  tokensUsedThisMinute += tokensNeeded;
}

// setInterval(refillTokens, REFILL_INTERVAL_MS);
  
function estimateTokens(text) {
  return encode(text).length;
}



async function retry(func, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 2000; // 1s, 2s, 4s
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


          let lyrics = await getLyrics(song.songTitle, song.songArtists, song.songAlbum, song.songDuration);
           lyrics = prepareLyricsForModeration(lyrics);
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

function sampleLyrics(lines) {
  const sectionLength = Math.floor(lines.length / 3);
  const halfSection = Math.floor(sectionLength / 2);

  const sampledLines = [
    ...lines.slice(0, halfSection),
    ...lines.slice(sectionLength, sectionLength + halfSection),
    ...lines.slice(2 * sectionLength, 2 * sectionLength + halfSection)
  ];

  return sampledLines.join('\n');
}

function prepareLyricsForModeration(lyrics) {

  if(lyrics === null || lyrics.length === 0) return null;

  // Step 1: Deduplicate
  let lines = removeDuplicateLines(lyrics);

  // Step 2: Remove filler words
  lines = removeFillerWords(lines);

  return lines.join('\n');
}


function chunkLyricsByTokens(lyricsArray) {
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;

  for (const lyrics of lyricsArray) {
    const tokens = estimateTokens(lyrics);
    console.log("LYRICS TOKENS: ", tokens);
    
    // Step 1: clean lyrics (dedupe + remove fillers)
    let lines = removeDuplicateLines(lyrics);        // returns array of lines
    lines = removeFillerWords(lines);                   // still array of lines

    // Step 2: sample if token-heavy
    let processed_lyrics = lines.join('\n');

    if (tokens > 500) {
      processed_lyrics = sampleLyrics(lines); 
    }


    if (currentTokens + tokens > TOKEN_LIMIT) {
      chunks.push(currentChunk);
      currentChunk = [processed_lyrics];
      currentTokens = tokens;
    } else {
      currentChunk.push(processed_lyrics);
      currentTokens += tokens;
    }
  }

  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks;
}

async function runModeration(chunk) {
  const tokensNeeded = chunk.reduce((a, l) => a + estimateTokens(l), 0);

  await acquire(tokensNeeded);

  try {
    return await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: chunk,
    });
  } finally {
    release();
  }
}

async function checkModerationBatch(lyricsArray) {
 
    if (!lyricsArray?.length) return [];
  
    const chunks = chunkLyricsByTokens(lyricsArray);
    const results = [];
  
    for (const chunk of chunks) {
      try {
        const moderation = await retry(() => runModeration(chunk));
  
        results.push(
          ...moderation.results.map(r => ({
            sexual: r.category_scores?.sexual ?? null,
            violence: r.category_scores?.violence ?? null,
            self_harm: r.category_scores?.['self-harm'] ?? null,
            status: 'success',
          }))
        );
      } catch {
        results.push(...chunk.map(() => ({
          sexual: null,
          violence: null,
          self_harm: null,
          status: 'failed',
        })));
      }
    }
  
    return results;
  
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
