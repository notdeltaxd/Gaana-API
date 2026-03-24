/**
 * @fileoverview Formatters service for transforming raw Gaana API responses into standardized formats.
 * Provides consistent data structures across all endpoints by formatting responses
 * from different API endpoints into unified schemas.
 * @module services/formattersService
 */

import { BaseService } from './baseService.js'
import type { ArtistDetail, TrackArtist } from '../types/index.js'

/**
 * Service class for formatting API responses.
 * Transforms raw API data into consistent, standardized formats for client consumption.
 * Extends BaseService to inherit common utility functions.
 *
 * @class FormattersService
 */
export class FormattersService extends BaseService {
  private getArtworkUrl(small?: string, medium?: string, large?: string): string {
    if (large) return large
    if (medium) return medium
    if (small) return small
    return ''
  }

  /**
   * Common metadata for all responses.
   */
  private getCommonMeta() {
    return {
      project: 'Unofficial Gaana API',
      version: '1.0.0',
      author: 'notdeltaxd',
      repository: 'https://github.com/notdeltaxd/Gaana-API',
      license: 'Apache-2.0',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Wrap data in a standardized response format with metadata.
   */
  public wrapResponse(data: any, extraMeta: Record<string, any> = {}): Record<string, any> {
    if (data && data.error) {
      return {
        success: false,
        error: data.error,
        meta: this.getCommonMeta()
      }
    }

    return {
      success: true,
      data,
      meta: {
        ...this.getCommonMeta(),
        ...extraMeta
      }
    }
  }

  /**
   * Public format playlist search API response - wrapped with metadata.
   */
  formatJsonPlaylistSearch(result: unknown, limit: number): Array<Record<string, unknown>> | Record<string, unknown> {
    const data = this._formatJsonPlaylistSearch(result, limit)
    return this.wrapResponse(data)
  }

  /**
   * Internal format the playlist search API response to return playlist summaries.
   */
  public _formatJsonPlaylistSearch(result: unknown, limit: number): Array<Record<string, unknown>> {
    if (!result || typeof result !== 'object') return []
    const gr = (result as { gr?: Array<{ gd?: Array<any> }> }).gr ?? []
    if (!gr.length || !gr[0].gd) return []
    const playlists: Array<Record<string, unknown>> = []
    for (let i = 0; i < Math.min(limit, gr[0].gd.length); i++) {
      const p = gr[0].gd[i]
      if (!p.seo) continue // Skip if no seokey

      const artwork = (p.aw as string) || ''
      let artworkUrl = artwork
      // Convert to large if medium, or keep as is
      if (artwork.includes('size_m.jpg')) {
        artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
      } else if (artwork.includes('size_s.jpg')) {
        artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
      }

      playlists.push({
        playlist_id: p.id,
        seokey: p.seo,
        title: p.ti,
        artists: p.sti || '',
        language: p.language || '',
        artworkUrl: artworkUrl,
        playlist_url: `https://gaana.com/playlist/${p.seo}`
      })
    }
    return playlists
  }

  /**
   * Format album search result (individual album object from search API)
   */
  formatJsonAlbumSearch(album: Record<string, unknown>): Record<string, unknown> {
    const data: Record<string, unknown> = {}

    data.album_id = album.id || album.iid
    data.iid = album.iid
    data.seokey = album.seo
    data.title = album.ti

    // Handle artists - prefer sti, fallback to alist (which might be a JSON string)
    let artists = (album.sti as string) || ''
    if (!artists && album.alist) {
      const alist = album.alist as string
      // If alist is a JSON string like "[Artist1,Artist2]", parse it
      if (alist.startsWith('[') && alist.endsWith(']')) {
        try {
          const parsed = JSON.parse(alist) as string[]
          artists = parsed.join(', ')
        } catch {
          // If parsing fails, use as-is
          artists = alist.replace(/[\[\]]/g, '')
        }
      } else {
        artists = alist
      }
    }
    data.artists = artists

    data.language = album.language || (Array.isArray(album.lang) ? album.lang[0] : album.lang) || ''
    data.type = album.ty
    data.is_explicit = this.functions.isExplicit(album.pw as number)
    data.isPc = album.isPc
    data.score = album.scoreF
    data.boost = album.boostValue
    data.langBoostValue = album.langBoostValue
    data.tags = album.tags || []
    data.album_url = `https://gaana.com/album/${album.seo}`

    // Handle artwork URL - prefer large, fallback to medium, then small
    const artwork = (album.aw as string) || ''
    let artworkUrl = artwork
    if (artwork.includes('size_m.jpg')) {
      artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
    } else if (artwork.includes('size_s.jpg')) {
      artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
    }
    // If already size_l.jpg or no size indicator, use as is

    data.artworkUrl = artworkUrl

    return data
  }

  /**
   * Format a single album item from apiv2 albumList response.
   */
  formatJsonAlbumListItem(album: Record<string, unknown>): Record<string, unknown> {
    const artists = Array.isArray(album.artist)
      ? (album.artist as Array<{ name?: string; seokey?: string; artist_id?: string }>)
          .filter((artist) => Boolean(artist?.name))
          .map((artist) => ({
            name: artist.name || '',
            seokey: artist.seokey || '',
            artist_id: artist.artist_id || ''
          }))
      : []

    const customArtworks = (album.custom_artworks as Record<string, string> | undefined) || {}
    const artworkUrl =
      customArtworks['480x480'] ||
      customArtworks['175x175'] ||
      customArtworks['110x110'] ||
      customArtworks['80x80'] ||
      customArtworks['40x40'] ||
      (album.artwork as string) ||
      ''

    return {
      album_id: String(album.album_id || ''),
      seokey: String(album.seokey || ''),
      title: String(album.title || ''),
      language: String(album.language || ''),
      release_date: String(album.release_date || ''),
      year: String(album.year || ''),
      track_count: Number(album.trackcount || 0),
      duration: Number(album.duration || 0),
      artists_string: artists.map((artist) => artist.name).join(', '),
      artworkUrl,
      album_url: `https://gaana.com/album/${String(album.seokey || '')}`,
      artists
    }
  }

  /**
   * Format album list API response.
   */
  /**
   * Public format album list API response - wrapped with metadata.
   */
  formatJsonAlbumList(albums: unknown[], count: number, language: string, page: number): Record<string, unknown> {
    const data = this._formatJsonAlbumList(albums, count, language, page)
    return this.wrapResponse(data, { count, language, page })
  }

  /**
   * Internal format album list API response.
   */
  _formatJsonAlbumList(albums: unknown[], count: number, language: string, page: number): unknown[] {
    return albums
      .filter((album): album is Record<string, unknown> => Boolean(album) && typeof album === 'object')
      .map((album) => this.formatJsonAlbumListItem(album))
  }

  /**
   * Format album detail API response - simplified with only essential fields
   * Includes: basic info, artist info, duration, artwork
   * Used for search results
   */
  /**
   * Public format album details API response - wrapped with metadata.
   */
  async formatJsonAlbumDetails(results: unknown): Promise<Record<string, unknown>> {
    const data = await this._formatJsonAlbumDetails(results)
    return this.wrapResponse(data)
  }

  /**
   * Internal format album detail API response - simplified with only essential fields
   */
  public async _formatJsonAlbumDetails(results: unknown): Promise<Record<string, unknown>> {
    if (!results || typeof results !== 'object') return {}
    const r = results as {
      album: {
        seokey: string
        album_id: string
        title: string
        artist: unknown
        parental_warning: number
        language: string
        duration: number
        artwork: string
      }
      tracks: Array<{ artist: unknown; artist_detail?: ArtistDetail[] }>
    }
    const data: Record<string, unknown> = {}

    try {
      data.seokey = r.album.seokey
      if (!data.seokey) {
        return { error: this.errors.noResults() }
      }
    } catch {
      return { error: this.errors.noResults() }
    }

    // Basic album info
    data.album_id = r.album.album_id
    data.title = r.album.title
    data.duration = r.album.duration || 0

    // Artist information
    try {
      const track = r.tracks[0] as {
        artist: unknown
        artist_detail?: ArtistDetail[]
      }
      const albumArtists = r.album.artist as Array<{ name: string }>
      const hasAlbumArtists = Array.isArray(albumArtists) && albumArtists.length > 0

      data.artists = hasAlbumArtists
        ? this.functions.findArtistNames(albumArtists)
        : track.artist_detail
            ?.filter((a) => a.role.includes('Singer'))
            ?.map((a) => a.name)
            ?.join(', ') || ''

      const trackArtists: TrackArtist[] =
        Array.isArray(track.artist) && track.artist.length > 0
          ? (track.artist as TrackArtist[])
          : (track.artist_detail?.map((a: ArtistDetail) => ({
              name: a.name,
              seokey: a.seokey ?? '',
              artist_id: a.artist_id ?? '',
              id: a.artist_id ?? ''
            })) ?? [])

      data.artist_seokeys = this.functions.findArtistSeoKeys(trackArtists.map((a) => ({ seokey: a.seokey ?? '' })))
      data.artist_ids = this.functions.findArtistIds(
        trackArtists.map((a) => ({ artist_id: a.artist_id ?? a.id ?? '' }))
      )
    } catch {
      data.artists = ''
      data.artist_seokeys = ''
      data.artist_ids = ''
    }

    // Language
    data.language = r.album.language || ''

    // URLs
    data.album_url = `https://gaana.com/album/${r.album.seokey}`

    // Get best artwork URL - prefer large, fallback to medium, then small
    const artwork = r.album.artwork || ''
    let artworkUrl = artwork
    if (artwork.includes('size_s.jpg')) {
      artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
    } else if (artwork.includes('size_m.jpg')) {
      artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
    }
    data.artworkUrl = artworkUrl

    return data
  }

  /**
   * Format album API response - full details
   */
  async formatJsonAlbums(results: unknown, info: boolean): Promise<Record<string, unknown>> {
    const data = await this._formatJsonAlbums(results, info)
    return this.wrapResponse(data)
  }

  /**
   * Internal format album API response - full details
   */
  public async _formatJsonAlbums(results: unknown, info: boolean): Promise<Record<string, unknown>> {
    if (!results || typeof results !== 'object') return {}
    const r = results as {
      album: {
        seokey: string
        album_id: string
        title: string
        artist: unknown
        parental_warning: number
        language: string
        recordlevel: string
        trackcount: number
        duration: number
        release_date?: string
        al_play_ct: number
        favorite_count: number
        artwork: string
      }
      tracks: Array<{ artist: unknown }>
    }
    const data: Record<string, unknown> = {}
    try {
      data.seokey = r.album.seokey
    } catch {
      return { error: this.errors.noResults() }
    }
    data.album_id = r.album.album_id
    data.title = r.album.title
    try {
      const track = r.tracks[0] as {
        artist: unknown
        artist_detail?: ArtistDetail[]
      }
      const albumArtists = r.album.artist as Array<{ name: string }>
      const hasAlbumArtists = Array.isArray(albumArtists) && albumArtists.length > 0

      data.artists = hasAlbumArtists
        ? this.functions.findArtistNames(albumArtists)
        : track.artist_detail
            ?.filter((a) => a.role.includes('Singer'))
            ?.map((a) => a.name)
            ?.join(', ') || ''
      const trackArtists: TrackArtist[] =
        Array.isArray(track.artist) && track.artist.length > 0
          ? (track.artist as TrackArtist[])
          : (track.artist_detail?.map((a: ArtistDetail) => ({
              name: a.name,
              seokey: a.seokey ?? '',
              artist_id: a.artist_id ?? '',
              id: a.artist_id ?? ''
            })) ?? [])
      data.artist_seokeys = this.functions.findArtistSeoKeys(trackArtists.map((a) => ({ seokey: a.seokey ?? '' })))
      data.artist_ids = this.functions.findArtistIds(
        trackArtists.map((a) => ({ artist_id: a.artist_id ?? a.id ?? '' }))
      )
    } catch {
      data.artists = ''
      data.artist_seokeys = ''
      data.artist_ids = ''
    }
    data.duration = r.album.duration
    data.is_explicit = this.functions.isExplicit(r.album.parental_warning)
    data.language = r.album.language
    data.label = r.album.recordlevel
    data.track_count = r.album.trackcount
    data.release_date = r.album.release_date ?? ''
    data.play_count = r.album.al_play_ct
    data.favorite_count = r.album.favorite_count
    data.album_url = `https://gaana.com/album/${r.album.seokey}`
    // Get best artwork URL - prefer large
    const artwork = r.album.artwork || ''
    let artworkUrl = artwork
    if (artwork.includes('size_s.jpg')) {
      artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
    } else if (artwork.includes('size_m.jpg')) {
      artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
    }
    data.artworkUrl = artworkUrl
    if (info) {
      data.tracks = [] // Will be populated by detailsService
    }
    return data
  }

  /**
   * Format song/track API response from search
   */
  async formatJsonSongs(results: Record<string, unknown>): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {}

    // Handle search API field names (seo, ti, sti) vs detail API
    data.seokey = results.seo || results.seokey
    data.track_id = results.id || results.track_id
    data.title = results.ti || results.track_title
    data.isrc = results.isrc
    data.album = results.albumname
    data.album_seokey = results.album_seokey
    data.duration = results.duration
    data.language = results.language || (results.lang as string[])?.[0]
    data.is_explicit = this.functions.isExplicit(results.pw as number)

    // Parse artists from search API
    const artistString = (results.sti as string) || ''
    data.artists = artistString
      .split(',')
      .map((a) => a.trim())
      .join(', ')

    // Build URLs
    data.song_url = `https://gaana.com/song/${data.seokey}`
    // Only include album_url if album_seokey is available
    if (data.album_seokey) {
      data.album_url = `https://gaana.com/album/${data.album_seokey}`
    } else {
      data.album_url = ''
    }

    // Get best artwork URL - prefer large
    const artwork = (results.aw as string) || ''
    let artworkUrl = artwork
    if (artwork.includes('size_m.jpg')) {
      artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
    } else if (artwork.includes('size_s.jpg')) {
      artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
    }
    data.artworkUrl = artworkUrl

    return data
  }

  async formatJsonSongFullDetails(results: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Return exactly the same format as song details, wrapped with meta
    return await this.formatJsonSongDetails(results)
  }

  /**
   * Public format song detail API response - wrapped with metadata.
   */
  async formatJsonSongDetails(results: Record<string, unknown>): Promise<Record<string, unknown>> {
    const data = await this._formatJsonSongDetails(results)
    return this.wrapResponse(data)
  }

  /**
   * Internal format song detail API response - simplified with only essential fields
   */
  public async _formatJsonSongDetails(results: Record<string, unknown>): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {}

    try {
      data.seokey = results.seokey
      if (!data.seokey) {
        return { error: this.errors.invalidSeokey() }
      }
    } catch {
      return { error: this.errors.invalidSeokey() }
    }

    // Basic song info
    data.track_id = results.track_id
    data.title = results.track_title
    data.isrc = results.isrc
    data.duration = results.duration || 0

    // Album information
    data.album_seokey = results.albumseokey || ''
    data.album = results.album_title || ''
    data.album_id = results.album_id || ''

    // Artist information
    type ArtistArray = Array<{ name: string; seokey?: string; id?: string }>
    const artistDetails = results.artist_detail as
      | Array<{ name: string; role: string; seokey?: string; artist_id?: string }>
      | undefined
    const hasMainArtists = Array.isArray(results.artist) && (results.artist as ArtistArray).length > 0

    if (hasMainArtists) {
      data.artists = this.functions.findArtistNames(results.artist as ArtistArray)
    } else if (artistDetails) {
      const singers = artistDetails?.filter((a) => a.role.includes('Singer')).map((a) => a.name) || []
      data.artists = singers.join(', ')
    } else {
      data.artists = ''
    }

    // Artist IDs and seokeys
    interface TrackArtist {
      name: string
      seokey?: string
      artist_id?: string
      id?: string
    }

    const artists: TrackArtist[] =
      Array.isArray(results.artist) && results.artist.length > 0
        ? (results.artist as TrackArtist[])
        : ((artistDetails as ArtistDetail[] | undefined)?.map((a) => ({
            name: a.name,
            seokey: a.seokey ?? '',
            artist_id: a.artist_id ?? '',
            id: a.artist_id ?? ''
          })) ?? [])

    data.artist_seokeys = this.functions.findArtistSeoKeys(artists.map((a) => ({ seokey: a.seokey ?? '' })))

    data.artist_ids = this.functions.findArtistIds(artists.map((a) => ({ artist_id: a.artist_id ?? a.id ?? '' })))

    // URLs
    data.song_url = `https://gaana.com/song/${data.seokey}`
    if (data.album_seokey) {
      data.album_url = `https://gaana.com/album/${data.album_seokey}`
    } else {
      data.album_url = ''
    }

    // Get best artwork URL - prefer large, fallback to medium, then small
    const artworkLarge = results.artwork_large as string
    const artworkWeb = results.artwork_web as string
    const artwork = results.artwork as string

    let artworkUrl = ''
    if (artworkLarge) {
      artworkUrl = artworkLarge
    } else if (artworkWeb) {
      artworkUrl = artworkWeb
    } else if (artwork) {
      // Convert to large if possible
      if (artwork.includes('size_s.jpg')) {
        artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
      } else if (artwork.includes('size_m.jpg')) {
        artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
      } else {
        artworkUrl = artwork
      }
    }

    data.artworkUrl = artworkUrl

    return data
  }

