/**
 * @fileoverview Custom API Error class for standardized error handling.
 * Includes HTTP status code and error code slug for production-ready responses.
 * @module utils/ApiError
 */

/**
 * Standardized API Error class.
 * Extends the built-in Error class to include API-specific metadata.
 *
 * @class ApiError
 * @extends Error
 */
export class ApiError extends Error {
  public statusCode: number
  public errorCode: string

  /**
   * Creates an instance of ApiError.
   *
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {string} [errorCode='INTERNAL_ERROR'] - Error code slug for client-side handling
   */
  constructor(statusCode: number, message: string, errorCode: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.name = 'ApiError'
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}
