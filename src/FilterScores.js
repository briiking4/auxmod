import {
	RegExpMatcher,
	englishDataset,
	englishRecommendedTransformers,
  DataSet,
} from 'obscenity';


const FilterScores = async (songTitle, songArtist, chosenFilters) => {

  console.log("props on mount" + songTitle);
  console.log("props on mount" + songArtist);

  console.log("props on mount filters in filter scores" + chosenFilters);

  const profanityFilter = chosenFilters.find(filter => filter.label === "Profanity");
  
  console.log("profanity filter: " + profanityFilter.options.whitelist);



    async function fetchWithTimeout(url, options, timeout = 5000) {  // Timeout in ms
        const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
        );
        return Promise.race([fetch(url, options), timeoutPromise]);
    }

    async function getLyrics(songTitle, songArtist) {
      try {    
        const url = `https://api.lyrics.ovh/v1/${songArtist}/${songTitle}`;
    
        const response = await fetchWithTimeout(url, {
          method: 'GET',
        });
        
        if (!response.ok) {
          console.log("Response not ok:", response.status);
          throw new Error('Failed to fetch lyrics: ' + response.statusText);
        }
    
        const data = await response.json();
    
        if (!data || !data.lyrics || data.lyrics.trim() === "") {
          throw new Error('No lyrics found in the response.');
        }
        console.log(data.lyrics)
        return data.lyrics;
      } catch (error) {
        console.error("Error in getLyrics:", error.message);
        throw error;
      }
    }

//UGHHHHHH i cant get the whitelist to work

  const checkProfanity = async (lyrics, whitelist) => {      
    console.log("whitelist: ", whitelist);

    const myDataset = new DataSet()
      .addAll(englishDataset)
      .removePhrasesIf((phrase) => whitelist.map(w => w.toLowerCase()).includes(phrase.metadata.originalWord.toLowerCase()))

    // Set up the matcher
    const matcher = new RegExpMatcher({
      blacklistedTerms: myDataset.build().blacklistedTerms,
      whitelistedTerms: whitelist, 
      ...englishRecommendedTransformers,
    });


    if(lyrics){

      if (matcher.hasMatch(lyrics)) {
        console.log("Profanity detected!");
        return true;
      } else {
        console.log("No profanity found.");
        return false;
      }
    }else{
      return false;
    }
  }

  async function checkModeration(lyrics) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/moderate-lyrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lyrics }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch moderation results');
      }
  
      const moderation = await response.json();
      console.log("Moderation response:", moderation);

      console.log("Full Moderation Response:", JSON.stringify(moderation, null, 2));

        if (moderation.results && moderation.results[0] && moderation.results[0].flagged) {
            const sexual_score = moderation.results[0].categories ? moderation.results[0].category_scores.sexual : false;
            const violence_score = moderation.results[0].categories ? moderation.results[0].category_scores.violence : false;
            console.log("sexual: ", sexual_score);
            console.log("violent: ", violence_score);

            return { sexual: sexual_score, violence: violence_score };
        } else {
            // If no flagged categories or results, return default values
            console.log("No moderation issues detected.");
            return { sexual: null, violence: null };
        }
    } catch (error) {
        console.error("Error checking moderation:", error);
        return { sexual: null, violence: null }; // Return default values on error
    }
}



  const getModerationResults = async () => {
    console.log("GETTING SCORE")
    try{
      const lyrics = await getLyrics(songTitle, songArtist);
      console.log("LYRICS FROM GETSCORE FUNCTION")

      let hasProfanity = null

      if(profanityFilter){
        const whitelist = profanityFilter.options.whitelist
        console.log("the whitelist is: (in get mod results: ", whitelist)
        hasProfanity = await checkProfanity(lyrics, whitelist);
      }
      

      const themeModeration = await checkModeration(lyrics);

      console.log("Theme Moderation", themeModeration)

      return {status: 'success', sexually_explicit: themeModeration.sexual , profanity: hasProfanity , violence: themeModeration.violence}


      // const mod_response = await fetch(`${apiUrl_mod}?key=${apiKey}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(requestBody),
      // });
      // const entity_response = await fetch(`${apiUrl_entity}?key=${apiKey}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(requestBody),
      // });

      // const nlp_result_mod = await mod_response.json();
      // const nlp_result_entity = await entity_response.json();

      // console.log(nlp_result_mod);  
      // console.log(nlp_result_entity);
      
      // if (nlp_result_entity) {
      //   nlp_result_entity.entities.forEach(entity => {
      //       if (['profanity', 'violence', 'abusive'].includes(entity.type)) {
      //           console.log(`Detected offensive content: ${entity.name}`);
      //       }
      //   });
      // }

      // const sex = nlp_result_mod.moderationCategories[4].confidence
      // const profanity = nlp_result_mod.moderationCategories[2].confidence
      // const violence = nlp_result_mod.moderationCategories[6].confidence


      // return {status: 'success', sexually_explicit: sex , profanity: profanity , violence: violence}
    }catch(e){
      console.log(e)
      return null
    }
  };

  return await getModerationResults();
};

export default FilterScores;


