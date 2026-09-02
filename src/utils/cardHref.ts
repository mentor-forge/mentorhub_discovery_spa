import {
  buildJourneyUrl,
  resolveAlbOrigin,
} from '@mentor-forge/mentorhub_spa_utils'
import type { Card } from '@/api/types'

type Journey = 'discovery' | 'customer' | 'admin' | 'mentor' | 'mentee'
type LocationLike = Pick<Location, 'protocol' | 'hostname' | 'port' | 'origin'>

const JOURNEYS = new Set<Journey>(['discovery', 'customer', 'admin', 'mentor', 'mentee'])
const DEBUG_PORTS = new Set(['8386', '8388', '8390', '8392', '8394', '8397', '8398'])

function buildForLocation(journey: Journey, path: string, location: LocationLike): string {
  const href = buildJourneyUrl(journey, path)
  const runtimeOrigin = resolveAlbOrigin()
  const requestedOrigin = resolveAlbOrigin(location)

  return `${requestedOrigin}${href.slice(runtimeOrigin.length)}`
}

/**
 * Discovery API `link` values are relative SPA paths with a journey prefix
 * (`mentor/path/{id}`, `mentee/resource/{id}`, `admin/settings?tab=discounts`).
 * This helper only prefixes the welcome/ALB origin — it does not invent routes.
 */
function parseApiLink(raw: string): { journey: Journey; path: string } | undefined {
  const hashIndex = raw.indexOf('#')
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw
  const normalized = withoutHash.replace(/^\/+/, '')
  const [first = '', ...rest] = normalized.split('/')

  if (!JOURNEYS.has(first as Journey)) {
    return undefined
  }

  return { journey: first as Journey, path: `${rest.join('/')}${hash}` }
}

/** Resolve a Discovery card `link` through the welcome/ALB journey prefixes. */
export function cardHref(
  card: Card,
  location: LocationLike = window.location,
): string {
  const rawLink = card.link?.trim()
  if (!rawLink) {
    return ''
  }

  if (/^https?:\/\//i.test(rawLink)) {
    const absolute = new URL(rawLink)
    const isKnownDebugPort = DEBUG_PORTS.has(absolute.port)
    const isSameHostDebugUrl =
      absolute.hostname === location.hostname && resolveAlbOrigin(absolute) !== absolute.origin

    if (!isKnownDebugPort && !isSameHostDebugUrl) {
      return rawLink
    }

    const target = parseApiLink(`${absolute.pathname}${absolute.search}${absolute.hash}`)
    return target ? buildForLocation(target.journey, target.path, location) : ''
  }

  const target = parseApiLink(rawLink)
  return target ? buildForLocation(target.journey, target.path, location) : ''
}
