import React from 'react';
import { 
  Box, 
  Typography, 
  Alert
} from '@mui/material';
import ButtonFilter from './FilterTypes/ButtonFilter';
import SliderFilter from './FilterTypes/SliderFilter';

const FilterCategory = ({ 
  category, 
  filters, 
  iconMap, 
  onFilterChange, 
  disabled 
}) => {
  const renderFilter = (filter) => {
    switch (filter.type) {
      case 'button':
        return (
          <ButtonFilter
            key={filter.id}
            filter={filter}
            onToggle={() => onFilterChange(filter.id)}
            disabled={disabled}
            iconMap={iconMap}
          />
        );
      case 'slider':
        return (
          <SliderFilter
            key={filter.id}
            filter={filter}
            onChange={onFilterChange}
            disabled={disabled}
            iconMap={iconMap}
          />
        );
      // Add more filter types as needed
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      {category.title && (
        <Typography variant="h6" sx={{ mb: 1 }}>
          {category.title}
        </Typography>
      )}
      
      {category.description && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {category.description}
        </Typography>
      )}
      
      {category.info && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <span dangerouslySetInnerHTML={{ __html: category.info }} />
        </Alert>
      )}
      
      <Box 
        sx={{
          display: 'flex',
          flexDirection: category.flexDirection,
          gap: 2,
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        {filters.map(renderFilter)}
      </Box>
    </Box>
  );
};

export default FilterCategory;