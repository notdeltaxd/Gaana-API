/**
 * @fileoverview Handler for health check endpoint.
 * Returns API health status and system information.
 * @module handlers/health
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'

/**
 * Handles GET requests for health check.
 * Returns API status, uptime, and environment information.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with health status
 *
 * @example
 * ```typescript
 * GET /api/health
 * // Returns: { status: 'ok', timestamp: '...', uptime: 1234, environment: 'production' }
 * ```
 */
export async function handleHealth(c: Context) {
  return c.json(gaanaService.formatResponse({
    status: 'ok',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }))
}
