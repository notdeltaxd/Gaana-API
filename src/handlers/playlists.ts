/**
 * @fileoverview Handler for playlist detail endpoints.
 * Supports both path parameters and query parameters (URLs or seokeys).
 * Includes timeout handling for long-running requests.
 * @module handlers/playlists
 */

import { Context } from 'hono'
import { gaanaService, functions, errors } from '../services/instances.js'
import { validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for playlist details.
 *
 * Accepts playlist identifier via:
 * - Path parameter: `/api/playlists/:seokey`
 * - Query parameter: `/api/playlists?url=https://gaana.com/playlist/seokey` or `/api/playlists?seokey=seokey`
 *
 * Returns playlist information including all tracks.
 * Includes an 8-second timeout to prevent long-running requests.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with playlist details or error
 */
export async function handleGetPlaylist(c: Context) {
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

    // Add timeout wrapper - 8 seconds total timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    })

    const playlistInfo = await Promise.race([
      gaanaService.getPlaylistInfo(seokey),
      timeoutPromise
    ]) as Record<string, unknown>

    // Check if response contains an error
    if (playlistInfo.error) {
      return c.json(playlistInfo, 404)
    }

    return c.json(gaanaService.formatResponse(playlistInfo))
  } catch (err) {
    console.error('Get playlist error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to get playlist'
    
    // Check if it's a timeout error
    if (errorMessage.includes('timeout') || errorMessage === 'Request timeout') {
      return c.json({ error: 'Request timeout' }, 408)
    }
    
    return c.json({ error: errorMessage }, 500)
  }
}
