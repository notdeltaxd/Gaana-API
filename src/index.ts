/**
 * @fileoverview Main application entry point and Hono app configuration.
 * Sets up middleware, routes, and error handling for the Gaana API.
 * @module index
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { errorHandler, logger as customLogger } from './middleware/index.js'
import router from './routes/index.js'

/**
 * Main Hono application instance.
 * All routes are prefixed with `/api` base path.
 *
 * @constant
 */
const app = new Hono().basePath('/api')

// Global middleware - applied to all routes
app.use('*', cors())
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', customLogger)
app.use('*', errorHandler)

/**
 * Root endpoint - API information and documentation.
 * Returns API version, status, and available endpoints.
 *
 * @route GET /
 * @returns {Object} API information object
 */
app.get('/', (c) => {
  return c.json({
    message: '🎵 Gaana API',
    version: '1.0.0',
    status: 'running',
    documentation: 'https://github.com/notdeltaxd/Gaana-API',
    endpoints: {
      search: {
        global: 'GET /api/search?q=query&limit=10',
        songs: 'GET /api/search/songs?q=query&limit=10',
        albums: 'GET /api/search/albums?q=query&limit=10',
        playlists: 'GET /api/search/playlists?q=query&limit=10',
        artists: 'GET /api/search/artists?q=query&limit=10'
      },
      resources: {
        song: 'GET /api/songs/:id or GET /api/songs?url=https://gaana.com/song/:id or GET /api/songs?seokey=:id',
        album: 'GET /api/albums/:id or GET /api/albums?url=https://gaana.com/album/:id or GET /api/albums?seokey=:id',
        playlist:
          'GET /api/playlists/:id or GET /api/playlists?url=https://gaana.com/playlist/:id or GET /api/playlists?seokey=:id',
        artist:
          'GET /api/artists/:id or GET /api/artists?url=https://gaana.com/artist/:id or GET /api/artists?seokey=:id'
      },
      browse: {
        trending: 'GET /api/trending?language=hi&limit=10',
        charts: 'GET /api/charts?limit=10',
        newReleases: 'GET /api/new-releases?language=hi'
      },
      system: {
        health: 'GET /api/health'
      }
    }
  })
})

// Register all REST API routes
app.route('', router)

/**
 * 404 Not Found handler.
 * Returns a standardized error response for unmatched routes.
 *
 * @param {Context} ctx - Hono context object
 * @returns {Response} JSON error response with 404 status
 */
app.notFound((ctx) => {
  return ctx.json(
    {
      success: false,
      error: 'Not found - check API documentation',
      timestamp: new Date()
    },
    404
  )
})

export default app