  /**
   * Format chart API response
   */
  /**
   * Public format chart API response - wrapped with metadata.
   */
  async formatJsonCharts(results: unknown): Promise<Record<string, unknown>> {
    const data = await this._formatJsonCharts(results)
    return this.wrapResponse(data)
  }

  /**
   * Internal format chart API response
   */
  async _formatJsonCharts(results: unknown): Promise<Record<string, unknown>> {
    if (!results || typeof results !== 'object') return {}
    const r = results as {
      seokey: string
      entity_id: string
      name: string
      language: string
      favorite_count: number
      entity_info: Array<{ value: number }>
      atw: string
    }
    const data: Record<string, unknown> = {}
    data.seokey = r.seokey
    data.playlist_id = r.entity_id
    data.title = r.name
    data.language = r.language
    data.favorite_count = r.favorite_count
    data.is_explicit = this.functions.isExplicit(r.entity_info[6].value)
    data.play_count = r.entity_info[r.entity_info.length - 1].value
    data.playlist_url = `https://gaana.com/playlist/${r.seokey}`
    // Get best artwork URL - prefer large
    const artwork = r.atw || ''
    let artworkUrl = artwork
    if (artwork.includes('size_m.jpg')) {
      artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
    } else if (artwork.includes('size_s.jpg')) {
      artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
    }
    data.artworkUrl = artworkUrl
    return data
  }

