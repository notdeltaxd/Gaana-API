/**
 * @fileoverview Middleware functions for request handling.
 * Provides error handling, logging, and attribution middleware.
 * @module middleware/index
 */

import { Context, Next, Hono, ErrorHandler } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { HTTP_STATUS } from '../constants/index.js'
import { sendError } from '../utils/response.js'
import { ApiError } from '../utils/ApiError.js'
import { ERROR_MESSAGES } from '../utils/errors.js'

/**
 * Global Error Handler for Hono.
 * Standardizes error responses for both expected ApiErrors and unexpected failures.
 *
 * @param {Error} error - The caught error
 * @param {Context} ctx - Hono context object
 * @returns {Response} Standardized JSON error response
 */
export const errorHandler: ErrorHandler = (error, ctx) => {
  const requestId = ctx.get('requestId') || Math.random().toString(36).substring(2, 10).toUpperCase()
  
  if (error instanceof ApiError) {
    return sendError(
      ctx,
      error.message,
      error.statusCode,
      error.errorCode,
      requestId
    )
  }

  // Handle other types of errors (e.g., validation, etc.)
  console.error(`[${requestId}] Unhandled Error:`, error)
  return sendError(
    ctx,
    ERROR_MESSAGES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'INTERNAL_SERVER_ERROR',
    requestId
  )
}

/**
 * Metadata middleware.
 * Generates a unique request ID for tracking.
 */
export const requestIdMiddleware = async (ctx: Context, next: Next) => {
  const requestId = Math.random().toString(36).substring(2, 10).toUpperCase()
  ctx.set('requestId', requestId)
  await next()
}

/**
 * Request logging middleware.
 * Logs HTTP method, path, and request duration to console.
 */
export const logger = async (ctx: Context, next: Next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  const requestId = ctx.get('requestId') || '-'
  console.log(`[${requestId}] ${ctx.req.method} ${ctx.req.path} - ${duration}ms`)
}

/**
 * Attribution header middleware.
 * Adds project information headers to every response.
 */
export const attributionMiddleware = async (ctx: Context, next: Next) => {
  ctx.header(
    'X-Powered-By',
    'Unofficial Gaana API - https://github.com/notdeltaxd/Gaana-API'
  )
  ctx.header('X-Project-Author', 'notdeltaxd')
  ctx.header('X-Project-Name', 'Unofficial Gaana API')
  ctx.header('X-Project-Repository', 'https://github.com/notdeltaxd/Gaana-API')
  ctx.header(
    'Access-Control-Expose-Headers',
    'X-Powered-By, X-Project-Author, X-Project-Name, X-Project-Repository'
  )
  await next()
}

/**
 * Applies common middleware to a Hono application instance.
 * Reduces duplication and ensures consistent configuration across app sections.
 *
 * @param {Hono} app - The Hono application instance
 */
export const applyCommonMiddleware = (app: Hono) => {
  // Global configurations
  app.use('*', cors())
  app.use('*', honoLogger())
  app.use('*', prettyJSON())
  app.use('*', secureHeaders())
  
  // Custom middleware
  app.use('*', requestIdMiddleware)
  app.use('*', logger)
  app.use('*', attributionMiddleware)
  
  // Error handling
  app.onError(errorHandler)
}

export * from './auth.js'
