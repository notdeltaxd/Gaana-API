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
    const formattedResult = await this.formatters.formatJsonTrending(result)

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
      return this.formatters.formatJsonAlbumList([], 0, lang, pageNumber)
    }

    const response = result as {
      album?: unknown[]
      count?: number
    }

    const albums = Array.isArray(response.album) ? response.album : []
    const totalCount = typeof response.count === 'number' ? response.count : 0

    return this.formatters.formatJsonAlbumList(albums, totalCount, lang, pageNumber)
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
      charts.push(await this.formatters.formatJsonCharts(entities[i]))
    }
    return charts
  }

  /**
   * Get new releases
   */
  async getNewReleases(language?: string): Promise<Record<string, unknown>> {
    const lang = language || 'en'
    const url = `${apiEndpoints.newReleasesUrl}${lang}`
    const result = await this.fetchJson(url)
    const formattedResult = await this.formatters.formatJsonNewReleases(result)

    // Fetch actual track and album data
    if (formattedResult.error) {
      return formattedResult
    }

    const trackSeokeys = formattedResult.trackSeokeys as string[] | undefined
    const albumSeokeys = formattedResult.albumSeokeys as string[] | undefined

    const data: Record<string, unknown> = {}

    if (trackSeokeys && trackSeokeys.length > 0) {
      data.tracks = await this.details.getTrackInfo(trackSeokeys)
    } else {
      data.tracks = []
    }

    if (albumSeokeys && albumSeokeys.length > 0) {
      const albumData: unknown[] = []
      for (const albumSeokey of albumSeokeys) {
        albumData.push(await this.details.getAlbumInfo(albumSeokey, false))
      }
      data.albums = albumData
    } else {
      data.albums = []
    }

    return data
  }
}