  /**
   * Format playlist API response
   * Tracks are already included in the response, so format them directly
   */
  /**
   * Public format playlist API response - wrapped with metadata.
   */
  async formatJsonPlaylists(results: unknown): Promise<Record<string, unknown>> {
    const data = await this._formatJsonPlaylists(results)
    return this.wrapResponse(data)
  }

  /**
   * Internal format playlist API response
   * Tracks are already included in the response, so format them directly
   */
  public async _formatJsonPlaylists(results: unknown): Promise<Record<string, unknown>> {
    if (!results || typeof results !== 'object') return {}
    const r = results as {
      playlist: {
        title: string
        playlist_id: string
        seokey: string
        artwork: string
        artwork_web: string
        artwork_large: string
        detailed_description: string
        createdby: string
        trackcount: number
        favorite_count: string
        language: string
        created_on: string
        modified_on: string
      }
      tracks: Array<Record<string, unknown>>
      count: number
    }

    if (!r.playlist) {
      return { error: 'Invalid playlist data' }
    }

    // Get best artwork URL - prefer large, fallback to medium, then small
    const artworkUrl = this.getArtworkUrl(r.playlist.artwork, r.playlist.artwork_web, r.playlist.artwork_large)

    const playlistInfo = {
      title: r.playlist.title,
      playlist_id: r.playlist.playlist_id,
      seokey: r.playlist.seokey,
      artworkUrl: artworkUrl,
      description: r.playlist.detailed_description,
      author: r.playlist.createdby,
      trackcount: r.playlist.trackcount,
      favorite_count: r.playlist.favorite_count,
      language: r.playlist.language,
      created_on: r.playlist.created_on,
      modified_on: r.playlist.modified_on,
      playlist_url: `https://gaana.com/playlist/${r.playlist.seokey}`
    }

    // Format tracks directly from the response (they already contain full track data)
    const trackCount = Number(r.count)
    const formattedTracks: Array<Record<string, unknown>> = []

    for (let i = 0; i < trackCount && i < r.tracks.length; i++) {
      try {
        const track = r.tracks[i]
        // Format each track using the same formatter as song details (internal/unwrapped)
        const formattedTrack = await this._formatJsonSongDetails(track)
        if (formattedTrack && !formattedTrack.error) {
          formattedTracks.push(formattedTrack)
        }
      } catch {
        // skip invalid tracks
      }
    }

    // Include tracks inside the playlist object
    return this.wrapResponse({
      playlist: {
        ...playlistInfo,
        tracks: formattedTracks
      }
    })
  }

