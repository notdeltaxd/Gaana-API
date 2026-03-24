/**
 * @fileoverview Handler for trending tracks endpoint.
 * Returns trending songs filtered by language (optional).
 * @module handlers/trending
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryParam, validateQueryNumber, validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for trending tracks.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with trending tracks or error
 *
 * @example
 * ```typescript
 * GET /api/trending?language=hi&limit=20
 * GET /api/trending?limit=10
 * ```
 */
export async function handleTrending(c: Context) {
  // Validate language (optional)
  const languageValidation = validateQueryParam(c, 'language', validationSchemas.language, false)
  if (!languageValidation.success) {
    return c.json({ error: languageValidation.error }, languageValidation.status)
  }

  // Validate limit
  const limitValidation = validateQueryNumber(
    c,
    'limit',
    validationSchemas.limit,
    10
  )
  if (!limitValidation.success) {
    return c.json({ error: limitValidation.error }, limitValidation.status)
  }

  try {
    const trendingData = await gaanaService.getTrendingTracks(
      languageValidation.data || '',
      limitValidation.data
    )
    return c.json(gaanaService.formatResponse(trendingData))
  } catch (err) {
    console.error('Trending error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get trending' }, 500)
  }
}
