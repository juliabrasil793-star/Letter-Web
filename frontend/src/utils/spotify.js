/**
 * Extrai e normaliza links de músicas, álbuns e playlists do Spotify
 * para a URL oficial de incorporação (embed) do Spotify.
 */
export function parseSpotifyUrl(input) {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()

  // Se o usuário colou uma tag iframe completa do Spotify
  const iframeSrcMatch = trimmed.match(/src=["'](https:\/\/open\.spotify\.com\/embed\/[^"']+)["']/i)
  if (iframeSrcMatch) {
    const embedUrl = iframeSrcMatch[1]
    const typeMatch = embedUrl.match(/\/embed\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/i)
    return {
      url: embedUrl,
      type: typeMatch ? typeMatch[1].toLowerCase() : 'track',
      id: typeMatch ? typeMatch[2] : '',
      originalUrl: trimmed,
    }
  }

  // Se for URL web do Spotify (suporta /intl-pt/, /user/.../playlist/, etc.)
  const webMatch = trimmed.match(/^https?:\/\/open\.spotify\.com\/(?:.*\/)?(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/i)
  if (webMatch) {
    const [, type, id] = webMatch
    return {
      url: `https://open.spotify.com/embed/${type.toLowerCase()}/${id}`,
      type: type.toLowerCase(),
      id,
      originalUrl: trimmed,
    }
  }

  // Se for uma URI do Spotify (ex: spotify:track:4cOdK2wGLETKBW3PvgPWqT)
  const uriMatch = trimmed.match(/^spotify:(track|album|playlist|episode|show):([a-zA-Z0-9]+)/i)
  if (uriMatch) {
    const [, type, id] = uriMatch
    return {
      url: `https://open.spotify.com/embed/${type.toLowerCase()}/${id}`,
      type: type.toLowerCase(),
      id,
      originalUrl: trimmed,
    }
  }

  return null
}
