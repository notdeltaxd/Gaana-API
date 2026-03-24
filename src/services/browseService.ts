/**
 * @fileoverview Browse service for fetching curated content lists.
 * Handles trending tracks, charts, and new releases from Gaana.
 * @module services/browseService
 */

import { apiEndpoints } from '../constants/endpoints.js'
import { BaseService } from './baseService.js'
import { DetailsService } from './detailsService.js'
import { FormattersService } from './formattersService.js'

/**
 * Service class for browsing curated Gaana content.
 * Extends BaseService to inherit common HTTP request functionality.
 *
 * @class BrowseService
 */
export class BrowseService extends BaseService {
  private details: DetailsService
  private formatters: FormattersService

  constructor() {
    super()
    this.details = new DetailsService()
    this.formatters = new FormattersService()
  }

  /**
   * Get trending tracks
   */
  async getTrendingTracks(language?: string, limit?: number): Promise<Record<string, unknown>> {
    const lang = language || 'en'
    const n = limit || 10
    const url = `${apiEndpoints.trendingUrl}&language=${lang}&n=${n}`
    const result = await this.fetchJson(url)
    const formattedResult = await (this.formatters as any)._formatJsonTrending(result)
    
    // If we have track seokeys, fetch the actual track data
    if (formattedResult.trackSeokeys && Array.isArray(formattedResult.trackSeokeys)) {
      const trackData = await this.details.getTrackInfo(formattedResult.trackSeokeys as string[])
      return { tracks: trackData }
    }
    
    return formattedResult
  }

  /**
   * Get album list by language.
   * Returns normalized album list by language.
   */
  async getAlbumList(language?: string, page?: number): Promise<Record<string, unknown>> {
    const lang = (language || 'hindi').trim().toLowerCase()
    const pageNumber = page ?? 0
    const isAllLanguage = lang === 'all'
    const url = isAllLanguage
      ? `${apiEndpoints.albumListUrl}&page=${pageNumber}`
      : `${apiEndpoints.albumListUrl}&language=${encodeURIComponent(lang)}&page=${pageNumber}`

    const result = await this.fetchJson(
      url,
      'POST',
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: isAllLanguage ? 'https://gaana.com/album' : `https://gaana.com/album/${lang}`
      },
      20000
    )

    if (!result || typeof result !== 'object') {
      return (this.formatters as any)._formatJsonAlbumList([], 0, lang, pageNumber)
    }

    const response = result as {
      album?: unknown[]
      count?: number
    }

    const albums = Array.isArray(response.album) ? response.album : []
    const totalCount = typeof response.count === 'number' ? response.count : 0

    return (this.formatters as any)._formatJsonAlbumList(albums, totalCount, lang, pageNumber)
  }

  /**
   * Get charts
   */
  async getCharts(limit?: number): Promise<unknown[]> {
    const n = limit || 10
    const url = `${apiEndpoints.chartsUrl}${n}`
    const result = await this.fetchJson(url)
    if (!result || typeof result !== 'object') return []
    const r = result as { entities?: Array<Record<string, unknown>> }
    const entities = r.entities ?? []
    const charts: unknown[] = []
    for (let i = 0; i < Math.min(n, entities.length); i++) {
      charts.push(await (this.formatters as any)._formatJsonCharts(entities[i]))
    }
    return charts
  }

  /**
   * Get new releases with pagination and language filtering.
   * Returns a mixed list of newly released albums and tracks.
   */
  async getNewReleases(language?: string, page?: number, limit?: number): Promise<Record<string, unknown>> {
    const lang = (language || 'english').trim().toLowerCase()
    const pageNumber = page ?? 0
    const url = `${apiEndpoints.newReleasesUrl}${encodeURIComponent(lang)}&page=${pageNumber}`

    const result = await this.fetchJson(
      url,
      'POST',
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: `https://gaana.com/newrelease/${lang}`
      },
      20000
    )

    return await (this.formatters as any)._formatJsonNewReleases(result)
  }

  /**
   * Get list of tracks with lyrics.
   */
  async getLyricsList(page?: number): Promise<Record<string, unknown>> {
    const pageNumber = page ?? 0
    const url = `${apiEndpoints.lyricsListUrl}${pageNumber}`

    const result = await this.fetchJson(
      url,
      'POST',
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: 'https://gaana.com/lyrics'
      },
      20000
    )

    return (this.formatters as any)._formatJsonLyricsList(result, pageNumber)
  }
}
