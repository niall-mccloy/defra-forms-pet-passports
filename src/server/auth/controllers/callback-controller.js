import * as oidc from 'openid-client'

import { config } from '~/src/config/config.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { getOidcConfiguration } from '~/src/server/auth/oidc-client.js'

export const callbackController = {
  handler: async (request, h) => {
    const transaction = request.yar.get('oidcTransaction')

    if (!transaction) {
      return h
        .response('Your sign-in session has expired. Please try again.')
        .code(statusCodes.badRequest)
    }

    const callbackUrl = new URL(config.get('oidc.redirectUri'))
    callbackUrl.search = request.url.search

    try {
      const oidcConfiguration = await getOidcConfiguration()
      const tokens = await oidc.authorizationCodeGrant(
        oidcConfiguration,
        callbackUrl,
        {
          pkceCodeVerifier: transaction.codeVerifier,
          expectedState: transaction.state,
          expectedNonce: transaction.nonce
        }
      )
      const claims = tokens.claims()

      if (!claims?.sub) {
        throw new Error('ID token is missing the subject claim')
      }

      request.yar.clear('oidcTransaction')
      request.yar.set('user', {
        sub: claims.sub,
        email: claims.email,
        firstName: claims.firstName,
        lastName: claims.lastName,
        currentRelationshipId: claims.currentRelationshipId,
        relationships: claims.relationships,
        roles: claims.roles
      })

      return h.redirect(transaction.returnTo ?? '/order-pet-passports/start')
    } catch (error) {
      request.yar.clear('oidcTransaction')
      request.logger.error({ err: error }, 'OIDC callback failed')
      return h
        .response('Unable to complete sign-in. Please try again.')
        .code(statusCodes.unauthorized)
    }
  }
}
