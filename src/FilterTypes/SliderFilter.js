// FilterTypes/SliderFilter.jsx
import React from 'react';
import { Box, Slider, Stack } from '@mui/material';

const SliderFilter = ({ filter, onChange, disabled, iconMap }) => {
  const StartIcon = iconMap[filter.startIcon] || null;
  const EndIcon = iconMap[filter.endIcon] || null;
  
  return (
    <Box sx={{ width: '100%', maxWidth: 300 }}>
      <Stack spacing={2} direction="row" sx={{ alignItems: 'center', mb: 1 }}>
        {StartIcon && <StartIcon />}
        <Slider
          aria-label={filter.label}
          value={filter.value}
          onChange={(e, newValue) => onChange(newValue)}
          min={filter.min}
          max={filter.max}
          step={filter.step}
          disabled={disabled}
        />
        {EndIcon && <EndIcon />}
      </Stack>
    </Box>
  );
};

export default SliderFilter;