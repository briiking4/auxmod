// FilterTypes/SliderFilter.jsx
import React from 'react';
import {useState} from 'react';
import { 
  Box, 
  Slider, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Switch
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SliderFilter = ({ filter, onChange, disabled, iconMap }) => {

  const [sliderDisabled, setSliderDisabled] = useState(true)

  // Handler for the slider value change
  const handleSliderChange = (value) => {
    onChange(filter.id, value);
  };

  // Handler for the switch toggle
  const handleSwitchChange = (event) => {
    if(!event.target.checked){
      filter.value = null
    }
    setSliderDisabled(!event.target.checked);
    onChange(filter.id, event.target.checked);
  };

  // Get the icon if it exists in the iconMap
  const Icon = iconMap[filter.startIcon];
  
  return (
    <Box sx={{maxWidth:'48%'}}>
      <Accordion 
        key={filter.id}
        disabled={disabled}
        sx={{'& .Mui-expanded': {transform:'none'}}}
      >
        <AccordionSummary
          expandIcon={<Switch onChange={handleSwitchChange} />}
          aria-controls={`${filter.id}-content`}
          id={`${filter.id}-header`}
          sx={{
            '& .MuiAccordionSummary-expandIconWrapper': {
              transform: 'none !important',
            },
            '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
              transform: 'none !important',
            },
          }}
        >
          {Icon && <Box sx={{ mr: 1 }}>{Icon}</Box>}
          <Typography>{filter.label}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{filter.description}</Typography>
          <Box sx={{ width: '90%', mx:'auto' }}>
            <Slider
              aria-label={filter.label}
              value={filter.value}
              onChange={(e, newValue) => handleSliderChange(newValue)}
              min={filter.min}
              max={filter.max}
              step={filter.step}
              marks={filter.marks}
              disabled={sliderDisabled}
              valueLabelDisplay="auto"
            />
            {filter.value !== null && filter.isSelected && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Current: {filter.value === 0
                  ? 'Low'
                  : filter.value === 50
                  ? 'Medium'
                  : filter.value === 100
                  ? 'High'
                  : filter.value}
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default SliderFilter;