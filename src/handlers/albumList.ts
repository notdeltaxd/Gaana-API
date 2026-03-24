/**
 * @fileoverview Handler for album list endpoint.
 * Returns language-filtered albums from Gaana's apiv2 albumList API.
 * @module handlers/albumList
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryNumber, validationSchemas } from '../utils/validation.js'
import { albumListSupportedLanguages, type AlbumListLanguage } from '../constants/languages.js'

/**
 * Handles GET requests for album lists by language.
 *
 * @example
 * GET /api/album-list?language=hindi&page=0
 * GET /api/album-list?language=punjabi&page=0
 */
export async function handleAlbumList(c: Context) {
  const rawLanguage = (c.req.query('language') || 'hindi').trim().toLowerCase()
  const language = rawLanguage as AlbumListLanguage
  if (!albumListSupportedLanguages.includes(language)) {
    return c.json(
      {
        error: `Unsupported language. Supported languages: ${albumListSupportedLanguages.join(', ')}`
      },
      400
    )
  }

  const pageValidation = validateQueryNumber(c, 'page', validationSchemas.page, 0)
  if (!pageValidation.success) {
    return c.json({ error: pageValidation.error }, pageValidation.status)
  }

  try {
    const data = await gaanaService.getAlbumList(language, pageValidation.data)
    return c.json(gaanaService.formatResponse(data))
  } catch (err) {
    console.error('Album list error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get album list' }, 500)
  }
}
