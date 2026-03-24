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
import { showBanner } from './utils/banner.js'
import { gaanaService } from './services/instances.js'

/**
 * API app with base path /api
 * Contains all API endpoints
 */
const apiApp = new Hono()

// Global middleware - applied to all API routes
apiApp.use('*', cors())
apiApp.use('*', logger())
apiApp.use('*', prettyJSON())
apiApp.use('*', customLogger)
apiApp.use('*', errorHandler)

// Attribution header middleware
apiApp.use('*', async (c, next) => {
  c.header(
    'X-Powered-By',
    'Unofficial Gaana API - https://github.com/notdeltaxd/Gaana-API'
  )
  c.header('X-Project-Author', 'notdeltaxd')
  c.header('X-Project-Name', 'Unofficial Gaana API')
  c.header('X-Project-Repository', 'https://github.com/notdeltaxd/Gaana-API')
  c.header(
    'Access-Control-Expose-Headers',
    'X-Powered-By, X-Project-Author, X-Project-Name, X-Project-Repository'
  )
  await next()
})

/**
 * Credits endpoint - Attribution information.
 *
 * @route GET /api/credits
 * @returns {Object} Credits information object
 */
apiApp.get('/credits', (c) => {
  return c.json(gaanaService.formatResponse({
    project: 'Unofficial Gaana API',
    author: 'notdeltaxd',
    repository: 'https://github.com/notdeltaxd/Gaana-API',
    license: 'Apache-2.0',
    notice: 'Please retain attribution when using this project.'
  }))
})

/**
 * Root endpoint - API information and documentation.
 * Returns API version, status, and available endpoints.
 *
 * @route GET /api
 * @returns {Object} API information object
 */
apiApp.get('/', (c) => {
  return c.json(gaanaService.formatResponse({
    message: 'Welcome to the Unofficial Gaana API',
    status: 'online',
    endpoints: {
      search: {
        global: '/api/search?q={query}&limit={n}',
        songs: '/api/search/songs?q={query}&limit={n}',
        albums: '/api/search/albums?q={query}&limit={n}',
        playlists: '/api/search/playlists?q={query}&limit={n}',
        artists: '/api/search/artists?q={query}&limit={n}'
      },
      details: {
        song: '/api/songs/{seokey}',
        album: '/api/albums/{seokey}',
        playlist: '/api/playlists/{seokey}',
        artist: '/api/artists/{seokey}',
        lyrics: '/api/lyrics/{seokey}'
      },
      browse: {
        trending: '/api/trending?language={hi,en}&limit={n}',
        charts: '/api/charts?limit={n}',
        newReleases: '/api/new-releases?language={hi,en}&page={n}',
        albumList: '/api/album-list?language={hindi,punjabi...}&page={n}',
        lyricsList: '/api/lyrics?page={n}'
      },
      media: {
        stream: '/api/stream/{track_id}?quality={low,medium,high}'
      },
      system: {
        health: '/api/health',
        credits: '/api/credits'
      }
    }
  }))
})

// Register all REST API routes
apiApp.route('', router)

/**
 * 404 Not Found handler for API routes.
 * Returns a standardized error response for unmatched routes.
 *
 * @param {Context} ctx - Hono context object
 * @returns {Response} JSON error response with 404 status
 */
apiApp.notFound((ctx) => {
  return ctx.json(gaanaService.formatResponse({ error: 'Not found - check API documentation' }), 404)
})

/**
 * Main application instance.
 * Handles root endpoint and mounts API app at /api
 */
const app = new Hono()

// Global middleware for root app
app.use('*', cors())
app.use('*', logger())
app.use('*', prettyJSON())

// Attribution header middleware
app.use('*', async (c, next) => {
  c.header(
    'X-Powered-By',
    'Unofficial Gaana API - https://github.com/notdeltaxd/Gaana-API'
  )
  c.header('X-Project-Author', 'notdeltaxd')
  c.header('X-Project-Name', 'Unofficial Gaana API')
  c.header('X-Project-Repository', 'https://github.com/notdeltaxd/Gaana-API')
  c.header(
    'Access-Control-Expose-Headers',
    'X-Powered-By, X-Project-Author, X-Project-Name, X-Project-Repository'
  )
  await next()
})

/**
 * Credits endpoint - Attribution information.
 *
 * @route GET /credits
 * @returns {Object} Credits information object
 */
app.get('/credits', (c) => {
  return c.json(gaanaService.formatResponse({
    project: 'Unofficial Gaana API',
    author: 'notdeltaxd',
    repository: 'https://github.com/notdeltaxd/Gaana-API',
    license: 'Apache-2.0',
    notice: 'Please retain attribution when using this project.'
  }))
})

/**
 * Root endpoint handler.
 * Shows API information and redirects users to /api
 *
 * @route GET /
 * @returns {Object} Root endpoint information
 */
app.get('/', (c) => {
  return c.json(gaanaService.formatResponse({
    message: '🎵 Unofficial Gaana API is online!',
    note: 'All API endpoints are available at /api',
    quickStart: 'Visit /api to see all available endpoints'
  }))
})

// Mount API app at /api
app.route('/api', apiApp)

/**
 * 404 Not Found handler for root app.
 * Returns a helpful message directing users to /api
 *
 * @param {Context} ctx - Hono context object
 * @returns {Response} JSON error response with 404 status
 */
app.notFound((ctx) => {
  return ctx.json(
    gaanaService.formatResponse({
      error: 'Not found - All API endpoints are available at /api',
      documentation: 'https://github.com/notdeltaxd/Gaana-API',
      example: 'GET /api/search?q=despacito'
    }),
    404
  )
})

// Show banner on startup
// Only show here if in production (Vercel) or if run directly (bun run dev)
if (process.env.VERCEL || (import.meta as any).main) {
  showBanner()
}

export default app
