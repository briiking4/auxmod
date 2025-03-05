import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, Container, Typography, Box } from '@mui/material';
import ListItems from './ListItems';
import Filter from './Filter';
import SearchIcon from '@mui/icons-material/Search';
import spotifyApi from './spotifyApi';

export default function Search({ sendItemSelected }) {
  const [selectedItem, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('My Library');
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [searchList, setSearchList] = useState(null);
  const [initialPlaylists, setInitialPlaylists] = useState([]);  // Holds the first 4 playlists


  const debounceTimeout = useRef(null);

  // Get the Users Playlists to be able to search within them
  async function getUserPlaylists() {
    let total = 1;
    let itemCount = 0;
    let userPlaylistsList = [];
    
    try {
      let response = await spotifyApi.getUserPlaylists({ limit: 50, offset: 0 });
      
      if (response.items.length === 0 || response.total === 0) {
        return null;
      }
      
      itemCount = response.items.length;
      total = response.total;
      userPlaylistsList = userPlaylistsList.concat(response.items);
      
      while (itemCount < total) {
        response = await spotifyApi.getUserPlaylists({ limit: 50, offset: itemCount });
        itemCount += response.items.length;
        userPlaylistsList = userPlaylistsList.concat(response.items);
      }
      
      return userPlaylistsList;
    } catch (e) {
      console.log(e);
      return null; 
    }
  }

  // Searching for all playlists in Spotify
  async function searchAllPlaylists(value) {
    try{
      let response = await spotifyApi.searchPlaylists(value);
      let response_items = await response.playlists.items;
      return response_items;
    } catch(e){
      console.log(e)
    }
  }

  // Searching within the Users Library Only
  async function searchUserPlaylists(value) {
    if(userPlaylists){
      let search_list = [];
      for (let i of userPlaylists) {
        let name = i.name.toLowerCase();
        if (name.includes(value)) {
          search_list.push(i);
        }
      }
      return search_list;
    }else{
      return null;
    }
  }

  // Sorting function that prioritizes "starts with" matches
  const sortPlaylists = (playlists, searchValue) => {
    // 1. Filter playlists that start with the search term
    const startsWith = playlists.filter((playlist) => 
      playlist.name.toLowerCase().startsWith(searchValue.toLowerCase())
    );

    // 2. Filter playlists that contain the search term (but don't start with it)
    const contains = playlists.filter((playlist) => 
      !playlist.name.toLowerCase().startsWith(searchValue.toLowerCase()) &&
      playlist.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    return [
      ...startsWith.sort((a, b) => a.name.localeCompare(b.name)), 
      ...contains.sort((a, b) => a.name.localeCompare(b.name))     
    ];
  };

  // Search depending on the searchQuery value
  const search = async (value, filter) => {
    let searchValue = value.toLowerCase();
    let searchResults = [];
    
    if (filter === 'My Library') {
      searchResults = await searchUserPlaylists(searchValue);
    } else {
      searchResults = await searchAllPlaylists(searchValue);
    }
    console.log("search results", searchResults);

    // Apply the new sorting logic
    if(searchResults){
      setSearchList(sortPlaylists(searchResults, searchValue));
    }
  };

  // Initial fetch of user playlists when the component mounts
  useEffect(() => {
    if (selectedFilter === 'My Library'){
      (async () => {
        const playlists = await getUserPlaylists();
        setUserPlaylists(playlists);
        const sortedPlaylists = playlists?.slice(0, 4); 
        setInitialPlaylists(sortedPlaylists);
        setSearchList(sortedPlaylists);  // Set the first 4 playlists as the default search result for "My Library"
      })();
    }else{
      setSearchList([]);  // Reset searchList whenever the filter changes
    }

  }, [selectedFilter]);

  // Handle the search input with debounce to avoid triggering multiple requests on each keystroke
  const handleSearchChange = (e) => {
    const query = e.target.value; // Remove leading/trailing spaces
    setSearchQuery(query);
    clearTimeout(debounceTimeout.current);
  
    debounceTimeout.current = setTimeout(() => {
      if (query === '') {
        if (selectedFilter === 'My Library') {
          setSearchList(initialPlaylists); // Reset to the first 4 playlists when in my lib
        }
        return; // dont call the API with an empty query
      } 
  
      search(query, selectedFilter);
    }, 500);
  };
  

  // Handle filter change
  const handleFilterStatus = (filtersList) => {
    filtersList.forEach((filter) => {
      if (filter.isSelected) {
        setSelectedFilter(filter.label);
      }
    });
  };

  return (
    <>
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
          }}
        />
      </Container>
      <>

      {
        searchList && (
            <Box sx={{ height: '425px', overflow: 'auto' }}>
              <ListItems 
                sendData={sendItemSelected} 
                list={searchList} 
              />
            </Box>
        )
      }




      {
        !userPlaylists && selectedFilter === 'My Library' &&
        
        <Typography sx={{mt:3}}>
          You do not have any playlists in your library. Please select "All" to search Spotify playlists.
        </Typography>
      }

      </>

    
    </>
  );
}