  /**
   * Helper to extract value from entity_info array by key.
   */
  private getEntityInfoValue(entityInfo: Array<{ key: string; value?: unknown }>, key: string): unknown {
    return entityInfo?.find((info) => info.key === key)?.value
  }

  /**
   * Formats a single entity (AL or TR) from miscNewRelease response.
   */
  async formatJsonNewReleaseEntity(entity: Record<string, unknown>): Promise<Record<string, unknown>> {
    const type = String(entity.entity_type || '')
    const entityInfo = (entity.entity_info as Array<{ key: string; value?: unknown }>) || []

    const data: Record<string, unknown> = {
      type: type === 'AL' ? 'album' : 'track',
      entity_id: String(entity.entity_id || ''),
      seokey: String(entity.seokey || ''),
      title: String(entity.name || ''),
      language: String(entity.language || ''),
      artworkUrl: String(entity.artwork_medium || entity.artwork || '')
    }

    if (type === 'AL') {
      // Album specific fields
      const artists = (this.getEntityInfoValue(entityInfo, 'primaryartist') as Array<{ name: string }>) || []
      data.artists = artists.map((a) => a.name).join(', ')
      data.album_url = `https://gaana.com/album/${data.seokey}`
    } else if (type === 'TR') {
      // Track specific fields
      const artists = (this.getEntityInfoValue(entityInfo, 'artist') as Array<{ name: string }>) || []
      data.artists = artists.map((a) => a.name).join(', ')

      const albumInfo = (this.getEntityInfoValue(entityInfo, 'album') as Array<{
        name: string
        album_seokey: string
        album_id: string
      }>)?.[0]

      data.album = albumInfo?.name || ''
      data.album_seokey = albumInfo?.album_seokey || ''
      data.album_id = albumInfo?.album_id || ''
      data.duration = Number(this.getEntityInfoValue(entityInfo, 'duration') || 0)
      data.is_explicit = this.functions.isExplicit(Number(this.getEntityInfoValue(entityInfo, 'parental_warning') || 0))

      data.song_url = `https://gaana.com/song/${data.seokey}`
      if (data.album_seokey) {
        data.album_url = `https://gaana.com/album/${data.album_seokey}`
      }
    }

    return data
  }

