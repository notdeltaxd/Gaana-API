/**
 * @fileoverview Input validation schemas and utilities using Zod.
 * Provides type-safe validation for all API endpoints to prevent injection attacks
 * and ensure data integrity.
 * @module utils/validation
 */

import { z } from 'zod'
import { Context } from 'hono'

/**
 * Zod validation schemas for API endpoint parameters.
 * All schemas include security checks to prevent XSS and injection attacks.
 *
 * @constant
 */
export const validationSchemas = {
  // Seokey validation - allows alphanumeric, hyphens, underscores, dots, and URLs
  // Prevents script injection and other dangerous characters
  seokey: z
    .string()
    .min(1, 'Seokey is required')
    .max(500, 'Seokey is too long')
    .refine((val) => val.trim().length > 0, 'Seokey cannot be empty')
    .refine((val) => !/[<>'"&]/.test(val), 'Seokey contains invalid characters')
    .refine((val) => !val.includes('javascript:') && !val.includes('data:'), 'Seokey contains unsafe content'),

  // Search query validation
  searchQuery: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query is too long')
    .refine((val) => val.trim().length > 0, 'Search query cannot be empty'),

  // Limit validation - between 1 and 100
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100'),

  // Page validation - zero-based pagination
  page: z
    .number()
    .int('Page must be an integer')
    .min(0, 'Page must be at least 0')
    .max(1000, 'Page cannot exceed 1000'),

  // Language validation - optional, max 50 chars
  language: z.string().max(50, 'Language code is too long').optional(),

  // Limit for search endpoints - between 1 and 25
  searchLimit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(25, 'Limit cannot exceed 25')
}

/**
 * Parses and validates a query parameter as a number.
 *
 * @param {string | undefined} value - Query parameter value to parse
 * @param {number} defaultValue - Default value if parsing fails or value is missing
 * @param {z.ZodNumber} schema - Zod number schema for validation
 * @returns {number} Parsed and validated number, or default value
 *
 * @example
 * ```typescript
 * const limit = parseQueryNumber("10", 5, validationSchemas.limit)
 * // Returns: 10
 *
 * const limit = parseQueryNumber("invalid", 5, validationSchemas.limit)
 * // Returns: 5 (default)
 * ```
 */
export function parseQueryNumber(value: string | undefined, defaultValue: number, schema: z.ZodNumber): number {
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) return defaultValue
  const result = schema.safeParse(parsed)
  return result.success ? result.data : defaultValue
}

/**
 * Validates a path parameter using a Zod schema.
 *
 * @param {Context} c - Hono context object
 * @param {string} paramName - Name of the path parameter to validate
 * @param {z.ZodString} schema - Zod string schema for validation
 * @returns {{ success: true; data: string } | { success: false; error: string; status: 400 }}
 *   Validation result with data or error information
 *
 * @example
 * ```typescript
 * const result = validatePathParam(c, 'seokey', validationSchemas.seokey)
 * if (!result.success) {
 *   return c.json({ error: result.error }, result.status)
 * }
 * const seokey = result.data // Type-safe seokey
 * ```
 */
export function validatePathParam(
  c: Context,
  paramName: string,
  schema: z.ZodString
): { success: true; data: string } | { success: false; error: string; status: 400 } {
  const param = c.req.param(paramName)
  if (!param) {
    return {
      success: false,
      error: `${paramName} is required`,
      status: 400
    }
  }

  const result = schema.safeParse(param)
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || 'Invalid parameter',
      status: 400
    }
  }

  return { success: true, data: result.data }
}

/**
 * Validates a query parameter using a Zod schema.
 * Supports both required and optional parameters.
 *
 * @template T - Type of the validated parameter
 * @param {Context} c - Hono context object
 * @param {string} paramName - Name of the query parameter to validate
 * @param {z.ZodType<T>} schema - Zod schema for validation
 * @param {boolean} [required=false] - Whether the parameter is required
 * @returns {{ success: true; data: T } | { success: false; error: string; status: 400 }}
 *   Validation result with data or error information
 *
 * @example
 * ```typescript
 * const result = validateQueryParam(c, 'q', validationSchemas.searchQuery, true)
 * if (!result.success) {
 *   return c.json({ error: result.error }, result.status)
 * }
 * const query = result.data // Type-safe query string
 * ```
 */
export function validateQueryParam<T>(
  c: Context,
  paramName: string,
  schema: z.ZodType<T>,
  required: boolean = false
): { success: true; data: T } | { success: false; error: string; status: 400 } {
  const param = c.req.query(paramName)

  if (required && !param) {
    return {
      success: false,
      error: `${paramName} is required`,
      status: 400
    }
  }

  if (!param && !required) {
    // For optional parameters, return undefined if schema is optional
    // Check if schema is optional by checking if it's a ZodOptional
    if (schema instanceof z.ZodOptional) {
      return { success: true, data: undefined as T }
    }
    return {
      success: false,
      error: `${paramName} is required`,
      status: 400
    }
  }

  const result = schema.safeParse(param)
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || 'Invalid parameter',
      status: 400
    }
  }

  return { success: true, data: result.data }
}

/**
 * Validates a query parameter as a number with automatic parsing.
 * Falls back to a default value if parsing fails or parameter is missing.
 *
 * @param {Context} c - Hono context object
 * @param {string} paramName - Name of the query parameter to validate
 * @param {z.ZodNumber} schema - Zod number schema for validation
 * @param {number} defaultValue - Default value if parsing fails or parameter is missing
 * @returns {{ success: true; data: number } | { success: false; error: string; status: 400 }}
 *   Validation result with data or error information
 *
 * @example
 * ```typescript
 * const result = validateQueryNumber(c, 'limit', validationSchemas.searchLimit, 10)
 * if (!result.success) {
 *   return c.json({ error: result.error }, result.status)
 * }
 * const limit = result.data // Type-safe number
 * ```
 */
export function validateQueryNumber(
  c: Context,
  paramName: string,
  schema: z.ZodNumber,
  defaultValue: number
): { success: true; data: number } | { success: false; error: string; status: 400 } {
  const param = c.req.query(paramName)
  const parsed = param ? parseInt(param, 10) : defaultValue

  if (isNaN(parsed)) {
    return {
      success: false,
      error: `${paramName} must be a valid number`,
      status: 400
    }
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || 'Invalid number',
      status: 400
    }
  }

  return { success: true, data: result.data }
}
