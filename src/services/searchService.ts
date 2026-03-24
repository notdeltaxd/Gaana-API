/**
 * @fileoverview Search service for querying Gaana API.
 * Handles searching for songs, albums, playlists, and artists.
 * Fetches detailed information for search results to provide complete data.
 * @module services/searchService
 */

import { apiEndpoints } from '../constants/endpoints.js'
import { BaseService } from './baseService.js'
import { FormattersService } from './formattersService.js'

/**
 * Service class for searching Gaana content.
 * Extends BaseService to inherit common HTTP request functionality.
 *
 * @class SearchService
 */
export class SearchService extends BaseService {
  private formatters: FormattersService

  constructor() {
    super()
    this.formatters = new FormattersService()
  }

  /**
   * Search for songs - fetches individual song details for better data
   */
  async searchSongs(q: string, limit: number): Promise<unknown[]> {
    const url = `${apiEndpoints.searchSongsUrl}${encodeURIComponent(q)}`
    const result = await this.fetchJson(url)
    if (!result || typeof result !== 'object') return []
    const r = result as { gr?: Array<{ gd?: Array<{ seo: string }> }> }
    const gr = r.gr ?? []
    if (!gr.length || !gr[0].gd) return []

    // Extract track seokeys from search results
    const trackSeokeys: string[] = []
    for (let i = 0; i < Math.min(limit, gr[0].gd.length); i++) {
      const track = gr[0].gd[i]
      if (track.seo) {
        trackSeokeys.push(track.seo)
      }
    }

    if (trackSeokeys.length === 0) return []

    // Fetch all song details in parallel for maximum speed
    const songPromises = trackSeokeys.map(async (seokey) => {
      try {
        const detailResult = await this.fetchJson(apiEndpoints.songDetailsUrl + seokey, 'POST', {}, 3000)
        if (!detailResult || typeof detailResult !== 'object') return null
        const res = detailResult as { tracks: Array<Record<string, unknown>> }
        if (res.tracks && res.tracks.length > 0) {
          return await this.formatters._formatJsonSongDetails(res.tracks[0])
        }
        return null
      } catch {
        // Skip failed requests
        return null
      }
    })

    // Wait for all requests to complete
    const songResults = await Promise.allSettled(songPromises)

    // Filter out failed/null results
    const songs: unknown[] = []
    for (const result of songResults) {
      if (result.status === 'fulfilled' && result.value !== null) {
        songs.push(result.value)
      }
    }

    return songs
  }

  /**
   * Search for albums - fetches individual album details for better data
   */
  async searchAlbums(q: string, limit: number): Promise<unknown[]> {
    const url = `${apiEndpoints.searchAlbumsUrl}${encodeURIComponent(q)}`
    const result = await this.fetchJson(url)
    if (!result || typeof result !== 'object') return []
    const r = result as { gr?: Array<{ gd?: Array<{ seo: string }> }> }
    const gr = r.gr ?? []
    if (!gr.length || !gr[0].gd) return []

    // Extract album seokeys from search results
    const albumSeokeys: string[] = []
    for (let i = 0; i < Math.min(limit, gr[0].gd.length); i++) {
      const album = gr[0].gd[i]
      if (album.seo) {
        albumSeokeys.push(album.seo)
      }
    }

    if (albumSeokeys.length === 0) return []

    // Fetch all album details in parallel for maximum speed
    const albumPromises = albumSeokeys.map(async (seokey) => {
      try {
        const detailResult = await this.fetchJson(apiEndpoints.albumDetailsUrl + seokey, 'POST', {}, 3000)
        if (!detailResult || typeof detailResult !== 'object') return null
        return await this.formatters._formatJsonAlbumDetails(detailResult)
      } catch {
        // Skip failed requests
        return null
      }
    })

    // Wait for all requests to complete
    const albumResults = await Promise.allSettled(albumPromises)

    // Filter out failed/null results
    const albums: unknown[] = []
    for (const result of albumResults) {
      if (result.status === 'fulfilled' && result.value !== null) {
        albums.push(result.value)
      }
    }

    return albums
  }

  /**
   * Search for playlists
   */
  async searchPlaylists(q: string, limit: number): Promise<unknown[]> {
    const url = `${apiEndpoints.playlistSearchUrl}${encodeURIComponent(q)}`
    const result = await this.fetchJson(url)
    return this.formatters._formatJsonPlaylistSearch(result, limit)
  }

  /**
   * Search for artists
   */
  async searchArtists(q: string, limit: number): Promise<unknown[]> {
    const url = `${apiEndpoints.searchArtistsUrl}${encodeURIComponent(q)}`
    const result = await this.fetchJson(url)
    if (!result || typeof result !== 'object') return []
    const r = result as { gr?: Array<{ gd?: Array<any> }> }
    const gr = r.gr ?? []
    if (!gr.length || !gr[0].gd) return []
    const artists: unknown[] = []
    for (let i = 0; i < Math.min(limit, gr[0].gd.length); i++) {
      const artist = gr[0].gd[i]
      artists.push({
        artist_id: artist.id,
        seokey: artist.seo,
        name: artist.ti,
        artwork: artist.aw,
        artist_url: `https://gaana.com/artist/${artist.seo}`
      })
    }
    return artists
  }
}
