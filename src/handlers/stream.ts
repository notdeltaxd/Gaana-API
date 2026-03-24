/**
 * @fileoverview Handler for stream URL endpoints.
 * Gets decrypted HLS stream URLs for tracks by track ID.
 * @module handlers/stream
 */

import { Context } from 'hono'
import { fetchStreamUrl } from '../utils/crypto.js'
import { gaanaService } from '../services/instances.js'

/**
 * Handles GET requests for stream URLs by track ID.
 *
 * Accepts track ID via:
 * - Path parameter: `/api/stream/:trackId`
 * - Query parameter: `/api/stream?track_id=12345`
 *
 * Optionally accepts quality parameter (low, medium, high - defaults to high)
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with stream URL or error
 *
 * @example
 * ```typescript
 * // Path parameter
 * GET /api/stream/29797868
 *
 * // Query parameter
 * GET /api/stream?track_id=29797868
 *
 * // With quality
 * GET /api/stream/29797868?quality=medium
 * ```
 */
export async function handleGetStream(c: Context) {
  // Try to get track_id from path param or query param
  const pathParam = c.req.param('trackId')
  const queryParam = c.req.query('track_id')
  const trackId = pathParam || queryParam

  if (!trackId) {
    return c.json({ error: 'Track ID is required' }, 400)
  }

  // Validate track_id is numeric
  if (!/^\d+$/.test(trackId)) {
    return c.json({ error: 'Track ID must be numeric' }, 400)
  }

  // Get quality parameter (default to high)
  const qualityParam = c.req.query('quality')
  const quality: 'low' | 'medium' | 'high' =
    qualityParam === 'low' || qualityParam === 'medium' || qualityParam === 'high' ? qualityParam : 'high'

  try {
    const streamUrl = await fetchStreamUrl(trackId, quality)

    if (!streamUrl) {
      return c.json({ error: 'Failed to get stream URL' }, 404)
    }

    return c.json(gaanaService.formatResponse(streamUrl))
  } catch (err) {
    console.error('Get stream URL error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get stream URL' }, 500)
  }
}
