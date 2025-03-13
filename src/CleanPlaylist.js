import pLimit from 'p-limit';
import { backOff } from 'exponential-backoff';
import spotifyApi from './spotifyApi';
import FilterScores from './FilterScores.js';
import ReactGA from 'react-ga4';


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
      // Get playlist metadata first
      const response = await rateLimitedApi.call(spotifyApi.getPlaylist.bind(spotifyApi), id);
      playlistName = response.name;
      
      let allTracks = [];
      let { items, next } = response.tracks;
      allTracks = allTracks.concat(items.filter(isValidTrack));
      
      totalTrackCount = response.tracks.total;
      
      // Set initial progress
      onProgressUpdate(2); // Start with 2% for getting initial playlist data
      
      // If we got all tracks in the first request, go straight to 10%
      if (!next) {
        onProgressUpdate(10);
        return allTracks;
      }
      
      // Calculate how many pages we'll need to fetch
      const fetchedSoFar = allTracks.length;
      const remainingTracks = totalTrackCount - fetchedSoFar;
      const expectedPages = Math.ceil(remainingTracks / 100);
      
      // Calculate progress increment per page
      const progressStart = 2;
      const progressEnd = 10;
      const progressPerPage = (progressEnd - progressStart) / (expectedPages + 1);
      let currentProgress = progressStart;
      
      // Update progress after initial batch
      currentProgress += progressPerPage;
      onProgressUpdate(Math.round(currentProgress));
      
      let pagesFetched = 0;
      
      // Fetch remaining tracks in batches
      while (next) {
        const pagedResponse = await rateLimitedApi.call(
          spotifyApi.getPlaylistTracks.bind(spotifyApi), 
          id, 
          { offset: allTracks.length, limit: 100 }
        );
        
        const validTracks = pagedResponse.items.filter(isValidTrack);
        allTracks = allTracks.concat(validTracks);
        next = pagedResponse.next;
        
        // Update progress after each page
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

  // Score tracks 
  const analyzeTracksData = async (tracks) => {
    onProgressUpdate(11); // Start of analysis phase
    
    const results = {
      explicitTracks: [],
      cleanTracks: [],
      tracksNeedingCleanSearch: []
    };
    
    const batchSize = 50; 
    const batches = [];
    
    for (let i = 0; i < tracks.length; i += batchSize) {
      batches.push(tracks.slice(i, i + batchSize));
    }

    const totalBatches = batches.length;
    let completedBatches = 0;
    const progressStart = 15; 
    const progressEnd = 50;   
    
    // Update at beginning of analysis phase
    onProgressUpdate(progressStart);
        
    for (const batch of batches) {
      const limit = pLimit(20); 
      
      const tasks = batch.map(trackItem => limit(async () => {
        try {
          const item = trackItem.track;
          const cacheKey = `${item.name.toLowerCase()}-${item.artists[0].name.toLowerCase()}`;
          
          // If there's a clean version in cache, use it 
          if (cleanTrackCache[cacheKey] && cleanTrackCache[cacheKey].data) {
            return { type: 'clean', track: cleanTrackCache[cacheKey].data };
          }
          
          // Score the track
          item.score = await FilterScores(item.name, item.artists[0].name);
          item.reason = [];
          let failedFilter = false;
          
          if (item.score) {
            if ((chosenFilters.includes("Profanity")) && (item.score.profanity || item.explicit)) {
              item.reason.push("Profanity");
              failedFilter = true;
            }
            if (chosenFilters.includes("Violence") && item.score.violence > 0.50) {
              item.reason.push("Violence");
              failedFilter = true;
            }
            if (chosenFilters.includes("Sexual") && item.score.sexually_explicit > 0.50) {
              item.reason.push("Sexual");
              failedFilter = true;
            }
          } else {
            item.reason.push("No score");
            failedFilter = true;
          }
          
          if (failedFilter) {
            // Only search for clean versions if it's explicit and only fails profanity filter
            if (item.explicit && item.reason.length === 1 && item.reason[0] === "Profanity") {
              return { type: 'needs-clean-search', track: item };
            } else {
              return { type: 'explicit', track: item };
            }
          } else {
            return { type: 'clean', track: item };
          }
        } catch (error) {
          console.error("Error analyzing track:", error);
          return { type: 'error', error };
        }
      }));

      
      const batchResults = await Promise.all(tasks);
      
      // Process results
      for (const result of batchResults) {
        if (result.type === 'clean') {
          results.cleanTracks.push(result.track);
        } else if (result.type === 'explicit') {
          results.explicitTracks.push(result.track);
        } else if (result.type === 'needs-clean-search') {
          results.tracksNeedingCleanSearch.push(result.track);
        }
      }
      
      completedBatches++;
      const batchProgress = progressStart + 
          ((progressEnd - progressStart) * (completedBatches / totalBatches));
      onProgressUpdate(Math.round(batchProgress));
      
      // Small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    onProgressUpdate(55); // Intermediate progress update before find clean versions step
    
    return results;
  };
  
  const findCleanVersions = async (tracks) => {
    onProgressUpdate(60); // Start of find clean versions phase
    
    console.log("tracks that need clean versions. in findclean: ", tracks);
    
    const foundCleanTracks = [];

    const batchSize = 25; // Process 25 tracks at a time
    const batches = [];
    
    for (let i = 0; i < tracks.length; i += batchSize) {
      batches.push(tracks.slice(i, i + batchSize));
    }
    
    const totalBatches = batches.length;
    let completedBatches = 0;
    const progressStart = 65; // starting at 65%
    const progressEnd = 95;   
    
    onProgressUpdate(progressStart); 
    
    // If no tracks need clean versions, skip ahead
    if (tracks.length === 0) {
      onProgressUpdate(progressEnd);
      return [];
    }
    
    // Process each batch
    for (const batch of batches) {
      const limit = pLimit(15); // Process 15 tracks concurrently
      
      const tasks = batch.map(track => limit(async () => {
        const name = track.name.toLowerCase();
        const artist = track.artists[0].name.toLowerCase();
        const cacheKey = `${name}-${artist}`;
        
        // Check cache first
        if (cleanTrackCache[cacheKey] && cleanTrackCache[cacheKey].data) {
          return { found: true, track: cleanTrackCache[cacheKey].data };
        }
        
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
            const isTitleClean = itemName.includes("clean") || itemName.includes("radio");
            const isExactNameMatch = itemName === name;
        
            return isClean && isSameArtist && (isExactNameMatch || isTitleClean);
          });
          
          if (cleanTrack) {
            setCachedTrack(cacheKey, cleanTrack);
            return { found: true, track: cleanTrack };
          }
          
          return { found: false };
        } catch (error) {
          console.error('Error finding clean track:', error);
          return { found: false, error };
        }
      }));
      
      completedBatches++;
      const batchProgress = progressStart + 
          ((progressEnd - progressStart) * (completedBatches / totalBatches));
      onProgressUpdate(Math.round(batchProgress));
      
      const batchResults = await Promise.all(tasks);
      batchResults.forEach(result => {
        if (result.found) {
          foundCleanTracks.push(result.track);
        }
      });
    }
    
    return foundCleanTracks;
  };

  
  // Main function to prepare the clean playlist
  const prepareCleanPlaylist = async (id) => {
    try {
      const startTime = Date.now();
      
      // Initial progress update
      onProgressUpdate(1);
      
      // 1. Fetch tracks (1-10% progress)
      console.log("Fetching playlist tracks");
      const playlistTracks = await getPlaylistTracks(id);
      
      // 2. Analyze tracks (11-55% progress)
      console.log("Analyzing tracks data");
      const tracksData = await analyzeTracksData(playlistTracks);
      
      // 3. Find clean versions (60-95% progress)
      console.log("Finding clean versions for", tracksData.tracksNeedingCleanSearch.length, "tracks");
      const foundCleanTracks = tracksData.tracksNeedingCleanSearch.length > 0 
        ? await findCleanVersions(tracksData.tracksNeedingCleanSearch)
        : [];
      
      // 4. Finalize results (95-100% progress)
      console.log("Finalizing playlist");
      onProgressUpdate(96); // Start of finalization phase

      // prevents duplicates:
      const trackUris = new Set();
      const allCleanTracks = [];

      // First add all the initially clean tracks
      tracksData.cleanTracks.forEach(track => {
        if (!trackUris.has(track.uri)) {
          trackUris.add(track.uri);
          allCleanTracks.push(track);
        }
      });

      // Then add found clean tracks
      foundCleanTracks.forEach(track => {
        if (!trackUris.has(track.uri)) {
          trackUris.add(track.uri);
          allCleanTracks.push(track);
        }
      });
            
      
      // Determine which tracks were excluded (those that needed clean versions but none were found)
      const foundCleanTrackIds = new Set(foundCleanTracks.map(track => track.id));
      const excludedTracks = [
        ...tracksData.explicitTracks,
        ...tracksData.tracksNeedingCleanSearch.filter(track => 
          !foundCleanTrackIds.has(track.id)
        )
      ];
 
      onProgressUpdate(98); // Almost done
      
      // Small delay to show progress completion
      setTimeout(() => onProgressUpdate(100), 200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log("Cleaning time: ", duration)

      // Google Analytics tracking
      ReactGA.event({
        category: "Playlist",
        action: "Playlist Clean Duration",
        label: playlistId,
        value: duration,
        nonInteraction: true,
      });
      // track count 
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