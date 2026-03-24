/**
 * @fileoverview Details service for fetching detailed information about songs, albums, playlists, and artists.
 * Handles fetching complete information including metadata, tracks, and related data.
 * @module services/detailsService
 */

import { apiEndpoints } from '../constants/endpoints.js'
import { BaseService } from './baseService.js'
import { FormattersService } from './formattersService.js'

/**
 * Service class for fetching detailed information about Gaana content.
 * Extends BaseService to inherit common HTTP request functionality.
 *
 * @class DetailsService
 */
export class DetailsService extends BaseService {
  private formatters: FormattersService

  constructor() {
    super()
    this.formatters = new FormattersService()
  }

  /**
   * Get all tracks from an album by seokey
   */
  async getAlbumTracks(seokey: string): Promise<unknown[]> {
    const url = apiEndpoints.albumDetailsUrl + seokey
    const result = await this.fetchJson(url)
    if (!result || typeof result !== 'object') return []

    const r = result as { tracks?: Array<{ seokey?: string }> }
    if (!r.tracks || !Array.isArray(r.tracks) || r.tracks.length === 0) {
      return []
    }

    // Safely extract track seokeys
    const trackSeokeys: string[] = r.tracks.map((t) => t.seokey).filter((seokey): seokey is string => Boolean(seokey))

    if (trackSeokeys.length === 0) {
      return []
    }

    return await this.getTrackInfo(trackSeokeys)
  }

  /**
   * Get track information by seokeys - uses simplified formatter
   * Fetches tracks in parallel for better performance
   */
  async getTrackInfo(trackSeokeys: string[], timeout: number = 3000): Promise<unknown[]> {
    // Fetch all tracks in parallel with timeout
    const trackPromises = trackSeokeys.map(async (seokey) => {
      try {
        const url = apiEndpoints.songDetailsUrl + seokey
        const result = await this.fetchJson(url, 'POST', {}, timeout)
        if (!result || typeof result !== 'object') return null
        const res = result as { tracks: Array<Record<string, unknown>> }
        if (res.tracks && res.tracks.length > 0) {
          return await this.formatters._formatJsonSongDetails(res.tracks[0])
        }
        return null
      } catch (error) {
        // Skip failed requests (timeout or other errors)
        console.warn(`Failed to fetch track ${seokey}:`, error instanceof Error ? error.message : 'Unknown error')
        return null
      }
    })

    // Wait for all requests to complete (or timeout)
    const results = await Promise.allSettled(trackPromises)

    // Filter out failed/null results
    const trackInfo: unknown[] = []
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value !== null) {
        trackInfo.push(result.value)
      }
    }

    return trackInfo
  }

  /**
   * Get song info by seokey - uses full details formatter
   */
  async getSongInfo(seokey: string): Promise<Record<string, unknown>> {
    const url = apiEndpoints.songDetailsUrl + seokey
    const result = await this.fetchJson(url)

    if (!result || typeof result !== 'object') {
      return { error: 'Song not found' }
    }

    const r = result as { tracks?: Array<Record<string, unknown>> }
    if (!r.tracks || !Array.isArray(r.tracks) || r.tracks.length === 0) {
      return { error: 'Song not found' }
    }

    return await (this.formatters as any).formatJsonSongFullDetails(r.tracks[0])
  }

  /**
   * Get album info by seokey
   */
  async getAlbumInfo(seokey: string, includeTracksFlag?: boolean): Promise<Record<string, unknown>> {
    const url = apiEndpoints.albumDetailsUrl + seokey
    const result = await this.fetchJson(url)

    // Validate result is an object
    if (!result || typeof result !== 'object') {
      return { error: 'Album not found' }
    }

    // Check if result actually contains album data (not a song or invalid response)
    const r = result as { album?: unknown; tracks?: Array<{ seokey?: string }> }
    if (!r.album) {
      return { error: 'Album not found' }
    }

    const albumData = await this.formatters._formatJsonAlbums(result, includeTracksFlag ?? true)

    // Check if formatting returned an error
    if (albumData.error) {
      return albumData
    }

    // If tracks are requested, fetch them
    if (includeTracksFlag && r.tracks && Array.isArray(r.tracks) && r.tracks.length > 0) {
      try {
        // Safely extract track seokeys
        const trackSeokeys: string[] = r.tracks
          .map((t) => t.seokey)
          .filter((seokey): seokey is string => Boolean(seokey))

        if (trackSeokeys.length > 0) {
          const trackData = await this.getTrackInfo(trackSeokeys)
          albumData.tracks = trackData
        } else {
          albumData.tracks = []
        }
      } catch (error) {
        console.warn('Failed to fetch album tracks:', error instanceof Error ? error.message : 'Unknown error')
        albumData.tracks = []
      }
    } else if (includeTracksFlag) {
      albumData.tracks = []
    }

    return albumData
  }

  /**
   * Get playlist info by seokey
   * Tracks are already included in the playlist details response, so no need to fetch separately
   */
  async getPlaylistInfo(seokey: string, timeout: number = 8000): Promise<Record<string, unknown>> {
    // Fetch playlist details with timeout
    const url = apiEndpoints.playlistDetailsUrl + seokey
    const result = await this.fetchJson(url, 'POST', {}, timeout)

    // Validate result
    if (!result || typeof result !== 'object') {
      return { error: 'Playlist not found' }
    }

    // Check if result actually contains playlist data
    const r = result as { playlist?: unknown }
    if (!r.playlist) {
      return { error: 'Playlist not found' }
    }

    // formatJsonPlaylists now formats tracks directly from the response
    const playlistData = await this.formatters._formatJsonPlaylists(result)

    // Check if formatting returned an error
    if (playlistData.error) {
      return playlistData
    }

    return playlistData
  }

  /**
   * Get artist info by seokey with top tracks
   */
  async getArtistInfo(seokey: string): Promise<Record<string, unknown>> {
    // Fetch basic artist info
    const url = apiEndpoints.artistDetailsUrl + seokey
    const result = await this.fetchJson(url)

    if (!result || typeof result !== 'object') {
      return { error: 'Artist not found' }
    }

    // Check if result actually contains artist data
    const r = result as { artist?: unknown }
    if (!r.artist) {
      return { error: 'Artist not found' }
    }

    // Format artist info
    const artistInfo = await this.formatters._formatJsonArtistInfo(result)
    if (artistInfo.error) {
      return artistInfo
    }

    // Extract artist_id to fetch top tracks
    const artistId = artistInfo.artist_id as string
    if (!artistId) {
      return { ...artistInfo, top_tracks: [] }
    }

    try {
      // Fetch top tracks using artist_id
      const topTracksUrl = apiEndpoints.artistTopTracks + artistId
      const topTracksResult = await this.fetchJson(topTracksUrl)

      // Format top tracks directly from API response (same format as song details)
      const topTracks = await this.formatters._formatJsonArtistTopTracks(topTracksResult)

      // Combine artist info with top tracks
      return {
        ...artistInfo,
        top_tracks: topTracks
      }
    } catch (error) {
      console.warn('Failed to fetch artist top tracks:', error instanceof Error ? error.message : 'Unknown error')
      return {
        ...artistInfo,
        top_tracks: []
      }
    }
  }

  /**
   * Get lyrics for a song by seokey.
   */
  async getSongLyrics(seokey: string): Promise<Record<string, unknown>> {
    const url = apiEndpoints.songLyricsUrl + seokey
    const result = await this.fetchJson(
      url,
      'POST',
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: `https://gaana.com/lyrics/${seokey}`
      },
      20000
    )

    return (this.formatters as any)._formatJsonSongLyrics(result)
  }
}
