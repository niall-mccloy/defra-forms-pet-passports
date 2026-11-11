/**
 * @param {Request} request
 * @param {ResponseToolkit} h
 */
export function authGuard(request, h) {
  if (
    request.params.slug === 'order-pet-passports' &&
    !request.yar.get('user')
  ) {
    return h.redirect('/auth/login').takeover()
  }

  return h.continue
}

/**
 * @import { Request, ResponseToolkit } from '@hapi/hapi'
 */
