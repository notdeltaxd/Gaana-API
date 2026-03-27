/**
 * @fileoverview Main application entry point and Hono app configuration.
 * Sets up middleware, routes, and error handling for the Gaana API.
 * @module index
 */

import { Hono } from 'hono'
import { applyCommonMiddleware, authMiddleware } from './middleware/index.js'
import router from './routes/index.js'
import { showBanner } from './utils/banner.js'
import { gaanaService } from './services/instances.js'

/**
 * Standard credits information.
 */
const creditsInfo = {
  project: 'Unofficial Gaana API',
  author: 'notdeltaxd',
  repository: 'https://github.com/notdeltaxd/Gaana-API',
  license: 'Apache-2.0',
  notice: 'Please retain attribution when using this project.'
}

/**
 * API application instance mounted at /api.
 */
const apiApp = new Hono()
applyCommonMiddleware(apiApp)
apiApp.use('*', authMiddleware)

/**
 * Credits endpoint - Attribution information.
 * @route GET /api/credits
 */
apiApp.get('/credits', (c) => c.json(gaanaService.formatResponse(creditsInfo)))

/**
 * Root API endpoint - Documentation and information.
 * @route GET /api
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
 * Main application instance.
 */
const app = new Hono()
applyCommonMiddleware(app)

/**
 * Root endpoint handler.
 * Shows API information and directs users to /api
 */
app.get('/', (c) => {
  return c.json(gaanaService.formatResponse({
    message: '🎵 Unofficial Gaana API is online!',
    note: 'All API endpoints are available at /api',
    quickStart: 'Visit /api to see all available endpoints'
  }))
})

/**
 * Credits endpoint for root app.
 */
app.get('/credits', (c) => c.json(gaanaService.formatResponse(creditsInfo)))

// Mount API app at /api
app.route('/api', apiApp)

/**
 * 404 Not Found handler.
 */
app.notFound((ctx) => {
  return ctx.json(
    gaanaService.formatResponse({
      error: 'Not found - check API documentation',
      documentation: 'https://github.com/notdeltaxd/Gaana-API',
      example: 'GET /api/search?q=despacito'
    }),
    404
  )
})

// Show banner on startup
if (process.env.VERCEL || (import.meta as any).main) {
  showBanner()
}

export default app
