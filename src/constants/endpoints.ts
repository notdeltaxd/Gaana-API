/**
 * @fileoverview Gaana API endpoint URLs configuration.
 * Contains all API endpoint URLs used throughout the application.
 * @module constants/endpoints
 */

/**
 * Gaana API endpoint URLs for various operations.
 * All endpoints use the Gaana API v2 format.
 *
 * @constant
 */
export const apiEndpoints = {
  trendingUrl: 'https://gaana.com/apiv2?type=miscTrendingSongs',
  albumListUrl: 'https://gaana.com/apiv2?type=albumList',
  searchSongsUrl: 'https://gaana.com/apiv2?country=IN&page=0&secType=track&type=search&keyword=',
  songDetailsUrl: 'https://gaana.com/apiv2?type=songDetail&seokey=',
  similarArtistsUrl: 'https://apiv2.gaana.com/player/similar-artists/',
  playlistDetailsUrl: 'https://gaana.com/apiv2?type=playlistDetail&seokey=',
  newReleasesUrl: 'https://gaana.com/apiv2?type=miscNewRelease&language=',
  chartsUrl: 'https://apiv2.gaana.com/home/playlist/top-charts?view=all&limit=0,',
  searchArtistsUrl: 'https://gaana.com/apiv2?country=IN&page=0&secType=artist&type=search&keyword=',
  artistDetailsUrl: 'https://gaana.com/apiv2?type=artistDetail&seokey=',
  artistTopTracks: 'https://gaana.com/apiv2?language=&order=0&page=0&sortBy=popularity&type=artistTrackList&id=',
  searchAlbumsUrl: 'https://gaana.com/apiv2?country=IN&page=0&secType=album&type=search&keyword=',
  playlistSearchUrl: 'https://gaana.com/apiv2?country=IN&page=0&secType=playlist&type=search&keyword=',
  lyricsListUrl: 'https://gaana.com/apiv2?type=lyricsList&page=',
  songLyricsUrl: 'https://gaana.com/apiv2?type=songLyrics&seokey=',
  albumDetailsUrl: 'https://gaana.com/apiv2?type=albumDetail&seokey='
} as const
