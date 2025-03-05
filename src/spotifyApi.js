import SpotifyWebApi from 'spotify-web-api-js';

// SpotifyWebApi instance
const spotifyApi = new SpotifyWebApi();

// Set access token function that will be called later with a valid token
export const setAccessToken = (token) => {
  console.log("Access token as been applied to the spotify api instance")
  spotifyApi.setAccessToken(token);
};

export default spotifyApi;
