import Boom from '@hapi/boom'

import { isCertifiedVet } from './certification-lookup.js'

/**
 * @param {Request} request
 * @param {ResponseToolkit} h
 */
export async function authGuard(request, h) {
  const isOrderForm = request.params.slug === 'order-pet-passports'
  const isSubmissions =
    request.path === '/submissions' || request.path.startsWith('/submissions/')
  if (!isOrderForm && !isSubmissions) {
    return h.continue
  }

  const user = request.yar.get('user')

  if (!user) {
    request.yar.set(
      'loginReturnTo',
      isSubmissions ? '/submissions' : '/order-pet-passports'
    )
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

    if (isOrderForm) {
      const parts = entry.split(':')
      return (
        parts.length === 3 &&
        parts[0] === user.currentRelationshipId &&
        parts[1].toLowerCase() === 'vet' &&
        parts[2].toLowerCase() === 'complete'
      )
    }
    if (isSubmissions) {
      const parts = entry.split(':')
      return (
        parts.length === 3 &&
        parts[0] === user.currentRelationshipId &&
        parts[1].toLowerCase() === 'admin' &&
        parts[2].toLowerCase() === 'complete'
      )
    }
    return false
  })

  if (!allowed) {
    return Boom.forbidden()
  }

  if (typeof user.sub !== 'string' || !user.sub) {
    request.logger.warn('Missing or invalid user subject')
    return Boom.forbidden()
  }

  if (request.params.slug === 'order-pet-passports') {
    try {
      const certified = await isCertifiedVet(
        user.sub,
        user.currentRelationshipId
      )
      return certified ? h.continue : Boom.forbidden()
    } catch (err) {
      request.logger.error({ err: err }, 'Certification lookup failed')
      return Boom.serverUnavailable('Unable to check vet certification')
    }
  }

  return h.continue
}

/**
 * @import { Request, ResponseToolkit } from '@hapi/hapi'
 */
