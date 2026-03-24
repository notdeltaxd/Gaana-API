/**
 * @fileoverview Server entry point for Vercel serverless and local development.
 * Handles both Vercel serverless deployment and local development server setup.
 * @module api/index
 */

import { handle } from '@hono/node-server/vercel'
import { serve } from '@hono/node-server'
import app from '../src/index.js'
import { showBanner } from '../src/utils/banner.js'

/**
 * Vercel API configuration.
 * Disables body parser as Hono handles request parsing internally.
 *
 * @constant
 */
export const config = {
  api: {
    bodyParser: false
  }
}

/**
 * Vercel serverless handler export.
 * Used for Vercel serverless function deployment.
 */
export default handle(app)

// Run local development server when not on Vercel
if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT || '3000')
  serve(
    {
      fetch: app.fetch,
      port
    },
    (info) => {
      showBanner(info.port)
    }
  )
}
