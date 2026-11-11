import * as oidc from 'openid-client'

import { config } from '~/src/config/config.js'
import { getOidcConfiguration } from '~/src/server/auth/oidc-client.js'

export const loginController = {
  handler: async (request, h) => {
    const oidcConfiguration = await getOidcConfiguration()
    const codeVerifier = oidc.randomPKCECodeVerifier()
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
    const state = oidc.randomState()
    const nonce = oidc.randomNonce()

    request.yar.set('oidcTransaction', {
      codeVerifier,
      state,
      nonce,
      returnTo: '/order-pet-passports/start'
    })

    const authorizationUrl = oidc.buildAuthorizationUrl(oidcConfiguration, {
      redirect_uri: config.get('oidc.redirectUri'),
      scope: config.get('oidc.scope'),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce
    })

    return h.redirect(authorizationUrl.href)
  }
}
