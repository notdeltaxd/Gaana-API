/**
 * @fileoverview Handler for playlist search endpoint.
 * Searches for playlists matching the query string.
 * @module handlers/searchPlaylists
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryParam, validateQueryNumber, validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for playlist search.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with search results or error
 *
 * @example
 * ```typescript
 * GET /api/search/playlists?q=hits&limit=10
 * ```
 */
export async function handleSearchPlaylists(c: Context) {
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
    const playlists = await gaanaService.searchPlaylists(queryValidation.data, limitValidation.data)

    return c.json(gaanaService.formatResponse(playlists, { count: playlists.length }))
  } catch (err) {
    console.error('Search playlists error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Search failed' }, 500)
  }
}
