import * as React from 'react';
import { useState, useEffect } from 'react';
import {Container, Typography, Button, IconButton, Box, LinearProgress, Tooltip, CircularProgress, Alert} from '@mui/material';
import Filter from './Filter';
import AdvancedFilters from './AdvancedFilters';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReactGA from 'react-ga4';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoIcon from '@mui/icons-material/Info';


export default function SetFilters({sendStatus, onApplyFilters, sendChosenFilters, progress}) {
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [currentFilters, setCurrentFilters] = useState([]); // Use state for currentFilters
  const [settingsApplied, setSettingsApplied] = useState(false);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: "Set Filters" });
  }, []);

  const handleFilterUpdate = (filters) => {
    console.log("handling new filter in setfilter: ", filters);
    setCurrentFilters(filters); // Update state for filters

    const anySelected = filters.some(filter => filter.isSelected);
    setButtonDisabled(!anySelected);
  };

  const handleApplyFilters = async () => {
    ReactGA.event({
      category: 'User',
      action: `Apply Filters Clicked`
    });

    setLoading(true);
    
    const selectedFiltersLabels = currentFilters
      .filter(filter => filter.isSelected)
      .map(filter => filter.label);

    const selectedFiltersList = currentFilters
      .filter(filter => filter.isSelected);

    console.log("selected filters list", selectedFiltersList);

    sendChosenFilters(selectedFiltersLabels);
    onApplyFilters(selectedFiltersList);
  };

  const sendStepStatus = (state) => {
    sendStatus(state);
  };

  const handleWhitelist = (list) => {
    console.log("Received whitelist: ", list);
    const profanityFilterIndex = currentFilters.findIndex(
      filter => filter.label === 'Profanity'
    );

    if (profanityFilterIndex !== -1) {
      const updatedFilters = [...currentFilters];
      updatedFilters[profanityFilterIndex].options.whitelist = list;
      setCurrentFilters(updatedFilters); // Update the state with the new whitelist
    }
  };

  const handleSettingsApplied = (state) =>{
    console.log("recived settings applied", state)
    setSettingsApplied(state)
  }

  return (
    <Container sx={{ mt: 2, p: 0 }}>
      <Box sx={{ mt: -3 }}>
        <IconButton
          aria-label="back"
          size="large"
          onClick={async () => {
            sendStepStatus(false);
          }}
          sx={{ p: 0, mb: 2 }}
          disabled={loading}
        >
          <ArrowBackIcon sx={{ p: 0 }} fontSize="inherit" />
        </IconButton>
      </Box>

      <Typography variant="h6">Filter out songs that contain:</Typography>
      <Box sx={{ mt: 1, mb: 2, display: 'flex', flexDirection:'column' }}>
        <Typography variant="body2" sx={{ mr: 1, mb:1 }}>Select one or more:</Typography>
        <Alert severity="info">Tracks must pass all selected filters to be included. Only the profanity filter swaps a clean version, if available.</Alert>
        {/* <Tooltip title="Profanity filter will swap for clean/radio version replacements if available." 
          enterTouchDelay={0} 
          leaveTouchDelay={3000}>
          <InfoIcon fontSize="small" color="secondary.main" />
        </Tooltip> */}
      </Box>

      <Filter sendModerationFiltersStatus={handleFilterUpdate} type="moderation" loading={loading}/>

      <AdvancedFilters sendWhitelist={handleWhitelist} filtersState={currentFilters} loading={loading} sendSettingsApplied={handleSettingsApplied}/>

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
          disabled={buttonDisabled || !settingsApplied}
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
    </Container>
  );
}
