/**
 * @fileoverview Handler for song search endpoint.
 * Searches for songs matching the query string.
 * @module handlers/searchSongs
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryParam, validateQueryNumber, validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for song search.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with search results or error
 *
 * @example
 * ```typescript
 * GET /api/search/songs?q=despacito&limit=10
 * ```
 */
export async function handleSearchSongs(c: Context) {
  // Validate search query
  const queryValidation = validateQueryParam(c, 'q', validationSchemas.searchQuery, true)
  if (!queryValidation.success) {
    return c.json({ error: queryValidation.error }, queryValidation.status)
  }

  // Validate limit
  const limitValidation = validateQueryNumber(
    c,
    'limit',
    validationSchemas.searchLimit,
    10
  )
  if (!limitValidation.success) {
    return c.json({ error: limitValidation.error }, limitValidation.status)
  }

  try {
    const songs = await gaanaService.searchSongs(queryValidation.data, limitValidation.data)

    return c.json(gaanaService.formatResponse(songs, { count: songs.length }))
  } catch (err) {
    console.error('Search songs error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Search failed' }, 500)
  }
}
