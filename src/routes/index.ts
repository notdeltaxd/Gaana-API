/**
 * @fileoverview Main API router configuration for all endpoints.
 * Defines RESTful routes organized by functionality:
 * - Health check
 * - Search endpoints (type-specific and global)
 * - Resource detail endpoints (songs, albums, playlists, artists)
 * - Browse endpoints (trending, charts, new releases)
 * - Stream URL endpoint
 *
 * Route order matters: more specific routes must come before generic ones.
 * @module routes/index
 */

import { Hono } from 'hono'
import { handleSearch } from '../handlers/search.js'
import { handleSearchSongs } from '../handlers/searchSongs.js'
import { handleSearchAlbums } from '../handlers/searchAlbums.js'
import { handleSearchPlaylists } from '../handlers/searchPlaylists.js'
import { handleSearchArtists } from '../handlers/searchArtists.js'
import { handleGetSong } from '../handlers/songs.js'
import { handleGetAlbum } from '../handlers/albums.js'
import { handleGetPlaylist } from '../handlers/playlists.js'
import { handleGetArtist } from '../handlers/artists.js'
import { handleTrending } from '../handlers/trending.js'
import { handleCharts } from '../handlers/charts.js'
import { handleNewReleases } from '../handlers/newreleases.js'
import { handleAlbumList } from '../handlers/albumList.js'
import { handleHealth } from '../handlers/health.js'
import { handleGetStream } from '../handlers/stream.js'

const router = new Hono()

// Health check
router.get('/health', handleHealth)

// Type-specific search endpoints (MUST come BEFORE /search)
// Usage:
//   GET /api/search/songs?q=despacito&limit=10
//   GET /api/search/albums?q=thriller&limit=10
//   GET /api/search/playlists?q=hits&limit=10
//   GET /api/search/artists?q=arijit&limit=10
router.get('/search/songs', handleSearchSongs)
router.get('/search/albums', handleSearchAlbums)
router.get('/search/playlists', handleSearchPlaylists)
router.get('/search/artists', handleSearchArtists)

// Global search endpoint - search across all types (AFTER specific routes)
// Usage:
//   GET /api/search?q=despacito
//   GET /api/search?q=despacito&limit=20
router.get('/search', handleSearch)

// Resource endpoints - get specific items by seokey or URL
// Query parameter support (MUST come BEFORE path parameter routes)
// Usage:
//   GET /api/songs?url=https://gaana.com/song/tune-ka-mathabhar
//   GET /api/songs?seokey=tune-ka-mathabhar
router.get('/songs', handleGetSong)
router.get('/albums', handleGetAlbum)
router.get('/playlists', handleGetPlaylist)
router.get('/artists', handleGetArtist)

// Path parameter support
// Usage:
//   GET /api/songs/tune-ka-mathabhar
//   GET /api/albums/thriller-album
//   GET /api/playlists/hits-2024
//   GET /api/artists/arijit-singh
router.get('/songs/:seokey', handleGetSong)
router.get('/albums/:seokey', handleGetAlbum)
router.get('/playlists/:seokey', handleGetPlaylist)
router.get('/artists/:seokey', handleGetArtist)

// Browse endpoints - get curated lists
// Usage:
//   GET /api/trending?language=hi&limit=20
//   GET /api/charts?limit=30
//   GET /api/new-releases?language=en
//   GET /api/album-list?language=hindi&page=0
router.get('/trending', handleTrending)
router.get('/charts', handleCharts)
router.get('/new-releases', handleNewReleases)
router.get('/album-list', handleAlbumList)

// Stream URL endpoint - get decrypted HLS stream URL by track ID
// Usage:
//   GET /api/stream/29797868
//   GET /api/stream?track_id=29797868
//   GET /api/stream/29797868?quality=medium
router.get('/stream', handleGetStream)
router.get('/stream/:trackId', handleGetStream)

export default router
