const AnalyzeSongsBatch = async (songs, chosenFilters, batchContext = null, signal) => {
  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/analyze-songs-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      songs, 
      chosenFilters, 
      batchContext, 
      sessionId: batchContext?.sessionId 
    }),
    signal
  });

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!response.ok) {
    if (response.status === 429) {
      const data = await response.json();
      const error = new Error('Rate limited');
      error.response = { status: 429, data };
      throw error;  // This will be caught by callAnalyzeBatchWithRetry
    }
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.results;
};

export default AnalyzeSongsBatch;