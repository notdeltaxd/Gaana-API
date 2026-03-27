/**
 * @fileoverview TypeScript type definitions for the API.
 * Contains interfaces and types used throughout the application.
 * @module types/index
 */

/**
 * Artist detail information from API responses.
 * @interface
 */
export interface ArtistDetail {
  artist_id: string
  name: string
  seokey?: string
  artwork: string
  role: string
  atw?: string
}

/**
 * Track artist information.
 * @interface
 */
export interface TrackArtist {
  name: string
  seokey?: string
  artist_id?: string
  id?: string
}

/**
 * Playlist information structure.
 * @interface
 */
export interface PlaylistInfo {
  title: string
  playlist_id: string
  seokey: string
  artwork: {
    small: string
    medium: string
    large: string
  }
  description: string
  author: string
  trackcount: number
  favorite_count: string
  language: string
  created_on: string
  modified_on: string
  playlist_url: string
}

/**
 * Artist information structure.
 * @interface
 */
export interface ArtistInfo {
  artist_id: string
  seokey: string
  name: string
  artwork: string
  artist_url: string
}

/**
 * Track/song information structure.
 * @interface
 */
export interface Track {
  language: string
  seokey: string
  name: string
  artwork: string
  entity_id: string
  track_url: string
  duration: string
  isrc: string
  artists: {
    artist_id: string
    name: string
    seokey: string
  }[]
  album: {
    album_id: string
    name: string
    album_seokey: string
    album_url: string
  }
  artists_string?: string
}

/**
 * Standardized API response structure.
 * Used for all API responses to maintain consistency.
 *
 * @template T - Type of the data payload
 * @interface
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    status: number
    requestId: string
    docs?: string
  }
  timestamp: Date
}

/**
 * Pagination parameters for list endpoints.
 * @interface
 */
export interface PaginationParams {
  page: number
  limit: number
}
