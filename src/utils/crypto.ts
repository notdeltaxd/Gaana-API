/**
 * @fileoverview Crypto utilities for decrypting Gaana media URLs.
 * Uses AES-CBC decryption to extract HLS stream paths and parse them to direct URLs.
 * @module utils/crypto
 */

import { createDecipheriv } from 'crypto'

/**
 * AES decryption key and IV for Gaana stream URLs
 */
const KEY = Buffer.from('gy1t#b@jl(b$wtme', 'utf8')
const IV = Buffer.from('xC4dmVJAq14BfntX', 'utf8')

/**
 * Base URL for Gaana HLS streams
 */
const HLS_BASE_URL = 'https://vodhlsgaana-ebw.akamaized.net/'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

/**
 * Segment info from HLS manifest
 */
interface SegmentInfo {
  url: string
  durationMs: number
}

/**
 * Parsed HLS manifest result
 */
interface HlsManifest {
  initSegmentUrl?: string
  segments: SegmentInfo[]
  totalDurationMs: number
}

/**
 * Get base URL from a full URL (removes query string and filename)
 */
function getBaseUrl(url: string): string {
  const urlWithoutQuery = url.split('?')[0]
  const lastSlash = urlWithoutQuery.lastIndexOf('/')
  return lastSlash !== -1 ? urlWithoutQuery.substring(0, lastSlash + 1) : urlWithoutQuery
}

/**
 * Resolve a relative URL against a base URL
 */
function resolveUrl(baseUrl: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) {
    const schemeEnd = baseUrl.indexOf('://')
    if (schemeEnd !== -1) {
      const pathStart = baseUrl.indexOf('/', schemeEnd + 3)
      if (pathStart !== -1) return baseUrl.substring(0, pathStart) + path
    }
  }
  return baseUrl + path
}

/**
 * Fetch playlist content as lines
 */
