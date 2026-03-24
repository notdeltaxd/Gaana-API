/**
 * @fileoverview Handler for lyrics endpoints.
 * Handles fetching a list of songs with lyrics and individual song lyrics.
 * @module handlers/lyrics
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validatePathParam, validateQueryNumber, validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for the list of songs with lyrics.
 */
export async function handleLyricsList(c: Context) {
  const pageValidation = validateQueryNumber(c, 'page', validationSchemas.page, 0)
  if (!pageValidation.success) {
    return c.json({ error: pageValidation.error }, pageValidation.status)
  }

  try {
    const data = await gaanaService.getLyricsList(pageValidation.data)
    // getLyricsList already calls the internal formatter _formatJsonLyricsList
    return c.json(gaanaService.formatResponse(data))
  } catch (err) {
    console.error('Lyrics list error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get lyrics list' }, 500)
  }
}

/**
 * Handles GET requests for individual song lyrics by seokey.
 */
export async function handleSongLyrics(c: Context) {
  const seokeyValidation = validatePathParam(c, 'seokey', validationSchemas.seokey)
  if (!seokeyValidation.success) {
    return c.json({ error: seokeyValidation.error }, seokeyValidation.status)
  }

  try {
    const data = await gaanaService.getSongLyrics(seokeyValidation.data)
    
    // Check if response contains an error
    if (data.error) {
       return c.json(gaanaService.formatResponse(data), 404)
    }
    
    // getSongLyrics already calls the internal formatter _formatJsonSongLyrics
    return c.json(gaanaService.formatResponse(data))
  } catch (err) {
    console.error('Song lyrics error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get song lyrics' }, 500)
  }
}