  /**
   * Format new releases API response - optimized for paginated results.
   */
  /**
   * Public format new releases API response - optimized for paginated results.
   */
  async formatJsonNewReleases(results: unknown, page?: number, limit?: number): Promise<Record<string, unknown>> {
    const data = await this._formatJsonNewReleases(results)
    return this.wrapResponse(data, {
      count: (results as any)?.count || data.length,
      page,
      limit
    })
  }

  /**
   * Internal format new releases API response.
   */
  async _formatJsonNewReleases(results: unknown): Promise<unknown[]> {
    if (!results || typeof results !== 'object') return []
    const r = results as { entities: Array<Record<string, unknown>> }
    if (!r.entities || !Array.isArray(r.entities)) return []
    return await Promise.all(r.entities.map((entity) => this.formatJsonNewReleaseEntity(entity)))
  }

  /**
   * Format trending API response
   */
  /**
   * Public format trending API response - wrapped with metadata.
   */
  async formatJsonTrending(results: unknown): Promise<Record<string, unknown>> {
    const data = await this._formatJsonTrending(results)
    return this.wrapResponse(data)
  }

  /**
   * Internal format trending API response
   */
  async _formatJsonTrending(results: unknown): Promise<Record<string, unknown>> {
    if (!results || typeof results !== 'object') return {}
    const r = results as { entities: Array<{ seokey: string }> }
    const trackSeokeys: string[] = []
    const limit = r.entities.length
    for (let i = 0; i < limit; i++) {
      try {
        trackSeokeys.push(r.entities[i].seokey)
      } catch {
        // skip
      }
    }
    if (trackSeokeys.length === 0) {
      return { error: this.errors.noResults() }
    }
    return { trackSeokeys } // detailsService will fetch track data
  }

