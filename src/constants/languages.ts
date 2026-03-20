/**
 * Supported language slugs for album-list endpoint.
 * These map to the language chips shown on Gaana's albums page.
 */
export const albumListSupportedLanguages = [
  'all',
  'hindi',
  'english',
  'punjabi',
  'telugu',
  'tamil',
  'bhojpuri',
  'bengali',
  'malayalam',
  'kannada',
  'marathi',
  'gujarati',
  'haryanvi',
  'urdu',
  'assamese',
  'rajasthani',
  'odia'
] as const

export type AlbumListLanguage = (typeof albumListSupportedLanguages)[number]
