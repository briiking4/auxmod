const AnalyzeSongsBatch = async (songs, chosenFilters, batchContext = null, signal) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/analyze-songs-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs, chosenFilters, batchContext, sessionId: batchContext?.sessionId  // Pass sessionId to backend
    }),
      signal
    });

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const result = await response.json();
    return result.results; // Array of analysis results
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Batch analysis aborted');
      throw error; // Re-throw to propagate cancellation
    }
    console.error("Error in batch analysis:", error);
    return [];
  }
};

export default AnalyzeSongsBatch;