import {
  buildJourneyUrl,
  resolveAlbOrigin,
  type AlbOriginLocation,
} from '@mentor-forge/mentorhub_spa_utils'

export type CreateAction =
  | 'inviteMember'
  | 'inviteCoordinator'
  | 'newResource'
  | 'newPath'
  | 'newPlan'

type LocationLike = AlbOriginLocation | Pick<Location, 'protocol' | 'hostname' | 'port' | 'origin'>

const ACTION_TARGETS: Record<CreateAction, { journey: 'customer' | 'mentor'; path: string }> = {
  inviteMember: { journey: 'customer', path: 'members/' },
  inviteCoordinator: { journey: 'customer', path: 'coordinators/' },
  newResource: { journey: 'mentor', path: 'resource' },
  newPath: { journey: 'mentor', path: 'path' },
  newPlan: { journey: 'mentor', path: 'plan' },
}

/**
 * Resolves cross-SPA creation / invitation URLs through welcome/ALB origin.
 */
export function createActionHref(
  action: CreateAction,
  location?: LocationLike,
): string {
  const target = ACTION_TARGETS[action]
  const href = buildJourneyUrl(target.journey, target.path)

  if (location) {
    const runtimeOrigin = resolveAlbOrigin()
    const requestedOrigin = resolveAlbOrigin(location as AlbOriginLocation)
    return `${requestedOrigin}${href.slice(runtimeOrigin.length)}`
  }

  return href
}
