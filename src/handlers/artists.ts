/**
 * @fileoverview Handler for artist detail endpoints.
 * Supports both path parameters and query parameters (URLs or seokeys).
 * @module handlers/artists
 */

import { Context } from 'hono'
import { gaanaService, functions, errors } from '../services/instances.js'
import { validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for artist details.
 *
 * Accepts artist identifier via:
 * - Path parameter: `/api/artists/:seokey`
 * - Query parameter: `/api/artists?url=https://gaana.com/artist/seokey` or `/api/artists?seokey=seokey`
 *
 * Returns artist information including top tracks.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with artist details or error
 */
export async function handleGetArtist(c: Context) {
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

    const artistInfo = await gaanaService.getArtistInfo(seokey)
    
    // Check if response contains an error
    if (artistInfo.error) {
      return c.json(artistInfo, 404)
    }
    
    return c.json(gaanaService.formatResponse(artistInfo))
  } catch (err) {
    console.error('Get artist error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get artist' }, 500)
  }
}
