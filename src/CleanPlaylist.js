import pLimit from 'p-limit';
import spotifyApi from './spotifyApi';
import FilterScores from './FilterScores.js'
import Filter from './Filter';

const CleanPlaylist = async (playlistId, chosenFilters, onProgressUpdate) => {
  console.log("CLEAN PLAYLIST COMP: The user and playlist id's are:", playlistId);
  console.log("CLEAN P COMP: Chosen filters - ", chosenFilters)

  let playlistName = '';

  const cleanTrackCache = JSON.parse(localStorage.getItem('cleanTrackCache')) || {};

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
      const response = await spotifyApi.getPlaylist(id);
      playlistName = response.name;

      let allTracks = [];
      let { items, next } = response.tracks;

      allTracks = allTracks.concat(items);

      while (next) {
        const pagedResponse = await spotifyApi.getPlaylistTracks(id, {
          offset: allTracks.length, 
          limit: 100,               
        });
        allTracks = allTracks.concat(pagedResponse.items);
        next = pagedResponse.next;
      }

      const validTracks = allTracks.filter((item) => isValidTrack(item));

      console.log(validTracks.length)
      console.log(validTracks);
      return validTracks;
    } catch (error) {
      console.error("Error fetching playlist data:", error);
    }
  };

  const trackScore = async(title, artist) =>{
    return await FilterScores(title, artist);
  } 
 
  const getTracksData = async (tracks, onProgressUpdate) => {
    try {
      const explicitList = [];
      const cleanList = [];
  
      for (let i = 0; i < tracks.length; i++) {
        console.log("Tracks in get data", tracks)
        const item = tracks[i].track;
        console.log("item in get tracks: ", item)
        
        // Update progress for Phase 1 (75%)
        const progress = Math.round(((i + 1) / tracks.length) * 75);  
        console.log("progress in get tracks data", progress)
        onProgressUpdate(progress);  // Update progress as a percentage
  
        item.score = await trackScore(item.name, item.artists[0].name);
        item.reason = [];
        let failedFilter = false;
  
        if (item.score) {
          // Checking filters
          if ((chosenFilters.includes("Profanity")) && (item.score.profanity || item.explicit)) {
            item.reason.push("Profanity");
            failedFilter = true;
          }
          if (chosenFilters.includes("Violence") && item.score.violence > 0.50 ) {
            item.reason.push("Violence");
            failedFilter = true;
          }
          if (chosenFilters.includes("Sexual") && item.score.sexually_explicit > 0.50 ) {
            item.reason.push("Sexual");
            failedFilter = true;
          }
        } else {
          item.reason.push("No score");
          failedFilter = true;
        }
  
        // Check if it's already clean
        if (!item.explicit && item.reason.length === 1 && item.reason.includes("Profanity")) {
          const confirmedClean = await findCleanTrack(item);
          if (confirmedClean) {
            cleanList.push(item);
            continue;
          }
        }
  
        if (failedFilter) {
          explicitList.push(item);
        } else {
          cleanList.push(item);
        }
      }
  
      return { explicitTracks: explicitList, cleanTracks: cleanList };
    } catch (error) {
      console.error("Error fetching tracks data:", error);
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const findCleanTrack = async (track) => {
    const name = track.name.toLowerCase();
    const artist = track.artists[0].name.toLowerCase();
    const cacheKey = `${name}-${artist}`;

    if (cleanTrackCache[cacheKey]) {
      return cleanTrackCache[cacheKey];
    }

    try {
      await delay(300);

      const searchResult = await spotifyApi.search(`track:${name} artist:${artist}`, ['track']);
      console.log(searchResult);
      const cleanTrack = searchResult.tracks.items.find((item) => {
        console.log(item);
        const isClean = !item.explicit;
        const isSameArtist = item.artists.some((a) => a.name.toLowerCase() === artist);
        const isTitleClean =
          item.name.toLowerCase().includes('clean') ||
          item.name.toLowerCase().includes('radio');

        return isClean && isSameArtist && (item.name.toLowerCase() === name || isTitleClean);
      });

      if (cleanTrack) {
        cleanTrackCache[cacheKey] = cleanTrack;
        localStorage.setItem('cleanTrackCache', JSON.stringify(cleanTrackCache));
      }

      return cleanTrack || null;
    } catch (error) {
      console.error('Error finding clean track:', error);
      return null;
    }
  };

  const prepareCleanPlaylist = async (id, onProgressUpdate) => {
    console.log("prepareCleanPlaylist id:", id);
    try {
      console.log("Fetching playlist tracks for id:", id);
      const playlistTracks = await getPlaylistTracks(id);
      console.log("Playlist tracks:", playlistTracks);
  
      const tracksData = await getTracksData(playlistTracks, onProgressUpdate);
      console.log("Tracks data:", tracksData);
      
      const excludedTracks = [...tracksData.explicitTracks];
      const foundCleanTracks = [];
      
      // Filter tracks that should be checked for clean versions
      if(tracksData.explicitTracks.length > 0) {
        const tracksToCheck = tracksData.explicitTracks
          .filter((track) => track.reason.length === 1 && track.reason[0] === 'Profanity' && track.explicit);
        
        if(tracksToCheck.length > 0) {
          // Create a progress tracking mechanism
          let completedCount = 0;
          const totalTracks = tracksToCheck.length;
          
          // Set up a progress update function that will be called after each track
          const updateProgress = () => {
            completedCount++;
            const progress = 75 + Math.round((completedCount / totalTracks) * 25);
            
            // Always log progress
            console.log("progress in prepare playlist", progress);
            
            // Update the UI
            onProgressUpdate(progress);
          };
          
          // Use pLimit to limit concurrency
          const limit = pLimit(10); // Process 5 tracks concurrently for optimal performance
          
          // Create tasks
          const tasks = tracksToCheck.map(track => 
            limit(async () => {
              try {
                const cleanTrack = await findCleanTrack(track);
                
                if (cleanTrack) {
                  foundCleanTracks.push(cleanTrack);
                  const trackIndex = excludedTracks.findIndex((t) => t.id === track.id);
                  if (trackIndex !== -1) {
                    excludedTracks.splice(trackIndex, 1);
                  }
                }
              } catch (error) {
                console.error("Error processing track:", error);
              } finally {
                // Update progress after each track completes (success or failure)
                updateProgress();
              }
            })
          );
          
          // Execute all tasks in parallel with controlled concurrency
          await Promise.all(tasks);
        }
      }
      
      console.log("Found Clean Tracks:", foundCleanTracks);
      console.log("Final Excluded Tracks:", excludedTracks);
      
      const allCleanTracks = [...tracksData.cleanTracks, ...foundCleanTracks];
      console.log("Final Clean tracks", allCleanTracks);

      return {
        name: `${playlistName} (Clean)`,
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