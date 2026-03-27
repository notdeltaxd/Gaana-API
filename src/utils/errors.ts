/**
 * @fileoverview Standardized professional error messages and error response utilities.
 * @module utils/errors
 */

/**
 * Standard professional error messages used across the API.
 * Follows a clean, descriptive style suitable for production environments.
 * @constant
 */
export const ERROR_MESSAGES = {
  INVALID_SEOKEY: 'The provided seokey is invalid or formatted incorrectly.',
  NO_RESULTS: 'No results were found matching your request.',
  MISSING_QUERY: "The required query parameter 'q' is missing.",
  MISSING_SEOKEY: "The required query parameter 'seokey' is missing.",
  UNAUTHORIZED: 'Full authentication is required to access this resource.',
  FORBIDDEN: 'Access to this resource is denied.',
  NOT_FOUND: 'The requested resource could not be found.',
  INTERNAL_ERROR: 'An unexpected error occurred while processing your request.'
} as const

/**
 * Error response generator class.
 * Provides standardized error responses for common API error scenarios.
 *
 * @class Errors
 */
export class Errors {
  /**
   * Returns an error response for invalid or missing seokey.
   *
   * @returns {{ error: string }} Error response object
   */
  invalidSeokey() {
    return { error: ERROR_MESSAGES.INVALID_SEOKEY }
  }

  /**
   * Returns an error response when no results are found.
   *
   * @returns {{ error: string }} Error response object
   */
  noResults() {
    return { error: ERROR_MESSAGES.NO_RESULTS }
  }

  /**
   * Returns an error response for missing search query parameter.
   *
   * @returns {{ error: string }} Error response object
   */
  missingQuery() {
    return { error: ERROR_MESSAGES.MISSING_QUERY }
  }

  /**
   * Returns an error response for missing seokey parameter.
   *
   * @returns {{ error: string }} Error response object
   */
  missingSeokey() {
    return { error: ERROR_MESSAGES.MISSING_SEOKEY }
  }
}
