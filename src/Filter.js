import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Button, SvgIcon, useMediaQuery, useTheme, Slider, Stack} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';



export default function Filter({ sendSearchFilterStatus, type, loading }) {
  const [filtersList, setFilters] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet')); 

  // Set initial filters based on the `type`
  useEffect(() => {
    let initialFilters = [];
    
    if (type === 'search') {
      initialFilters = [
        { label: 'My Library', isSelected: true }, 
        { label: 'All', isSelected: false },
      ];
    }
    
    setFilters(initialFilters);
    
    // Initialize parent's reference to the filters
    if (type === 'search' && sendSearchFilterStatus) {
      sendSearchFilterStatus(initialFilters);
    }
  }, [type]);

  const handleFilterClick = (index) => {
    const updatedFilters = filtersList.map((item, i) => {
      return {
        ...item,
        isSelected: i === index
      };
    });

    console.log(updatedFilters)
    
    setFilters(updatedFilters);
    
    // Notify parent of filter changes
    if (type === 'search' && sendSearchFilterStatus) {
      sendSearchFilterStatus(updatedFilters);
    }
  };

  const showButtonFilters = (list) => (
    <Box
      sx={{
        width: '90%',
        display: 'flex',
        justifyContent: type === 'moderation' 
          ? (isMobile ? 'center' : 'flex-start') 
          : 'center',
        gap: '5px',
        py: 2,
        mx: type === 'moderation' ? (isMobile && 'auto') : 'auto',
      }}
    >
      {list.map((filter, index) => (
        <Button
          key={index}
          disabled={loading}
          sx={{
            flexGrow: 1,
            flexBasis: 0, 
            maxWidth: '150px', 
            minWidth: '120px', 
            height: '40px', 
            display: 'flex',
            color:'text.primary',
            borderColor:'secondary.main',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: filter.isSelected ? 'secondary.main' : 'secondary.light',
            borderRadius: '50px'}}
          startIcon={filter.icon}
          onClick={() => handleFilterClick(index)}
        >
          {filter.label}
        </Button>
      ))}
    </Box>
  );

  
  return (
    <>
      {showButtonFilters(filtersList)}
    </>
  );
}