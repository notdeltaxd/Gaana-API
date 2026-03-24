/**
 * @fileoverview Handler for charts endpoint.
 * Returns top charts/top songs from Gaana.
 * @module handlers/charts
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryNumber, validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for top charts.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with charts data or error
 *
 * @example
 * ```typescript
 * GET /api/charts?limit=20
 * ```
 */
export async function handleCharts(c: Context) {
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
    const chartsData = await gaanaService.getCharts(limitValidation.data)
    return c.json(gaanaService.formatResponse(chartsData))
  } catch (err) {
    console.error('Charts error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get charts' }, 500)
  }
}
