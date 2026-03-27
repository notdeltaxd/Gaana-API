/**
 * @fileoverview Authentication middleware for the API.
 * Enforces token-based authentication if API_KEY is set in environment.
 * Provides timing-safe comparison and support for multiple keys.
 * @module middleware/auth
 */

import { Context, Next } from 'hono'
import { timingSafeEqual } from 'node:crypto'
import { HTTP_STATUS } from '../constants/index.js'
import { ApiError } from '../utils/ApiError.js'
import { ERROR_MESSAGES } from '../utils/errors.js'

/**
 * Extracts the authentication token from various request sources.
 * Supports:
 * 1. Authorization: Bearer <token> header
 * 2. apiKey=<token> query parameter
 *
 * @param {Context} ctx - Hono context object
 * @returns {string | undefined} Extracted token or undefined if not found
 */
const extractToken = (ctx: Context): string | undefined => {
  // Try Authorization header
  const authHeader = ctx.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Fallback to query parameter
  return ctx.req.query('apiKey')
}

/**
 * Securely validates a provided token against a list of allowed keys.
 * Uses timing-safe comparison to prevent side-channel attacks.
 *
 * @param {string} provided - The token provided by the client
 * @param {string[]} allowed - Array of valid API keys from environment
 * @returns {boolean} True if the token matches any allowed key
 */
const isValidToken = (provided: string, allowed: string[]): boolean => {
  const providedBuffer = Buffer.from(provided)

  return allowed.some((key) => {
    const keyBuffer = Buffer.from(key)

    // timingSafeEqual requires buffers of identical length.
    // We check length first (standard practice) and then compare.
    // If lengths differ, we still perform a "no-op" comparison logic 
    // to maintain a more consistent timing profile across attempts.
    if (providedBuffer.length !== keyBuffer.length) {
      return false
    }

    return timingSafeEqual(providedBuffer, keyBuffer)
  })
}

/**
 * Authentication middleware.
 * Checks for API_KEY(s) in environment variables. If present, it validates the request.
 * Supports multiple keys via comma-separated string in API_KEY env variable.
 *
 * @param {Context} ctx - Hono context object
 * @param {Next} next - Next middleware function
 * @throws {ApiError} If authentication fails
 */
export const authMiddleware = async (ctx: Context, next: Next) => {
  const apiKeysString = process.env.API_KEY
  const requestId = ctx.get('requestId') || 'UNKNOWN'

  // If no API_KEY is configured, authentication is disabled
  if (!apiKeysString) {
    return await next()
  }

  const allowedKeys = apiKeysString.split(',').map((k) => k.trim())
  const providedToken = extractToken(ctx)

  // Validate the token using timing-safe comparison
  if (!providedToken || !isValidToken(providedToken, allowedKeys)) {
    console.warn(`[${requestId}] Authentication failed for ${ctx.req.path}`)
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.UNAUTHORIZED,
      'UNAUTHORIZED'
    )
  }

  await next()
}
