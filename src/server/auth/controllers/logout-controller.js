import Boom from '@hapi/boom'
import * as oidc from 'openid-client'

import { config } from '~/src/config/config.js'
import { getOidcConfiguration } from '~/src/server/auth/oidc-client.js'

export const logoutController = {
  handler: async (request, h) => {
    request.yar.reset()

    try {
      const oidcConfiguration = await getOidcConfiguration()
      const logoutUrl = oidc.buildEndSessionUrl(oidcConfiguration, {
        client_id: config.get('oidc.clientId'),
        post_logout_redirect_uri: new URL('/', config.get('oidc.redirectUri'))
          .href
      })

      return h.redirect(logoutUrl.href)
    } catch (err) {
      request.logger.error({ err }, 'Identity provider sign-out failed')
      return Boom.serverUnavailable(
        'Signed out locally, but unable to complete identity provider sign-out'
      )
    }
  }
}
