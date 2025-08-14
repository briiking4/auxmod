import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

export const setAccessToken = (token) => {
  console.log("Access token has been applied to the spotify api instance");
  spotifyApi.setAccessToken(token);
};

/**
 * Fetch a guest access token from your backend (which calls Spotify with client credentials).
 */
export const initGuestAccess = async () => {
  const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/guest_token`);
  if (!res.ok) throw new Error("Failed to get guest token");
  
  const data = await res.json();
  setAccessToken(data.access_token); // apply to the instance
  return data.access_token; // return so caller can store in state
};

export default spotifyApi;