  /**
   * Format artist details API response
   */
  /**
   * Public format artist details API response - wrapped with metadata.
   */
  async formatJsonArtistInfo(results: unknown): Promise<Record<string, unknown>> {
    const data = await this._formatJsonArtistInfo(results)
    return this.wrapResponse(data)
  }

  /**
   * Internal format artist details API response
   */
  public async _formatJsonArtistInfo(results: unknown): Promise<Record<string, unknown>> {
    if (!results || typeof results !== 'object') return this.wrapResponse({ error: this.errors.noResults() })
    const r = results as {
      artist?: Array<{
        artist_id?: string
        seokey?: string
        name?: string
        artwork?: string
        artwork_175x175?: string
        atw?: string
        artwork_bio?: string
      }>
    }

    if (!r.artist?.[0]) {
      return this.wrapResponse({ error: this.errors.noResults() })
    }

    const artist = r.artist[0]
    const data: Record<string, unknown> = {
      artist_id: artist.artist_id || '',
      seokey: artist.seokey || '',
      name: artist.name || '',
      artwork: artist.artwork_175x175 || artist.artwork || '',
      artist_url: `https://gaana.com/artist/${artist.seokey || ''}`
    }

    return this.wrapResponse(data)
  }

  /**
   * Format artist top tracks API response - same format as song details
   */
  /**
   * Public format artist top tracks API response - wrapped with metadata.
   */
  async formatJsonArtistTopTracks(results: unknown): Promise<Array<Record<string, unknown>> | Record<string, unknown>> {
    const data = await this._formatJsonArtistTopTracks(results)
    return this.wrapResponse(data)
  }

