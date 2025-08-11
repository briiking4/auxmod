const AnalyzeSongsBatch = async (songs, chosenFilters) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/analyze-songs-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs, chosenFilters })
    });

    const result = await response.json();
    return result.results; // Array of analysis results
  } catch (error) {
    console.error("Error in batch analysis:", error);
    return [];
  }
};

export default AnalyzeSongsBatch;