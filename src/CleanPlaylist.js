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
  // left off here, I have loud as a chosen filter so now have to add it to logic

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
      
      const tasks = batch.map((trackItem, index) => limit(async () => {
        try {
          const item = trackItem.track;

          item.playlist_track_number = tracks.indexOf(trackItem);

          // Score the track
          item.score = await FilterScores(item.name, item.artists[0].name, chosenFilters);
          item.reason = [];
          let failedFilter = false;
            
          if (item.score && item.score.status === 'success') {
            if ((chosenFilters.find(filter => filter.id === "profanity")) && (item.score.profanity.hasProfanity)) {
              item.reason.push("Profanity");
              failedFilter = true;
            }
            if ((chosenFilters.find(filter => filter.id === "violence")) && item.score.violence > 0.40) {
              item.reason.push("Violence");
              failedFilter = true;
            }
            if ((chosenFilters.find(filter => filter.id === "sexual")) && item.score.sexually_explicit > 0.50) {
              item.reason.push("Sexual");
              failedFilter = true;
            }
          } else {
         // Handle failed status
            if(item.score && item.score.status === 'failed'){
              item.reason.push("Error");
              return { type: 'explicit', track: item }; // mark it for exclusion
            } else {
              item.reason.push("No score");
              failedFilter = true;
            }
          }
          // is the clean version

          if (failedFilter) {
            // Only search for clean versions if it's explicit and only fails profanity filter
            if ((item.reason.length === 1) && (item.reason[0] === "Profanity")) {
              if(item.explicit){
                return { type: 'needs-clean-search', track: item };
              }
              const cleanCheck = await isCleanVersion(item)

              if(cleanCheck.isClean){
                item.reason = ["clean version"]
                return { type: 'clean', track: item };
              }else{
                return { type: 'explicit', track: item };
              }
            }else{
              return { type: 'explicit', track: item };
            }
          } else {
            item.reason.push("passed filters")
            return { type: 'clean', track: item };
          }
        } catch (error) {
          console.error("Error analyzing track:", error);
          return { type: 'error', error };
        }
      }));
      
      const batchResults = await Promise.all(tasks);
      console.log("batch results: ", batchResults)

      
      for (const result of batchResults) {
        console.log("RESULT: ", result)
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

    const isCleanVersion = async (track) => {
      try {
        const name = track.name.toLowerCase();
        const artist = track.artists[0].name.toLowerCase();
        
        const query = `track:"${name.replace(/"/g, '')}" artist:"${artist.replace(/"/g, '')}"`;
        
        const searchResult = await rateLimitedApi.call(
          spotifyApi.search.bind(spotifyApi), 
          query, 
          ['track'], 
          { limit: 5 }
        );
        
        const explicitTrack = searchResult.tracks.items.find(item => {
          const itemName = item.name.toLowerCase();
          const itemArtists = item.artists.map(a => a.name.toLowerCase());
          return item.explicit && itemArtists.includes(artist) && itemName === name;
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
        
        // // Check cache first
        // if (cleanTrackCache[cacheKey] && cleanTrackCache[cacheKey].data) {
        //   cleanTrackCache[cacheKey].data.playlist_track_number = track.playlist_track_number
        //   return { found: true, track: cleanTrackCache[cacheKey].data };
        // }
        
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
            const isTitleClean = itemName.includes("clean") || itemName.includes("radio version") || itemName.includes("radio edit")  ;
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

  /// for tracks taken from cache, preserve order
  // Pre-check cache for known clean alternatives
  const preCheckCache = (tracks) => {
    const preFound = [];
    const stillNeedSearch = [];
    console.log("original tracks passed into cache: ", tracks)
    
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
      const startTime = Date.now();
      
      // Initial progress update
      onProgressUpdate(1);
      
      // 1. Fetch tracks (1-10% progress)
      console.log("Fetching playlist tracks");
      const playlistTracks = await getPlaylistTracks(id);
      console.log(playlistTracks)


      
      // 2. Analyze tracks (11-55% progress)
      console.log("Analyzing tracks data");
      const tracksData = await analyzeTracksData(playlistTracks);

      console.log("tracks needing clean search: ", tracksData.tracksNeedingCleanSearch)
      
      // 3. Pre-check cache for known clean alternatives
      const { preFound, stillNeedSearch } = preCheckCache(tracksData.tracksNeedingCleanSearch);
      console.log("Found", preFound.length, "tracks in cache, still need to search for", stillNeedSearch.length);
      console.log("still need search array", stillNeedSearch);

      
      // 4. Find clean versions (60-95% progress)
      console.log("Finding clean versions for", stillNeedSearch.length, "tracks");
      const newFoundCleanTracks = stillNeedSearch.length > 0 
        ? await findCleanVersions(stillNeedSearch)
        : [];
      
      // 5. Finalize results (95-100% progress)
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

      // Then add all found clean tracks (both from cache and newly found)
      const allFoundCleanTracks = [...preFound, ...newFoundCleanTracks];
      allFoundCleanTracks.forEach(track => {
        if (!trackUris.has(track.uri)) {
          trackUris.add(track.uri);
          allCleanTracks.push(track);
        }
      });
      
      // Determine which tracks were excluded (those that needed clean versions but none were found)
      const foundCleanTrackIds = new Set(allFoundCleanTracks.map(track => track.id));
      const exclTracksNeededClean = stillNeedSearch
        .filter(item => !newFoundCleanTracks.some(clean => 
          clean.name.toLowerCase() === item.name.toLowerCase() && 
          clean.artists[0].name.toLowerCase() === item.artists[0].name.toLowerCase()
        ))
        .map(item => item);
      
      const excludedTracks = [
        ...tracksData.explicitTracks,
        ...exclTracksNeededClean
      ];

      allCleanTracks.sort((a,b) => {
        return a.playlist_track_number - b.playlist_track_number
      })

      excludedTracks.sort((a,b) =>{
        return a.playlist_track_number - b.playlist_track_number
      })
 
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