  /**
   * Internal format artist top tracks API response - same format as song details
   */
  public async _formatJsonArtistTopTracks(results: unknown): Promise<Array<Record<string, unknown>>> {
    if (!results || typeof results !== 'object') return []
    const r = results as {
      entities?: Array<{
        seokey?: string
        name?: string
        language?: string
        entity_id?: string
        artwork?: string
        artwork_medium?: string
        artwork_large?: string
        artwork_web?: string
        entity_info?: Array<{
          key: string
          value: unknown
        }>
      }>
    }

    const tracks: Array<Record<string, unknown>> = []
    const entities = r.entities || []

    for (const track of entities) {
      if (!track.seokey) continue

      const data: Record<string, unknown> = {}

      // Basic song info - same as formatJsonSongDetails
      data.seokey = track.seokey
      data.track_id = track.entity_id || ''
      data.title = track.name || ''

      // Extract duration from entity_info
      const durationInfo = track.entity_info?.find((info) => info.key === 'duration')
      data.duration = durationInfo?.value ? Number(durationInfo.value) : 0

      // Extract ISRC from entity_info
      const isrcInfo = track.entity_info?.find((info) => info.key === 'isrc')
      data.isrc = isrcInfo?.value ? String(isrcInfo.value) : ''

      // Extract album info from entity_info
      const albumInfo = track.entity_info?.find((info) => info.key === 'album')
      const album =
        Array.isArray(albumInfo?.value) && albumInfo.value.length > 0
          ? (albumInfo.value[0] as {
              album_id?: string
              name?: string
              album_seokey?: string
            })
          : null

      data.album_seokey = album?.album_seokey || ''
      data.album = album?.name || ''
      data.album_id = album?.album_id || ''

      // Extract artist info from entity_info
      const artistInfo = track.entity_info?.find((info) => info.key === 'artist')
      const artists = (Array.isArray(artistInfo?.value) ? artistInfo.value : []) as Array<{
        artist_id?: string
        name?: string
        seokey?: string
      }>

      // Format artists string - same as formatJsonSongDetails
      data.artists = artists
        .map((artist) => artist.name || '')
        .filter(Boolean)
        .join(', ')

      // Artist IDs and seokeys - same as formatJsonSongDetails
      data.artist_seokeys = this.functions.findArtistSeoKeys(artists.map((a) => ({ seokey: a.seokey || '' })))
      data.artist_ids = this.functions.findArtistIds(artists.map((a) => ({ artist_id: a.artist_id || '' })))

      // URLs - same as formatJsonSongDetails
      data.song_url = `https://gaana.com/song/${track.seokey}`
      if (data.album_seokey) {
        data.album_url = `https://gaana.com/album/${data.album_seokey}`
      } else {
        data.album_url = ''
      }

      // Get best artwork URL - same logic as formatJsonSongDetails
      const artworkLarge = track.artwork_large as string
      const artworkWeb = track.artwork_web as string
      const artwork = track.artwork_medium || track.artwork || ''

      let artworkUrl = ''
      if (artworkLarge) {
        artworkUrl = artworkLarge
      } else if (artworkWeb) {
        artworkUrl = artworkWeb
      } else if (artwork) {
        // Convert to large if possible
        if (artwork.includes('size_s.jpg')) {
          artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
        } else if (artwork.includes('size_m.jpg')) {
          artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
        } else {
          artworkUrl = artwork
        }
      }

      data.artworkUrl = artworkUrl

      tracks.push(data)
    }

    return tracks
  }

