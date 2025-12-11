// SetFilters.jsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, IconButton, Box, LinearProgress, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReactGA from 'react-ga4';
import FilterCategory from './FilterCategory';
import AdvancedFilters from './AdvancedFilters';
import { filterCategories, iconMap } from './filterConfig';
import { Helmet } from 'react-helmet';


export default function SetFilters({ sendStatus, onApplyFilters, sendChosenFilters, progress, chosenPlaylist }) {
  const [loading, setLoading] = useState(false);
  const [filterState, setFilterState] = useState({});
  const [settingsApplied, setSettingsApplied] = useState(false);
  
  // Initialize filter state from config
  useEffect(() => {
    const initialState = {};
    
    filterCategories.forEach(category => {
      category.filters.forEach(filter => {
        initialState[filter.id] = {
          ...filter,
          isSelected: filter.defaultSelected || false,
          value: filter.defaultValue !== undefined ? filter.defaultValue : null
        };
      });
    });
    
    setFilterState(initialState);
  }, []);
  
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: "Set Filters" });
  }, []);
  
  const handleFilterChange = (filterId, value) => {
    console.log(filterId, value);
    setFilterState(prevState => {
      const updatedFilter = { ...prevState[filterId] };
      
      if (updatedFilter.type === 'slider') {
        // If it's a slider filter
        if (typeof value === 'boolean') {
          // This is the switch toggle event
          updatedFilter.isSelected = value;
        } else if (typeof value === 'number') {
          // This is the slider value change
          updatedFilter.value = value;
        }
      } else {
         updatedFilter.isSelected = !updatedFilter.isSelected;
      }
      console.log(updatedFilter);

      
      return {
        ...prevState,
        [filterId]: updatedFilter
      };
    });
  };
  const isAnyFilterSelected = () => {
    return Object.values(filterState).some(filter => filter.isSelected);
  };
  
  const handleApplyFilters = () => {
    ReactGA.event({
      category: 'User',
      action: 'Apply Filters Clicked'
    });
    
    setLoading(true);
    
    const selectedFilters = Object.values(filterState).filter(filter => filter.isSelected);
    const selectedLabels = selectedFilters.map(filter => filter.label);
    
    sendChosenFilters(selectedLabels);
    onApplyFilters(selectedFilters);
  };
  
  const handleWhitelist = (list) => {
    setFilterState(prevState => {
      if (!prevState.profanity) return prevState;
      
      return {
        ...prevState,
        profanity: {
          ...prevState.profanity,
          options: {
            ...prevState.profanity.options,
            whitelist: list
          }
        }
      };
    });
  };

  const handleBlacklist = (list) => {
    console.log("handling blacklist in setFilters", list)
    setFilterState(prevState => {
      if (!prevState.profanity) return prevState;
      
      return {
        ...prevState,
        profanity: {
          ...prevState.profanity,
          options: {
            ...prevState.profanity.options,
            blacklist: list
          }
        }
      };
    });
  };

  const handleCleanVersionCheck = (isChecked) => {
    console.log("Hnadling clean version check in set filters", isChecked);
    setFilterState(prevState => {
      if (!prevState.profanity) return prevState;
      
      return {
        ...prevState,
        profanity: {
          ...prevState.profanity,
          options: {
            ...prevState.profanity.options,
            replaceClean: isChecked
          }
        }
      };
    });

  }
  
  // Group filters by category and placement
  const getCategoryFilters = (categoryId) => {
    const category = filterCategories.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    return category.filters
      .map(filter => filterState[filter.id])
      .filter(Boolean); // Filter out any undefined filters
  };
  
  // Sort categories by their order property
  const sortedCategories = [...filterCategories].sort((a, b) => a.order - b.order);
  
  return (
    <>
      <Helmet>
        <title>Set Filters | auXmod</title>
        <meta name="description" content="Customize playlist filters to block profanity, sexual content, or violence from playlist. Automatically finds clean versions and set your own word whitelist." />
      </Helmet>
    <Container sx={{ mt: 2, p: 0 }}>
      
      {/* Render filter categories by their placement and order */}
      {sortedCategories.map(category => (
        <>
          <FilterCategory
            key={category.id}
            category={category}
            filters={getCategoryFilters(category.id)}
            iconMap={iconMap}
            onFilterChange={handleFilterChange}
            disabled={loading}
          />
          {
          category.id === 'moderation' && 
          <AdvancedFilters 
          sendWhitelist={handleWhitelist} 
          sendBlacklist={handleBlacklist} 
          sendCleanVersionCheck={handleCleanVersionCheck}
          filtersState={Object.values(filterState)} 
          loading={loading} 
          sendSettingsApplied={setSettingsApplied}
        />
        }
      </>
      ))}
      
      
      <Box sx={{ position: 'relative', mt: 5, maxWidth: '180px' }}>
        <Button 
          variant="contained" 
          sx={{ 
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '50px',
            width: '100%',
            height: '48px',
            transition: 'all 0.3s ease',
            boxShadow: loading ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
          disabled={!isAnyFilterSelected() || !settingsApplied}
          onClick={!loading ? handleApplyFilters : undefined}
        >
          <Box sx={{ 
            position: 'relative', 
            zIndex: 2, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            fontWeight: loading ? 'bold' : 'normal',
          }}>
            {loading ? (
              <>
                <CircularProgress 
                  size={20} 
                  thickness={5}
                  sx={{ 
                    color: 'white', 
                    marginRight: '8px',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }} 
                />
                {`${Math.round(progress)}%`}
              </>
            ) : (
              <>
                <FilterListIcon sx={{ marginRight: '8px' }} />
                Apply Filters
              </>
            )}
          </Box>
        </Button>

        {loading && (
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'primary.dark',
              borderRadius: 'inherit',
              zIndex: 1,
              borderRadius:'50px'
            }}
          />
        )}
      </Box>
      <Box sx={{py:2}}>
        {
        chosenPlaylist.total > 150 && loading &&

        <Typography>Please sit tight, this will take a few minutes.</Typography>

        }
      </Box>
    </Container>
    </>
  );
}