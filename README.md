# 🎵 Gaana API

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-blue)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.0+-blue)](https://hono.dev/)

A REST API wrapper for **Gaana music streaming**, built with **Hono**, **Bun**, and **TypeScript**. Provides access to songs, albums, playlists, artists, trending tracks, charts, and new releases metadata.

> **⚠️ Educational & Research Purpose Only**: This project is created **solely for educational and research purposes**. It is a learning project to understand API development, web scraping concepts, and TypeScript/Bun ecosystem. **This is not an official Gaana API**. Use responsibly and respect Gaana's terms of service. The authors are not responsible for any misuse of this project.

---

## ✨ Features

- ✅ **Unified Search** - Search across all content types (songs, albums, playlists, artists)
- ✅ **RESTful Endpoints** - Clean, standard REST API design
- ✅ **Detailed Info** - Full metadata for songs, albums, playlists, and artists
- ✅ **URL Support** - Accept both seokeys and full Gaana URLs for detail endpoints
- ✅ **Trending & Charts** - Get trending tracks and top charts
- ✅ **New Releases** - Browse new releases by language
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Serverless Ready** - Deploy directly to Vercel

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/notdeltaxd/Gaana-API.git
cd Gaana-API

# Install dependencies
bun install
# or
npm install
```

### Development

```bash
# Start development server
bun run dev

# API will be available at http://localhost:3000/api
```

### Deployment to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/notdeltaxd/Gaana-API)

**One-click deployment:** Click the button above to deploy instantly to Vercel.

**Manual deployment:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy
```

**⚠️ Important - Set Function Region to Mumbai:**

Since Gaana is an Indian music streaming platform, it's recommended to host your project in the Mumbai region for better performance:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Functions**
3. Under **Function Region**, select **Asia Pacific (Mumbai) - ap-south-1**
4. Unselect the default region
5. Click **Save Changes**
6. Redeploy your project

This ensures faster API response times when accessing Gaana's servers.

---

## 📚 API Documentation

### Base URL

```
Development:  http://localhost:3000/api
Production:   https://your-domain.vercel.app/api
```

### 🔍 Search Endpoint

**GET** `/api/search`

Unified search across all content types (songs, albums, playlists, artists) in parallel.

**Query Parameters:**

- `q` (required) - Search query string
- `limit` (optional) - Results per type (default: 10, max: 25)

**Example:**

```bash
curl "http://localhost:3000/api/search?q=despacito&limit=20"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "songs": [...],
    "albums": [...],
    "playlists": [...],
    "artists": [...]
  },
  "timestamp": "..."
}
```

### Type-Specific Search

- **GET** `/api/search/songs?q=query&limit=10`
- **GET** `/api/search/albums?q=query&limit=10`
- **GET** `/api/search/playlists?q=query&limit=10`
- **GET** `/api/search/artists?q=query&limit=10`

### 📕 Songs

**GET** `/api/songs/:id` or `GET /api/songs?url=...` or `GET /api/songs?seokey=...`

Get detailed information about a specific song.

**Examples:**

```bash
# Path parameter
curl "http://localhost:3000/api/songs/tune-ka-mathabhar"

# Query parameter with URL
curl "http://localhost:3000/api/songs?url=https://gaana.com/song/tune-ka-mathabhar"
```

**Response:**

```json
{
  "seokey": "...",
  "title": "...",
  "artists": "...",
  "album": "...",
  "duration": 0,
  "play_count": 0,
  "favorite_count": 0,
  "language": "...",
  "is_explicit": false,
  "artworkUrl": "..."
}
```

### 📚 Albums

**GET** `/api/albums/:id` or `GET /api/albums?url=...` or `GET /api/albums?seokey=...`

Get album information with all tracks.

**Response:**

```json
{
  "seokey": "...",
  "title": "...",
  "artists": "...",
  "track_count": 0,
  "release_date": "...",
  "play_count": 0,
  "tracks": [...]
}
```

### 📋 Playlists

**GET** `/api/playlists/:id` or `GET /api/playlists?url=...` or `GET /api/playlists?seokey=...`

Get playlist information with all tracks.

**Response:**

```json
{
  "playlist": {
    "title": "...",
    "playlist_id": "...",
    "track_count": 0,
    "tracks": [...]
  }
}
```

### 🎤 Artists

**GET** `/api/artists/:id` or `GET /api/artists?url=...` or `GET /api/artists?seokey=...`

Get artist information with top tracks.

**Response:**

```json
{
  "artist_id": "...",
  "seokey": "...",
  "name": "...",
  "artwork": "...",
  "artist_url": "...",
  "top_tracks": [...]
}
```

### 🔥 Trending

**GET** `/api/trending?language=hi&limit=20`

Get currently trending tracks.

**Response:**

```json
{
  "success": true,
  "data": [...],
  "count": 0,
  "timestamp": "..."
}
```

### 📊 Charts

**GET** `/api/charts?limit=20`

Get top charts/playlists.

**Response:**

```json
{
  "success": true,
  "data": [...],
  "count": 0,
  "timestamp": "..."
}
```

### 🎁 New Releases

**GET** `/api/new-releases?language=hi`

Get new releases (songs and albums).

**Response:**

```json
{
  "success": true,
  "data": {
    "tracks": [...],
    "albums": [...]
  },
  "timestamp": "..."
}
```

### 🏥 Health

**GET** `/api/health`

Check API health status.

**Response:**

```json
{
  "status": "ok",
  "uptime": 0,
  "environment": "...",
  "timestamp": "..."
}
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### ⚠️ Important Disclaimer

**This project is for educational and research purposes only.** It is not affiliated with, endorsed by, or connected to Gaana in any way. This is a learning project created to understand API development, TypeScript, and web technologies. Users are responsible for ensuring their use complies with applicable laws and Gaana's terms of service. The authors assume no liability for misuse of this project.

</div>
