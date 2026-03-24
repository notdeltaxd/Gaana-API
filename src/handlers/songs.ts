/**
 * @fileoverview Handler for song detail endpoints.
 * Supports both path parameters and query parameters (URLs or seokeys).
 * @module handlers/songs
 */

import { Context } from 'hono'
import { gaanaService, functions, errors } from '../services/instances.js'
import { validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for song details.
 *
 * Accepts song identifier via:
 * - Path parameter: `/api/songs/:seokey`
 * - Query parameter: `/api/songs?url=https://gaana.com/song/seokey` or `/api/songs?seokey=seokey`
 *
 * Validates input, extracts seokey from URLs if needed, and returns formatted song details.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with song details or error
 *
 * @example
 * ```typescript
 * // Path parameter
 * GET /api/songs/tune-ka-mathabhar
 *
 * // Query parameter with URL
 * GET /api/songs?url=https://gaana.com/song/tune-ka-mathabhar
 *
 * // Query parameter with seokey
 * GET /api/songs?seokey=tune-ka-mathabhar
 * ```
 */
export async function handleGetSong(c: Context) {
  // Try to get seokey from path param or query param (for URL support)
  const pathParam = c.req.param('seokey')
  const queryParam = c.req.query('url') || c.req.query('seokey')
  const input = pathParam || queryParam

  if (!input) {
    return c.json({ error: 'Seokey or URL is required' }, 400)
  }

  // Validate input (allows URLs and seokeys)
  const seokeyValidation = validationSchemas.seokey.safeParse(input)
  if (!seokeyValidation.success) {
    return c.json({ error: seokeyValidation.error.issues[0]?.message || 'Invalid seokey or URL' }, 400)
  }

  try {
    // Extract seokey from param (handles both seokey and full URLs)
    const seokey = functions.extractSeokey(seokeyValidation.data)
    if (!seokey) {
      return c.json(errors.invalidSeokey(), 400)
    }

    const songInfo = await gaanaService.getSongInfo(seokey)

    // Check if response contains an error
    if (songInfo.error) {
      return c.json(songInfo, 404)
    }

    return c.json(gaanaService.formatResponse(songInfo))
  } catch (err) {
    console.error('Get song error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get song' }, 500)
  }
}
