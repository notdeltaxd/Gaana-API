/**
 * @fileoverview Handler for album search endpoint.
 * Searches for albums matching the query string.
 * @module handlers/searchAlbums
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryParam, validateQueryNumber, validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for album search.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with search results or error
 *
 * @example
 * ```typescript
 * GET /api/search/albums?q=thriller&limit=10
 * ```
 */
export async function handleSearchAlbums(c: Context) {
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
    const albums = await gaanaService.searchAlbums(queryValidation.data, limitValidation.data)

    return c.json(gaanaService.formatResponse(albums, { count: albums.length }))
  } catch (err) {
    console.error('Search albums error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Search failed' }, 500)
  }
}