async function fetchPlaylist(url: string): Promise<string[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  })
  if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`)
  const text = await res.text()
  return text.split('\n').map(line => line.trim())
}

/**
 * Parse a stream playlist to extract segments
 */
function parseStreamPlaylist(playlistUrl: string, lines: string[]): HlsManifest {
  const baseUrl = getBaseUrl(playlistUrl)
  let initSegmentUrl: string | undefined
  const segments: SegmentInfo[] = []
  let currentDurationMs = 6000

  for (const line of lines) {
    if (!line) continue

    // Parse init segment (fMP4)
    if (line.startsWith('#EXT-X-MAP:')) {
      const match = line.match(/URI="([^"]+)"/)
      if (match) {
        initSegmentUrl = resolveUrl(baseUrl, match[1])
      }
    }

    // Parse segment duration
    if (line.startsWith('#EXTINF:')) {
      const durationStr = line.substring(8).split(',')[0]
      currentDurationMs = Math.round(parseFloat(durationStr) * 1000) || 6000
    }

    // Parse segment URL
    if (!line.startsWith('#')) {
      const isSegment = /\.(ts|m4s|mp4|m4a|aac)(\?|$)/i.test(line)
      if (isSegment) {
        segments.push({
          url: resolveUrl(baseUrl, line),
          durationMs: currentDurationMs
        })
        currentDurationMs = 6000
      }
    }
  }

  const totalDurationMs = segments.reduce((sum, s) => sum + s.durationMs, 0)
  return { initSegmentUrl, segments, totalDurationMs }
}

/**
 * Parse HLS manifest and extract direct segment URLs
 */
async function parseHlsManifest(masterUrl: string): Promise<HlsManifest> {
  const masterLines = await fetchPlaylist(masterUrl)
  if (masterLines.length === 0) throw new Error('Empty HLS playlist')

  const baseUrl = getBaseUrl(masterUrl)

  // Find stream playlist URL (nested .m3u8)
  let streamPlaylistUrl: string | undefined
  for (const line of masterLines) {
    if (line && !line.startsWith('#') && /\.m3u8(\?|$)/.test(line)) {
      streamPlaylistUrl = resolveUrl(baseUrl, line)
      break
    }
  }

  // If no nested playlist, treat master as stream playlist
  if (!streamPlaylistUrl) {
    return parseStreamPlaylist(masterUrl, masterLines)
  }

  // Parse the stream playlist
  const streamLines = await fetchPlaylist(streamPlaylistUrl)
  return parseStreamPlaylist(streamPlaylistUrl, streamLines)
}

/**
 * Decrypt an encrypted Gaana stream path
 * @param encryptedData - Encrypted stream path from the API
 * @returns Decrypted full stream URL or empty string on failure
 */
export function decryptStreamPath(encryptedData: string): string {
  try {
    // Extract offset from first character
    const offset = parseInt(encryptedData[0], 10)
    if (isNaN(offset)) {
      console.warn('Invalid offset in encrypted data')
      return ''
    }

    // Extract ciphertext (skip offset + 16 characters)
    const ciphertextB64 = encryptedData.substring(offset + 16)

    // Add padding and decode base64
    const ciphertext = Buffer.from(ciphertextB64 + '==', 'base64')

    // AES-128-CBC decryption
    const decipher = createDecipheriv('aes-128-cbc', KEY, IV)
    decipher.setAutoPadding(false)

    let decrypted = decipher.update(ciphertext)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    // Clean up the decrypted text - remove null bytes and non-printable characters
    let rawText = decrypted.toString('utf8').replace(/\0/g, '').trim()
    rawText = rawText
      .split('')
      .filter((c) => {
        const code = c.charCodeAt(0)
        return code >= 32 && code <= 126
      })
      .join('')

    // Extract HLS path
    if (rawText.includes('/hls/')) {
      const pathStart = rawText.indexOf('hls/')
      const cleanPath = rawText.substring(pathStart)
      return HLS_BASE_URL + cleanPath
    }

    console.warn('No /hls/ path found in decrypted text')
    return ''
  } catch (error) {
    console.warn('Failed to decrypt stream path:', error instanceof Error ? error.message : 'Unknown error')
    return ''
  }
}

/**
 * Segment URL with duration info
 */
export interface MediaSegment {
  url: string
  durationMs: number
}

/**
 * Media URL object with quality information and direct segment URLs
 */
export interface MediaUrl {
  quality: string
  bitRate: string
  /** HLS playlist URL (original) */
  hlsUrl: string
  /** Direct URL to first segment (for simple playback) */
  url: string
  /** Init segment URL for fMP4 (if present) */
  initUrl?: string
  /** All segment URLs with durations */
  segments: MediaSegment[]
  /** Total duration in milliseconds */
  durationMs: number
  /** Format: m4a, mp4, ts, aac */
  format: string
}

/**
 * Fetch stream URL from Gaana API and parse HLS to get direct segment URLs
 * @param trackId - Track ID to get stream URL for
 * @param quality - Audio quality (low, medium, high)
 * @returns Promise with media URL info including direct segment URLs, or null
 */
export async function fetchStreamUrl(
  trackId: string,
  quality: 'low' | 'medium' | 'high' = 'high'
): Promise<MediaUrl | null> {
  try {
    const url = 'https://gaana.com/api/stream-url'
    const body = new URLSearchParams({
      quality,
      track_id: trackId,
      stream_format: 'mp4'
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        Origin: 'https://gaana.com',
        Referer: 'https://gaana.com/'
      },
      body: body.toString()
    })

    const data = (await res.json()) as {
      api_status?: string
      data?: {
        stream_path?: string
        bit_rate?: string
        track_format?: string
      }
    }

    if (data.api_status === 'success' && data.data?.stream_path) {
      const hlsUrl = decryptStreamPath(data.data.stream_path)

      if (hlsUrl) {
        // Parse HLS manifest to get direct segment URLs
        const manifest = await parseHlsManifest(hlsUrl)

        if (manifest.segments.length === 0) {
          console.warn('No segments found in HLS manifest')
          return null
        }

        // Detect format from first segment URL
        const firstSegmentUrl = manifest.segments[0].url
        let format = 'm4a'
        if (firstSegmentUrl.includes('.m4s')) format = 'm4s'
        else if (firstSegmentUrl.includes('.mp4')) format = 'mp4'
        else if (firstSegmentUrl.includes('.ts')) format = 'ts'
        else if (firstSegmentUrl.includes('.aac')) format = 'aac'

        return {
          quality,
          bitRate: data.data.bit_rate || '',
          hlsUrl,
          url: firstSegmentUrl,
          initUrl: manifest.initSegmentUrl,
          segments: manifest.segments,
          durationMs: manifest.totalDurationMs,
          format
        }
      }
    }

    return null
  } catch (error) {
    console.warn('Failed to fetch stream URL:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Get all available stream URLs for a track
 * @param trackId - Track ID
 * @returns Promise with array of media URLs for different qualities
 */
export async function getMediaUrls(trackId: string): Promise<MediaUrl[]> {
  const qualities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']
  const results: MediaUrl[] = []

  // Try high quality first, if it works, that's enough
  const highQuality = await fetchStreamUrl(trackId, 'high')
  if (highQuality) {
    results.push(highQuality)
  }

  return results
}
