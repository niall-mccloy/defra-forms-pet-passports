import Boom from '@hapi/boom'

import { isCertifiedVet } from './certification-lookup.js'

/**
 * @param {Request} request
 * @param {ResponseToolkit} h
 */
export async function authGuard(request, h) {
  if (request.params.slug !== 'order-pet-passports') {
    return h.continue
  }

  const user = request.yar.get('user')

  if (!user) {
    return h.redirect('/auth/login').takeover()
  }

  if (
    typeof user.currentRelationshipId !== 'string' ||
    !user.currentRelationshipId ||
    !Array.isArray(user.roles)
  ) {
    request.logger.warn('Missing or invalid role claims')
    return Boom.forbidden()
  }

  const allowed = user.roles.some((entry) => {
    if (typeof entry !== 'string') return false

    const parts = entry.split(':')
    return (
      parts.length === 3 &&
      parts[0] === user.currentRelationshipId &&
      parts[1].toLowerCase() === 'vet' &&
      parts[2].toLowerCase() === 'complete'
    )
  })

  if (!allowed) {
    return Boom.forbidden()
  }

  if (typeof user.sub !== 'string' || !user.sub) {
    request.logger.warn('Missing or invalid user subject')
    return Boom.forbidden()
  }

  let certified

  try {
    certified = await isCertifiedVet(user.sub, user.currentRelationshipId)
  } catch (err) {
    request.logger.error({ err: err }, 'Certification lookup failed')
    return Boom.serverUnavailable('Unable to check vet certification')
  }

  return certified ? h.continue : Boom.forbidden()
}

/**
 * @import { Request, ResponseToolkit } from '@hapi/hapi'
 */
