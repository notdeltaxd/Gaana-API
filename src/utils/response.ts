/**
 * @fileoverview Standardized HTTP response utilities for Hono framework.
 * @module utils/response
 */

import { Context } from 'hono'
import { HTTP_STATUS } from '../constants/index.js'
import type { ApiResponse } from '../types/index.js'

/**
 * Sends a successful JSON response with standardized format.
 *
 * @template T - Type of the data being returned
 * @param {Context} ctx - Hono context object
 * @param {T} data - Response data payload
 * @param {number} [statusCode=HTTP_STATUS.OK] - HTTP status code (default: 200)
 * @returns {Response} JSON response with success format
 */
export const sendSuccess = <T>(ctx: Context, data: T, statusCode = HTTP_STATUS.OK) => {
  return ctx.json<ApiResponse<T>>(
    {
      success: true,
      data,
      timestamp: new Date()
    },
    statusCode as any
  )
}

/**
 * Sends an error JSON response with standardized format.
 * Provides a nested error object following RESTful standards.
 *
 * @param {Context} ctx - Hono context object
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode=HTTP_STATUS.INTERNAL_SERVER_ERROR] - HTTP status code
 * @param {string} [code='INTERNAL_SERVER_ERROR'] - Error code slug for client-side handling
 * @param {string} [requestId] - Unique request ID for tracking
 * @returns {Response} JSON response with structured error format
 */
export const sendError = (
  ctx: Context,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code: string = 'INTERNAL_SERVER_ERROR',
  requestId: string = 'UNKNOWN'
) => {
  return ctx.json<ApiResponse<null>>(
    {
      success: false,
      error: {
        message,
        code,
        status: statusCode,
        requestId
      },
      timestamp: new Date()
    },
    statusCode as any
  )
}