  /**
   * Format lyrics list API response.
   */
  /**
   * Public format lyrics list API response - wrapped with metadata.
   */
  async formatJsonLyricsList(results: unknown, page: number): Promise<Record<string, unknown>> {
    const data = await this._formatJsonLyricsList(results, page)
    return this.wrapResponse(data, {
      count: (results as any)?.count || data.length,
      page
    })
  }

  /**
   * Internal format lyrics list API response.
   */
  async _formatJsonLyricsList(results: unknown, page: number): Promise<unknown[]> {
    if (!results || typeof results !== 'object') return []
    const r = results as { tracks?: Array<Record<string, unknown>> }
    const tracks = Array.isArray(r.tracks) ? r.tracks : []
    return await Promise.all(
      tracks.map(async (track) => {
        const artwork = (track.atw as string) || ''
        let artworkUrl = artwork
        if (artwork.includes('size_m.jpg')) {
          artworkUrl = artwork.replace('size_m.jpg', 'size_l.jpg')
        } else if (artwork.includes('size_s.jpg')) {
          artworkUrl = artwork.replace('size_s.jpg', 'size_l.jpg')
        }

        return {
          track_id: String(track.track_id || ''),
          seokey: String(track.seokey || ''),
          title: String(track.track_title || ''),
          artworkUrl: artworkUrl,
          song_url: `https://gaana.com/song/${track.seokey}`,
          lyrics_url: `https://gaana.com/lyrics/${track.seokey}`
        }
      })
    )
  }

  /**
   * Format song lyrics API response.
   */
  /**
   * Public format song lyrics API response - wrapped with metadata.
   */
  async formatJsonSongLyrics(results: unknown): Promise<Record<string, unknown>> {
    const data = await this._formatJsonSongLyrics(results)
    return this.wrapResponse(data)
  }

  /**
   * Internal format song lyrics API response.
   */
  async _formatJsonSongLyrics(results: unknown): Promise<Record<string, unknown>> {
    if (!results || typeof results !== 'object') return { error: this.errors.noResults() }
    const r = results as {
      flag?: boolean
      status?: number
      album_title?: string
      track_title?: string
      lyrics_html?: string
      language?: string
    }

    // Gaana returns flag: true or status: 1 for success
    if (r.flag === false || r.status === 0) {
      return { error: 'Lyrics not found for this song' }
    }

    // Clean up lyrics HTML - convert to plain text with newlines
    let lyrics = r.lyrics_html || ''
    lyrics = lyrics
      .replace(/<p>/g, '') // Remove opening <p>
      .replace(/<\/p>/g, '\n\n') // Replace closing </p> with double newline
      .replace(/<br\s*\/?>/g, '\n') // Replace <br> with single newline
      .replace(/&nbsp;/g, ' ') // Decode common entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>?/gm, '') // Strip any remaining HTML tags
      .trim()

    return {
      album: r.album_title || '',
      title: r.track_title || '',
      lyrics: lyrics,
      language: r.language || ''
    }
  }
}
