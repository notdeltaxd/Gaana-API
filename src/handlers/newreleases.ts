/**
 * @fileoverview Handler for new releases endpoint.
 * Returns newly released songs filtered by language (optional).
 * @module handlers/newreleases
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryNumber, validationSchemas } from '../utils/validation.js'
import { albumListSupportedLanguages, type AlbumListLanguage } from '../constants/languages.js'

/**
 * Handles GET requests for new releases.
 */
export async function handleNewReleases(c: Context) {
  // Validate language (optional, defaults to English if not provided)
  const rawLanguage = (c.req.query('language') || 'english').trim().toLowerCase()
  const language = rawLanguage as AlbumListLanguage

  if (!albumListSupportedLanguages.includes(language)) {
    return c.json(
      {
        error: `Unsupported language. Supported languages: ${albumListSupportedLanguages.join(', ')}`
      },
      400
    )
  }

  // Validate page and limit
  const pageValidation = validateQueryNumber(c, 'page', validationSchemas.page, 0)
  if (!pageValidation.success) {
    return c.json({ error: pageValidation.error }, pageValidation.status)
  }

  const limitValidation = validateQueryNumber(c, 'limit', validationSchemas.limit, 40)
  if (!limitValidation.success) {
    return c.json({ error: limitValidation.error }, limitValidation.status)
  }

  try {
    const newReleasesData = await gaanaService.getNewReleases(
      language,
      pageValidation.data,
      limitValidation.data
    )
    return c.json(
      gaanaService.formatResponse(newReleasesData, {
        count: (newReleasesData as any).length || 0,
        page: pageValidation.data,
        limit: limitValidation.data
      })
    )
  } catch (err) {
    console.error('New releases error:', err)
    return c.json(
      {
        error: err instanceof Error ? err.message : 'Failed to get new releases'
      },
      500
    )
  }
}
