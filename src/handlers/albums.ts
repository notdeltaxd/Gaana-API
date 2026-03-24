/**
 * @fileoverview Handler for album detail endpoints.
 * Supports both path parameters and query parameters (URLs or seokeys).
 * @module handlers/albums
 */

import { Context } from 'hono'
import { gaanaService, functions, errors } from '../services/instances.js'
import { validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for album details.
 *
 * Accepts album identifier via:
 * - Path parameter: `/api/albums/:seokey`
 * - Query parameter: `/api/albums?url=https://gaana.com/album/seokey` or `/api/albums?seokey=seokey`
 *
 * Returns album information including all tracks.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with album details or error
 */
export async function handleGetAlbum(c: Context) {
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

    const albumInfo = await gaanaService.getAlbumInfo(seokey, true)

    // Check if response contains an error
    if (albumInfo.error) {
      return c.json(albumInfo, 404)
    }

    return c.json(gaanaService.formatResponse(albumInfo))
  } catch (err) {
    console.error('Get album error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get album' }, 500)
  }
}
