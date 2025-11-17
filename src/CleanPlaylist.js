import pLimit from 'p-limit';
import { backOff } from 'exponential-backoff';
import spotifyApi from './spotifyApi';
import AnalyzeSong from './AnalyzeSong.js';
import ReactGA from 'react-ga4';
import AnalyzeSongsBatch from './AnalyzeSongsBatch.js'

// rate-limited API wrapper
const rateLimitedApi = {
  async call(fn, ...args) {
    return backOff(async () => {
      try {
        return await fn(...args);
      } catch (error) {
        if (error.status === 429) {
          const retryAfter = parseInt(error.headers?.['retry-after'] || '1', 10) * 1000;
          console.log(`Rate limited, waiting for ${retryAfter}ms`);
          await new Promise(resolve => setTimeout(resolve, retryAfter));
        }
        throw error;
      }
    }, {
      numOfAttempts: 5,
      startingDelay: 300,
      maxDelay: 10000,
      jitter: true
    });
  }
};

// Add delay between API calls to respect rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CleanPlaylist = async (playlistId, chosenFilters, onProgressUpdate) => {
  console.log("CLEAN PLAYLIST COMP: The user and playlist id's are:", playlistId);
  console.log("CLEAN P COMP: Chosen filters - ", chosenFilters);

  let playlistName = '';
  let totalTrackCount = 0;
  
  // get cache 
  const getCleanTrackCache = () => {
    try {
      const cache = JSON.parse(localStorage.getItem('cleanTrackCache')) || {};
      const now = Date.now();
      const filtered = Object.entries(cache).reduce((acc, [key, value]) => {
        if (!value.timestamp || value.timestamp > now - (7 * 24 * 60 * 60 * 1000)) {
          acc[key] = value;
        }
        return acc;
      }, {});
      return filtered;
    } catch (error) {
      console.error("Error reading cache:", error);
      return {};
    }
  };

  const cleanTrackCache = getCleanTrackCache();

  const setCachedTrack = (key, track) => {
    cleanTrackCache[key] = { 
      data: track, 
      timestamp: Date.now() 
    };
    try {
      localStorage.setItem('cleanTrackCache', JSON.stringify(cleanTrackCache));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  };

  const isValidTrack = (trackItem) => {
    const track = trackItem.track;
    if (!track) return false;
    if (!track.id || !track.name || !track.uri) return false;

    const album = track.album;
    if (!album || !album.id || !album.name || album.images.length === 0) return false;

    if (!track.artists || track.artists.length === 0 || !track.artists[0].id || !track.artists[0].name)
      return false;

    return true;
  };

  const getPlaylistTracks = async (id) => {
    try {
      const response = await rateLimitedApi.call(spotifyApi.getPlaylist.bind(spotifyApi), id);
      playlistName = response.name;
      
      let allTracks = [];
      let { items, next } = response.tracks;
      allTracks = allTracks.concat(items.filter(isValidTrack));
      
      totalTrackCount = response.tracks.total;
      onProgressUpdate(2);
      
      if (!next) {
        onProgressUpdate(10);
        return allTracks;
      }
      
      const fetchedSoFar = allTracks.length;
      const remainingTracks = totalTrackCount - fetchedSoFar;
      const expectedPages = Math.ceil(remainingTracks / 100);
      
      const progressStart = 2;
      const progressEnd = 10;
      const progressPerPage = (progressEnd - progressStart) / (expectedPages + 1);
      let currentProgress = progressStart;
      
      currentProgress += progressPerPage;
      onProgressUpdate(Math.round(currentProgress));
      
      let pagesFetched = 0;
      
      while (next) {
        const pagedResponse = await rateLimitedApi.call(
          spotifyApi.getPlaylistTracks.bind(spotifyApi), 
          id, 
          { offset: allTracks.length, limit: 100 }
        );
        
        const validTracks = pagedResponse.items.filter(isValidTrack);
        allTracks = allTracks.concat(validTracks);
        next = pagedResponse.next;
        
        pagesFetched++;
        currentProgress = progressStart + ((pagesFetched + 1) * progressPerPage);
        onProgressUpdate(Math.round(Math.min(currentProgress, progressEnd)));
      }
      
      onProgressUpdate(progressEnd);
      return allTracks;
    } catch (error) {
      console.error("Error fetching playlist data:", error);
      throw error;
    }
  };


  const analyzeTracksData = async (tracks) => {
    onProgressUpdate(11);
  
    const CHUNK_SIZE = 15;
    const CHUNK_CONCURRENCY = 2;
    const limit = pLimit(CHUNK_CONCURRENCY);
  
    const results = {
      explicitTracks: [],
      cleanTracks: [],
      tracksNeedingCleanSearch: []
    };
  
    const totalChunks = Math.ceil(tracks.length / CHUNK_SIZE);
    let completedChunks = 0;
    const progressStart = 11;
    const progressEnd = 50;
  
    console.log(`Processing ${tracks.length} tracks in ${totalChunks} chunks of ${CHUNK_SIZE}`);
  
    const updateProgress = () => {
      completedChunks++;
      const chunkProgress = progressStart + ((progressEnd - progressStart) * (completedChunks / totalChunks));
      onProgressUpdate(Math.round(chunkProgress));
    };
  
    const chunkPromises = [];
  
    for (let i = 0; i < tracks.length; i += CHUNK_SIZE) {
      const chunk = tracks.slice(i, i + CHUNK_SIZE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
  
      chunkPromises.push(limit(async () => {
        const chunkStart = Date.now();
  
        const songs = chunk.map(trackItem => {
          let localItemName = trackItem.track.name.replace(/\s*-\s*(radio edit|version|mix|edit|remaster|acoustic|live|instrumental|single).*$/i, '').trim();

          let duration = trackItem.track.duration_ms / 1000

          let artists = trackItem.track.artists.map(a => a.name)

          return {
            songTitle: localItemName,
            songArtists: artists,
            songAlbum:  trackItem.track.album.name,
            songDuration: duration
          };
        });
  
        console.log(`ANALYZING CHUNK ${chunkNumber}/${totalChunks} (${songs.length} songs)`);
  
        try {
          const chunkResults = await AnalyzeSongsBatch(songs, chosenFilters);
          console.log(`CHUNK ${chunkNumber} RESULTS:`, chunkResults);
  
          const cleanCheckLimit = pLimit(2);
          const classifyLimit = pLimit(8);

          console.log("CHUNK RESULTS", chunkResults)
  
          const classifiedResults = await Promise.all(chunkResults.map((item, index) =>
            classifyLimit(async () => {
              const trackItem = chunk[index];
              const track = trackItem.track;
              let failedFilter = false;
              track.reason = [];
  
              if (item && item.status === 'success') {
                track.trackAnalysis = item;
                if ((chosenFilters.find(filter => filter.id === "profanity")) && item.profanity?.hasProfanity) {
                  track.reason.push("Profanity");
                  failedFilter = true;
                }
                if ((chosenFilters.find(filter => filter.id === "violence")) && item.violence > 0.428) {
                  track.reason.push("Violence");
                  failedFilter = true;
                }
                if ((chosenFilters.find(filter => filter.id === "sexual")) && item.sexually_explicit > 0.50) {
                  track.reason.push("Sexual");
                  failedFilter = true;
                }
                if ((chosenFilters.find(filter => filter.id === "self-harm")) && item.self_harm > 0.50) {
                  track.reason.push("Self-Harm");
                  failedFilter = true;
                }

              } else {
                if (item && item.status === 'failed') {
                  track.reason.push("Error");
                  return { type: 'explicit', track };
                } else {
                  if(item && item.status === 'instrumental'){
                    track.trackAnalysis = item;
                    track.reason.push("Instrumental");
                    failedFilter = false;
                  }else{
                    track.reason.push("No score");
                    failedFilter = true;
                  }
                }
              }
  
              if (failedFilter) {
                let replaceCleanVersion = (chosenFilters.find(filter => filter.id === "profanity")).options.replaceClean
                if ((track.reason.length === 1) && (track.reason[0] === "Profanity") && replaceCleanVersion && (track.trackAnalysis.profanity?.customBlacklistedWordsFound.length === 0)) {
                  if (track.explicit) {
                    return { type: 'needs-clean-search', track };
                  }
                  const cleanCheckStart = Date.now();
                  const cleanCheck = await cleanCheckLimit(() => isCleanVersion(track));
                  console.log(`isCleanVersion took ${Date.now() - cleanCheckStart}ms for track ${track.name}`);
                  if (cleanCheck.isClean) {
                    track.reason = ["clean version"];
                    return { type: 'clean', track };
                  } else {
                    return { type: 'explicit', track };
                  }
                } else {
                  return { type: 'explicit', track };
                }
              } else {
                if(track.explicit && (track.trackAnalysis.profanity?.whitelistedWordsFound.length === 0)){
                  track.reason.push("check manually");
                }
                track.reason.push("passed filters");
                return { type: 'clean', track };
              }
            })
          ));

          console.log("CLASSIFIED RESULTS: ", classifiedResults)
  
          for (const result of classifiedResults) {
            if (result.type === 'clean') {
              results.cleanTracks.push(result.track);
            } else if (result.type === 'explicit') {
              results.explicitTracks.push(result.track);
            } else if (result.type === 'needs-clean-search') {
              results.tracksNeedingCleanSearch.push(result.track);
            }
          }
        } catch (error) {
          console.error(`CHUNK ${chunkNumber} FAILED:`, error);
          chunk.forEach(trackItem => {
            const track = trackItem.track;
            track.reason = ["failed"];
            results.explicitTracks.push(track);
          });
        }
  
        console.log(`CHUNK ${chunkNumber} took ${Date.now() - chunkStart}ms`);
        updateProgress();
      }));
    }
  
    await Promise.all(chunkPromises);
  
    onProgressUpdate(50);
    return results;
  };
  
  

  const isCleanVersion = async (track) => {
    try {
      let localItemName = track.name.toLowerCase();
      if (track.name.includes("-") && !track.name.toLowerCase().includes("- remix")) {
        localItemName = track.name.substring(0, track.name.indexOf("-")).trim().toLowerCase();
      }
      
      const artist = track.artists[0].name.toLowerCase();
      
      const query = `track:"${localItemName.replace(/"/g, '')}" artist:"${artist.replace(/"/g, '')}"`;
      
      const searchResult = await rateLimitedApi.call(
        spotifyApi.search.bind(spotifyApi), 
        query, 
        ['track'], 
        { limit: 5 }
      );
      
      const explicitTrack = searchResult.tracks.items.find(item => {
        const itemName = item.name.toLowerCase();
        const itemArtists = item.artists.map(a => a.name.toLowerCase());
        return item.explicit && itemArtists.includes(artist) && itemName === localItemName;
      });

      if (explicitTrack) {
        return { isClean: true, reason: "clean version exists", track };
      }

      return { isClean: false, reason: "no explicit version found", track };
    } catch (error) {
      console.error('Error finding clean track:', error);
      return { isClean: false, error };
    }
  };    
  
  const findCleanVersions = async (tracks) => {
    onProgressUpdate(60);
    
    console.log("tracks that need clean versions. in findclean: ", tracks);
    
    const foundCleanTracks = [];

    const batchSize = 10; 
    const batches = [];
    
    for (let i = 0; i < tracks.length; i += batchSize) {
      batches.push(tracks.slice(i, i + batchSize));
    }
    
    const totalBatches = batches.length;
    let completedBatches = 0;
    const progressStart = 65;
    const progressEnd = 95;
    
    onProgressUpdate(progressStart); 
    
    if (tracks.length === 0) {
      onProgressUpdate(progressEnd);
      return [];
    }
    
    for (const batch of batches) {
      const limit = pLimit(3); 
      
      const tasks = batch.map(track => limit(async () => {
        const name = track.name.toLowerCase();
        const artist = track.artists[0].name.toLowerCase();
        const cacheKey = `${name}-${artist}`;
        
        try {          
          const query = `track:"${name.replace(/"/g, '')}" artist:"${artist.replace(/"/g, '')}"`;
          
          const searchResult = await rateLimitedApi.call(
            spotifyApi.search.bind(spotifyApi), 
            query, 
            ['track'], 
            { limit: 5 }
          );
          
          const cleanTrack = searchResult.tracks.items.find(item => {
            const itemName = item.name.toLowerCase();
            const itemArtists = item.artists.map(a => a.name.toLowerCase());
            const isClean = !item.explicit;
            const isSameArtist = itemArtists.includes(artist);
            const isTitleClean = itemName.includes("clean") || itemName.includes("radio version") || itemName.includes("radio edit") || itemName.includes("radio mix");
            const isExactNameMatch = itemName === name;
        
            return isClean && isSameArtist && (isExactNameMatch || isTitleClean);
          });
          
          if (cleanTrack) {
            cleanTrack.reason = [];
            cleanTrack.reason.push("clean version");
            cleanTrack.playlist_track_number = track.playlist_track_number;
            setCachedTrack(cacheKey, cleanTrack);
            return { found: true, track: cleanTrack };
          }
          
          return { found: false };
        } catch (error) {
          console.error('Error finding clean track:', error);
          return { found: false, error };
        }
      }));
      
      const batchResults = await Promise.all(tasks);
      batchResults.forEach(result => {
        if (result.found) {
          foundCleanTracks.push(result.track);
        }
      });
      
      completedBatches++;
      const batchProgress = progressStart + 
          ((progressEnd - progressStart) * (completedBatches / totalBatches));
      onProgressUpdate(Math.round(batchProgress));
      
      if (completedBatches < totalBatches) {
        await delay(200);
      }
    }
    
    return foundCleanTracks;
  };

  // Pre-check cache for known clean alternatives
  const preCheckCache = (tracks) => {
    const preFound = [];
    const stillNeedSearch = [];
    console.log("original tracks passed into cache: ", tracks);
    
    tracks.forEach(track => {
      const cacheKey = `${track.name.toLowerCase()}-${track.artists[0].name.toLowerCase()}`;
      
      if (cleanTrackCache[cacheKey] && cleanTrackCache[cacheKey].data) {
        console.log("Clean cache key: ", cleanTrackCache[cacheKey].data);
        const cachedTrack = {...cleanTrackCache[cacheKey].data};
        cachedTrack.playlist_track_number = track.playlist_track_number;
        preFound.push(cachedTrack);
      } else {
        stillNeedSearch.push(track);
      }
    });
    
    return { preFound, stillNeedSearch };
  };
  
  // Main function to prepare the clean playlist
  const prepareCleanPlaylist = async (id) => {
    try {
      const totalStart = Date.now();
      let lastCheckpoint = totalStart;
  
      const logStep = (stepName) => {
        const now = Date.now();
        console.log(`${stepName} took ${now - lastCheckpoint}ms`);
        lastCheckpoint = now;
      };
  
      onProgressUpdate(1);
  
      console.log("Fetching playlist tracks");
      const playlistTracks = await getPlaylistTracks(id);
      logStep("getPlaylistTracks");
  
      console.log("Analyzing tracks data");
      const tracksData = await analyzeTracksData(playlistTracks);
      logStep("analyzeTracksData");
  
      console.log("tracks needing clean search: ", tracksData.tracksNeedingCleanSearch);
  
      const { preFound, stillNeedSearch } = preCheckCache(tracksData.tracksNeedingCleanSearch);
      logStep("preCheckCache");
  
      console.log("Finding clean versions for", stillNeedSearch.length, "tracks");
      const newFoundCleanTracks = stillNeedSearch.length > 0 
        ? await findCleanVersions(stillNeedSearch)
        : [];
      logStep("findCleanVersions");
  
      console.log("Finalizing playlist");
      onProgressUpdate(96);
  
      // Sorting & combining
      const trackUris = new Set();
      const allCleanTracks = [];
  
      tracksData.cleanTracks.forEach(track => {
        if (!trackUris.has(track.uri)) {
          trackUris.add(track.uri);
          allCleanTracks.push(track);
        }
      });
  
      const allFoundCleanTracks = [...preFound, ...newFoundCleanTracks];
      allFoundCleanTracks.forEach(track => {
        if (!trackUris.has(track.uri)) {
          trackUris.add(track.uri);
          allCleanTracks.push(track);
        }
      });
  
      const foundCleanTrackIds = new Set(allFoundCleanTracks.map(track => track.id));
      const exclTracksNeededClean = stillNeedSearch
        .filter(item => !newFoundCleanTracks.some(clean => 
          clean.name.toLowerCase() === item.name.toLowerCase() && 
          clean.artists[0].name.toLowerCase() === item.artists[0].name.toLowerCase()
        ));
  
      const excludedTracks = [
        ...tracksData.explicitTracks,
        ...exclTracksNeededClean
      ];
  
      allCleanTracks.sort((a,b) => a.playlist_track_number - b.playlist_track_number);
      excludedTracks.sort((a,b) => a.playlist_track_number - b.playlist_track_number);
  
      logStep("sorting & combining");
  
      onProgressUpdate(98);
      setTimeout(() => onProgressUpdate(100), 200);
  
      const totalEnd = Date.now();
      console.log(`Total cleaning time: ${totalEnd - totalStart}ms`);
  
      ReactGA.event({
        category: "Playlist",
        action: "Playlist Clean Duration",
        label: playlistId,
        value: totalEnd - totalStart,
        nonInteraction: true,
      });
  
      ReactGA.event({
        category: "Playlist",
        action: "Length of Playlist Cleaned",
        label: playlistId,
        value: totalTrackCount,
        nonInteraction: true,
      });
  
      return {
        name: `${playlistName} (auXmod Version)`,
        tracksAdded: allCleanTracks,
        excludedTracks: excludedTracks,
      };
    } catch (error) {
      console.error("Error creating clean playlist:", error);
      throw error;
    }
  };
  
  return await prepareCleanPlaylist(playlistId, onProgressUpdate);
};

export default CleanPlaylist;