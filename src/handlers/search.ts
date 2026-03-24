/**
 * @fileoverview Handler for global search endpoint.
 * Searches across all content types (songs, albums, playlists, artists) in parallel.
 * @module handlers/search
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryParam, validateQueryNumber, validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for global search across all content types.
 *
 * Searches for songs, albums, playlists, and artists simultaneously using parallel requests
 * for optimal performance. Returns results for all content types in a single response.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with search results for all content types
 *
 * @example
 * ```typescript
 * GET /api/search?q=despacito&limit=10
 * // Returns: { success: true, data: { songs: [...], albums: [...], playlists: [...], artists: [...] } }
 * ```
 */
export async function handleSearch(c: Context) {
  // Validate search query
  const queryValidation = validateQueryParam(c, 'q', validationSchemas.searchQuery, true)
  if (!queryValidation.success) {
    return c.json({ error: queryValidation.error }, queryValidation.status)
  }

  // Validate limit
  const limitValidation = validateQueryNumber(c, 'limit', validationSchemas.searchLimit, 10)
  if (!limitValidation.success) {
    return c.json({ error: limitValidation.error }, limitValidation.status)
  }

  try {
    // Run all searches in parallel for maximum speed
    const [songs, albums, playlists, artists] = await Promise.allSettled([
      gaanaService.searchSongs(queryValidation.data, limitValidation.data),
      gaanaService.searchAlbums(queryValidation.data, limitValidation.data),
      gaanaService.searchPlaylists(queryValidation.data, limitValidation.data),
      gaanaService.searchArtists(queryValidation.data, limitValidation.data)
    ])

    // Extract results, defaulting to empty array on failure
    const results: Record<string, unknown> = {
      songs: songs.status === 'fulfilled' ? songs.value : [],
      albums: albums.status === 'fulfilled' ? albums.value : [],
      playlists: playlists.status === 'fulfilled' ? playlists.value : [],
      artists: artists.status === 'fulfilled' ? artists.value : []
    }

    return c.json(gaanaService.formatResponse(results))
  } catch (err) {
    console.error('Global search error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Search failed' }, 500)
  }
}
