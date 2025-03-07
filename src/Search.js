import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, Container, Typography, Box, Skeleton, Button } from '@mui/material';
import ListItems from './ListItems';
import Filter from './Filter';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import spotifyApi from './spotifyApi';

export default function Search({ sendItemSelected }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('My Library');
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [searchList, setSearchList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMoreToFetch, setHasMoreToFetch] = useState(true);
  const [loadedAllUserPlaylists, setLoadedAllUserPlaylists] = useState(false);
  
  // Track playlists we've already loaded to avoid duplicates
  const [loadedPlaylistIds, setLoadedPlaylistIds] = useState(new Set());

  const debounceTimeout = useRef(null);
  const ITEMS_PER_FETCH = 20;

  // Get User Playlists with pagination
  async function getUserPlaylists(offset = 0, limit = ITEMS_PER_FETCH) {
    setIsLoading(true);
    try {
      console.log(`Fetching user playlists: offset=${offset}, limit=${limit}`);
      const response = await spotifyApi.getUserPlaylists({ 
        limit: limit, 
        offset: offset 
      });
      
      if (!response || response.items.length === 0) {
        setHasMoreToFetch(false);
        setLoadedAllUserPlaylists(true);
        setIsLoading(false);
        return {
          items: [],
          total: response?.total || 0
        };
      }
      
      // Track loaded playlist IDs to avoid duplicates
      const newPlaylistIds = new Set([...loadedPlaylistIds]);
      const uniqueItems = response.items.filter(item => {
        if (newPlaylistIds.has(item.id)) {
          return false;
        }
        newPlaylistIds.add(item.id);
        return true;
      });
      
      setLoadedPlaylistIds(newPlaylistIds);
      
      // Check if we have more to fetch
      const hasMore = offset + response.items.length < response.total;
      setHasMoreToFetch(hasMore);
      
      if (!hasMore) {
        setLoadedAllUserPlaylists(true);
      }
      
      setIsLoading(false);
      return {
        items: uniqueItems,
        total: response.total
      };
    } catch (e) {
      console.log("Error fetching user playlists:", e);
      setIsLoading(false);
      setHasMoreToFetch(false);
      return { items: [], total: 0 };
    }
  }

  // Load all user playlists for search
  async function loadAllUserPlaylists() {
    if (loadedAllUserPlaylists) return userPlaylists;
    
    setIsLoading(true);
    let allPlaylists = [...userPlaylists];
    let offset = userPlaylists.length;
    let hasMore = true;
    
    // Use a Set to track playlist IDs we've already loaded
    const seenIds = new Set(userPlaylists.map(p => p.id));
    
    while (hasMore) {
      try {
        const response = await spotifyApi.getUserPlaylists({ 
          limit: 50, // Use a larger limit to reduce API calls
          offset: offset 
        });
        
        if (!response || response.items.length === 0) {
          hasMore = false;
        } else {
          // Only add playlists we haven't seen before
          const uniqueItems = response.items.filter(item => {
            if (seenIds.has(item.id)) return false;
            seenIds.add(item.id);
            return true;
          });
          
          allPlaylists = [...allPlaylists, ...uniqueItems];
          offset += response.items.length;
          hasMore = offset < response.total;
        }
      } catch (e) {
        console.log("Error loading all playlists:", e);
        hasMore = false;
      }
    }
    
    setUserPlaylists(allPlaylists);
    setLoadedAllUserPlaylists(true);
    setIsLoading(false);
    return allPlaylists;
  }

  // Search all playlists in Spotify with pagination
  async function searchAllPlaylists(value, offset = 0, limit = ITEMS_PER_FETCH) {
    setIsLoading(true);
    try {
      console.log(`Searching all playlists: "${value}", offset=${offset}, limit=${limit}`);
      const response = await spotifyApi.searchPlaylists(value, { 
        limit: limit, 
        offset: offset 
      });
      
      const items = response.playlists.items;
      const total = response.playlists.total;
      
      // Track loaded playlist IDs to avoid duplicates
      const newPlaylistIds = new Set([...loadedPlaylistIds]);
      const uniqueItems = items.filter(item => {
        if (newPlaylistIds.has(item.id)) {
          return false;
        }
        newPlaylistIds.add(item.id);
        return true;
      });
      
      setLoadedPlaylistIds(newPlaylistIds);
      setHasMoreToFetch(offset + items.length < total);
      setIsLoading(false);
      
      return {
        items: uniqueItems,
        total: total
      };
    } catch (e) {
      console.log("Error searching all playlists:", e);
      setIsLoading(false);
      setHasMoreToFetch(false);
      return { items: [], total: 0 };
    }
  }

  // Sorting function that prioritizes "starts with" matches
  const sortPlaylists = (playlists, searchValue) => {
    if (!searchValue) return playlists;
    
    const normalizedSearch = searchValue.toLowerCase();
    
    // Filter playlists that start with the search term
    const startsWith = playlists.filter((playlist) => 
      playlist.name.toLowerCase().startsWith(normalizedSearch)
    );

    // Filter playlists that contain the search term (but don't start with it)
    const contains = playlists.filter((playlist) => 
      !playlist.name.toLowerCase().startsWith(normalizedSearch) &&
      playlist.name.toLowerCase().includes(normalizedSearch)
    );

    return [
      ...startsWith.sort((a, b) => a.name.localeCompare(b.name)), 
      ...contains.sort((a, b) => a.name.localeCompare(b.name))     
    ];
  };

  // Handle search in My Library
  const searchMyLibrary = async (query) => {
    setIsLoading(true);
    
    // Reset tracking of loaded playlist IDs when starting a new search
    setLoadedPlaylistIds(new Set());
    
    if (query) {
      // If we're searching, we need to load all playlists first
      let allPlaylists = userPlaylists;
      if (!loadedAllUserPlaylists) {
        allPlaylists = await loadAllUserPlaylists();
      }
      
      const normalizedQuery = query.toLowerCase();
      const filteredPlaylists = allPlaylists.filter(playlist => 
        playlist.name.toLowerCase().includes(normalizedQuery)
      );
      
      const sortedResults = sortPlaylists(filteredPlaylists, query);
      
      // Add these IDs to our tracking set
      const newPlaylistIds = new Set();
      sortedResults.slice(0, ITEMS_PER_FETCH).forEach(playlist => {
        newPlaylistIds.add(playlist.id);
      });
      setLoadedPlaylistIds(newPlaylistIds);
      
      setSearchList(sortedResults.slice(0, ITEMS_PER_FETCH));
      setTotalResults(sortedResults.length);
      setHasMoreToFetch(sortedResults.length > ITEMS_PER_FETCH);
    } else {
      // No query, show initial playlists
      const results = await getUserPlaylists(0, ITEMS_PER_FETCH);
      setSearchList(results.items);
      setTotalResults(results.total);
      setHasMoreToFetch(results.items.length < results.total);
    }
    
    setIsLoading(false);
  };

  // Handle search in All of Spotify
  const searchAllOfSpotify = async (query, offset = 0, isLoadMore = false) => {
    // Reset tracking of loaded playlist IDs when starting a new search
    if (!isLoadMore) {
      setLoadedPlaylistIds(new Set());
    }
    
    if (!query) {
      setSearchList([]);
      setTotalResults(0);
      setHasMoreToFetch(false);
      return;
    }
    
    const results = await searchAllPlaylists(query, offset, ITEMS_PER_FETCH);
    
    if (isLoadMore) {
      setSearchList(prevList => [...prevList, ...results.items]);
    } else {
      setSearchList(results.items);
    }
    
    setTotalResults(results.total);
    setHasMoreToFetch(results.items.length > 0 && searchList.length + results.items.length < results.total);
  };

  // Load more items for My Library search
  const loadMoreMyLibrarySearch = () => {
    if (!searchQuery) {
      // Loading more without search query - just fetch next batch from API
      return handleShowMore();
    }
    
    // With search query, we load more from our filtered results
    const normalizedQuery = searchQuery.toLowerCase();
    const filteredPlaylists = userPlaylists.filter(playlist => 
      playlist.name.toLowerCase().includes(normalizedQuery)
    );
    
    const sortedResults = sortPlaylists(filteredPlaylists, searchQuery);
    
    // Get only the playlists we haven't loaded yet
    const currentIds = new Set(searchList.map(p => p.id));
    const nextBatch = sortedResults.filter(playlist => !currentIds.has(playlist.id)).slice(0, ITEMS_PER_FETCH);
    
    // Add these IDs to our tracking set
    const newPlaylistIds = new Set([...loadedPlaylistIds]);
    nextBatch.forEach(playlist => {
      newPlaylistIds.add(playlist.id);
    });
    setLoadedPlaylistIds(newPlaylistIds);
    
    setSearchList(prevList => [...prevList, ...nextBatch]);
    setHasMoreToFetch(searchList.length + nextBatch.length < sortedResults.length);
  };

  // Load initial data when component mounts or filter changes
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setSearchList([]);
      setHasMoreToFetch(true);
      setSearchQuery('');
      setLoadedAllUserPlaylists(false);
      setLoadedPlaylistIds(new Set());
      
      if (selectedFilter === 'My Library') {
        const results = await getUserPlaylists(0, ITEMS_PER_FETCH);
        setUserPlaylists(results.items);
        setSearchList(results.items);
        setTotalResults(results.total);
        setHasMoreToFetch(results.items.length < results.total);
      } else {
        // For "All of Spotify" filter, we don't load anything until search
        setSearchList([]);
        setTotalResults(0);
        setHasMoreToFetch(false);
      }
      
      setIsLoading(false);
    };
    
    loadInitialData();
  }, [selectedFilter]);

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    clearTimeout(debounceTimeout.current);
    
    debounceTimeout.current = setTimeout(() => {
      if (selectedFilter === 'My Library') {
        searchMyLibrary(query);
      } else {
        searchAllOfSpotify(query, 0, false);
      }
    }, 500);
  };
  
  // Handle Show More button click
  const handleShowMore = async () => {
    if (isLoading || !hasMoreToFetch) return;
    
    setIsLoading(true);
    
    if (selectedFilter === 'My Library') {
      if (searchQuery) {
        // If searching in My Library, load more from filtered results
        loadMoreMyLibrarySearch();
      } else {
        // If browsing My Library, fetch next batch
        const results = await getUserPlaylists(searchList.length, ITEMS_PER_FETCH);
        setUserPlaylists(prevPlaylists => [...prevPlaylists, ...results.items]);
        setSearchList(prevList => [...prevList, ...results.items]);
        setHasMoreToFetch(results.items.length > 0 && searchList.length + results.items.length < results.total);
      }
    } else {
      // If in All of Spotify, fetch next batch of search results
      await searchAllOfSpotify(searchQuery, searchList.length, true);
    }
    
    setIsLoading(false);
  };

  // Handle filter change
  const handleFilterStatus = (filtersList) => {
    filtersList.forEach((filter) => {
      if (filter.isSelected) {
        setSelectedFilter(filter.label);
      }
    });
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <Box sx={{ p: 1 }}>
      {[1, 2, 3, 4].map((item) => (
        <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="rounded" width={50} height={50} sx={{ mr: 2 }} />
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
      ))}
    </Box>
  );

  // Calculate remaining items for "Show More" button
  const remainingItems = totalResults - searchList.length;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Filter Buttons */}
      <Filter sendSearchFilterStatus={handleFilterStatus} type="search" />
      
      {/* Search Bar */}
      <Container sx={{ m: 'auto', display: 'flex', px: 0 }}>
        <TextField
          variant="outlined"
          label="Search playlist name"
          fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            borderRadius: '50px',
            width: '100%',
            margin: 'auto',
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              borderRadius: '50px',
            },
            '& .MuiOutlinedInput-input': {
              fontSize: '16px',
            }          
          }}
        />
      </Container>
      
      {/* Search Results or Skeleton */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {isLoading && searchList.length === 0 ? (
          <SkeletonLoader />
        ) : (
          <>
            {searchList.length > 0 && (
              <Box sx={{ 
                overflow: 'auto', 
                flexGrow: 1,
                scrollbarColor: 'rgba(0, 0, 0, 0.5) rgba(0, 0, 0, 0)',
              }}>
                <ListItems 
                  sendData={sendItemSelected} 
                  list={searchList} 
                />
              </Box>
            )}
            
            {/* Show More Button */}
            {hasMoreToFetch && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                p: 1, 
                borderTop: '1px solid #eee'
              }}>
                <Button 
                  variant="text" 
                  color="primary" 
                  onClick={handleShowMore}
                  endIcon={<ExpandMoreIcon />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : `Show more (${Math.max(0, totalResults - searchList.length)} more)`}
                </Button>
              </Box>
            )}
            
            {/* No Results Message */}
            {!isLoading && searchList.length === 0 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                flexGrow: 1,
                p: 3
              }}>
                <Typography variant="body1" color="text.secondary">
                  {selectedFilter === 'My Library' && !searchQuery ? 
                    "You don't have any playlists yet." : 
                    "No playlists found. Try a different search term."}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}