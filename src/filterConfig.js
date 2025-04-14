// Central place for filter definitions
import ProfanityIcon from "./ProfanityIcon.js"
import ViolenceIcon from "./ViolenceIcon.js"
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

export const filterCategories = [
  {
    id: 'moderation',
    title: 'Explicit Theme Filters',
    description: 'Select one or more filters:',
    info: "Clean versions swapped in for profanity-only songs. Profanity filter only supports songs in English.",
    placement: 'main', // Determines where this category appears
    order: 1, 
    flexDirection:'row',
    filters: [
      {
        id: 'profanity',
        label: 'Profanity',
        type: 'button',
        icon: 'profanityIcon', 
        defaultSelected: false,
        options: { whitelist: [] }
      },
      {
        id: 'violence',
        label: 'Violence',
        type: 'button',
        icon: 'violenceIcon',
        defaultSelected: false,
        options: {}
      },
      {
        id: 'sexual',
        label: 'Sexual',
        type: 'button',
        icon: 'sexualIcon',
        defaultSelected: false,
        options: {}
      },
    ]
  },
  // {
  //   id: 'audioFeature',
  //   title: 'Audio Feature Filters',
  //   description: '',
  //   placement: 'main',
  //   order: 2,
  //   flexDirection:'row',
  //   filters: [
  //     {
  //       id: 'energy',
  //       label: 'Energy',
  //       description:'Higher energy feels faster and louder',
  //       type: 'slider',
  //       startIcon: 'energyIcon',
  //       isSelected: false,
  //       defaultSelected: false,
  //       defaultValue: 0,
  //       min: 0,
  //       max: 100,
  //       step:10,
  //       marks: [
  //         {
  //           value: 0,
  //           label: 'Low',
  //         },
  //         {
  //           value: 50,
  //           label: 'Medium',
  //         },
  //         {
  //           value: 100,
  //           label: 'High',
  //         }],
  //     },
  //   ]
  // },
];


export const iconMap = {
  profanityIcon:<ProfanityIcon/>,
  violenceIcon:<ViolenceIcon/>,
  energyIcon: <OfflineBoltIcon/>,
  sexualIcon: <LocalFireDepartmentIcon/>
};