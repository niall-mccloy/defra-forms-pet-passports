import * as oidc from 'openid-client'
import { config } from '~/src/config/config.js'

const issuerUrl = new URL(config.get('oidc.issuerUrl'))
const isLocalHttpIssuer =
  config.get('env') === 'development' &&
  issuerUrl.protocol === 'http:' &&
  ['localhost', '127.0.0.1'].includes(issuerUrl.hostname)

const discoveryOptions = isLocalHttpIssuer
  ? { execute: [oidc.allowInsecureRequests] }
  : undefined

let oidcConfigurationPromise

export function getOidcConfiguration() {
  oidcConfigurationPromise ??= oidc.discovery(
    new URL(config.get('oidc.issuerUrl')),
    config.get('oidc.clientId'),
    undefined,
    oidc.ClientSecretPost(config.get('oidc.clientSecret')),
    discoveryOptions
  )

  return oidcConfigurationPromise
}
