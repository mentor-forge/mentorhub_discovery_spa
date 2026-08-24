import {
  buildJourneyUrl,
  JOURNEY_APP_PATHS,
  resolveAlbOrigin,
} from '@mentor-forge/mentorhub_spa_utils'
import type { Card, CardType } from '@/api/types'

type Journey = 'discovery' | 'customer' | 'admin' | 'mentor' | 'mentee'
type LocationLike = Pick<Location, 'protocol' | 'hostname' | 'port' | 'origin'>

const JOURNEYS = new Set<Journey>(['discovery', 'customer', 'admin', 'mentor', 'mentee'])
const DEBUG_PORTS = new Set(['8386', '8388', '8390', '8392', '8394', '8397', '8398'])

const TYPE_TARGETS: Partial<Record<CardType, { journey: Journey; collection: string }>> = {
  Event: { journey: 'mentee', collection: 'events' },
  Member: { journey: 'customer', collection: 'members' },
  Mentee: { journey: 'mentor', collection: 'mentees' },
  Path: { journey: 'mentor', collection: 'paths' },
  Plan: { journey: 'mentor', collection: 'plans' },
  Resource: { journey: 'mentor', collection: 'resources' },
}

const PATH_JOURNEYS: Record<string, Journey> = {
  admin: 'admin',
  customer: 'customer',
  event: 'mentee',
  events: 'mentee',
  member: 'customer',
  members: 'customer',
  mentee: 'mentor',
  mentees: 'mentor',
  mentor: 'mentor',
  path: 'mentor',
  paths: 'mentor',
  plan: 'mentor',
  plans: 'mentor',
  product: 'admin',
  products: 'admin',
  profile: 'customer',
  resource: 'mentor',
  resources: 'mentor',
  settings: 'admin',
}

function buildForLocation(journey: Journey, path: string, location: LocationLike): string {
  const href = buildJourneyUrl(journey, path)
  const runtimeOrigin = resolveAlbOrigin()
  const requestedOrigin = resolveAlbOrigin(location)

  return `${requestedOrigin}${href.slice(runtimeOrigin.length)}`
}

function splitJourneyPath(path: string): { journey: Journey; path: string } | undefined {
  const normalized = path.replace(/^\/+/, '')
  const [first = '', ...rest] = normalized.split('/')

  if (JOURNEYS.has(first as Journey)) {
    return { journey: first as Journey, path: rest.join('/') }
  }

  const journey = PATH_JOURNEYS[first.toLowerCase()]
  return journey ? { journey, path: normalized } : undefined
}

function fallbackTarget(card: Card): { journey: Journey; path: string } {
  if (card.type === 'Notification') {
    return JOURNEY_APP_PATHS.notifications
  }

  const target = card.type ? TYPE_TARGETS[card.type] : undefined
  if (target) {
    const path = card._id ? `${target.collection}/${card._id}` : target.collection
    return { journey: target.journey, path }
  }

  return JOURNEY_APP_PATHS.customerEdit
}

/** Resolve a Discovery card click target through the welcome/ALB journey prefixes. */
export function cardHref(
  card: Card,
  location: LocationLike = window.location,
): string {
  const rawLink = card.link?.trim()

  if (rawLink && /^https?:\/\//i.test(rawLink)) {
    const absolute = new URL(rawLink)
    const isKnownDebugPort = DEBUG_PORTS.has(absolute.port)
    const isSameHostDebugUrl =
      absolute.hostname === location.hostname && resolveAlbOrigin(absolute) !== absolute.origin

    if (!isKnownDebugPort && !isSameHostDebugUrl) {
      return rawLink
    }

    const target = splitJourneyPath(`${absolute.pathname}${absolute.search}${absolute.hash}`)
      ?? fallbackTarget(card)
    return buildForLocation(target.journey, target.path, location)
  }

  if (rawLink) {
    const target = splitJourneyPath(rawLink) ?? {
      ...fallbackTarget(card),
      path: rawLink.replace(/^\/+/, ''),
    }
    return buildForLocation(target.journey, target.path, location)
  }

  const target = fallbackTarget(card)
  return buildForLocation(target.journey, target.path, location)
}
