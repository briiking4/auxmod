
const AnalyzeSong = async (songTitle, songArtist, chosenFilters) => {
  console.log(`Analyzing: ${songTitle} by ${songArtist}`);
  
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/analyze-song`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        songTitle,
        songArtist,
        chosenFilters
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Analysis result:", result);
    
    return result;
  } catch (error) {
    console.error("Error analyzing song:", error);
    return {
      status: 'error',
      lyrics: null,
      sexually_explicit: null,
      profanity: null,
      violence: null,
      error: error.message
    };
  }
};

export default AnalyzeSong;