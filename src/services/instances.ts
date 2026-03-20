/**
 * @fileoverview Singleton service instances and unified API interface.
 * Creates service instances once and reuses them throughout the application
 * to improve performance and maintain consistency.
 * @module services/instances
 */

import { SearchService } from './searchService.js'
import { DetailsService } from './detailsService.js'
import { BrowseService } from './browseService.js'
import { Functions } from '../utils/functions.js'
import { Errors } from '../utils/errors.js'

// Create all service instances as singletons
const searchService = new SearchService()
const detailsService = new DetailsService()
const browseService = new BrowseService()
const functions = new Functions()
const errors = new Errors()

/**
 * Unified interface for all Gaana API operations.
 * Provides a single entry point for all API services, making it easy to
 * access search, details, and browse functionality throughout the application.
 *
 * @constant
 */
export const gaanaService = {
  // Search operations
  searchSongs: (q: string, limit: number) => searchService.searchSongs(q, limit),
  searchAlbums: (q: string, limit: number) => searchService.searchAlbums(q, limit),
  searchPlaylists: (q: string, limit: number) => searchService.searchPlaylists(q, limit),
  searchArtists: (q: string, limit: number) => searchService.searchArtists(q, limit),

  // Details operations - accepts seokey only
  getSongInfo: (seokey: string) => detailsService.getSongInfo(seokey),
  getAlbumInfo: (seokey: string, includeTracksFlag?: boolean) => detailsService.getAlbumInfo(seokey, includeTracksFlag),
  getPlaylistInfo: (seokey: string) => detailsService.getPlaylistInfo(seokey),
  getArtistInfo: (seokey: string) => detailsService.getArtistInfo(seokey),
  getTrackInfo: (trackSeokeys: string[]) => detailsService.getTrackInfo(trackSeokeys),

  // Browse operations
  getTrendingTracks: (language?: string, limit?: number) => browseService.getTrendingTracks(language, limit),
  getCharts: (limit?: number) => browseService.getCharts(limit),
  getNewReleases: (language?: string) => browseService.getNewReleases(language),
  getAlbumList: (language?: string, page?: number) => browseService.getAlbumList(language, page)
}

export { functions, errors }
