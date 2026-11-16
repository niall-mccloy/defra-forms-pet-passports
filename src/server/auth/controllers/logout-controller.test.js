import * as oidc from 'openid-client'
import { load } from 'cheerio'

import { config } from '~/src/config/config.js'
import { createServer } from '~/src/server/index.js'
import { getOidcConfiguration } from '~/src/server/auth/oidc-client.js'

jest.mock('~/src/server/auth/oidc-client.js', () => ({
  getOidcConfiguration: jest.fn()
}))

describe('sign out', () => {
  let server
  const providerLogoutUrl = 'http://localhost:3200/cdp-defra-id-stub/logout'

  beforeAll(async () => {
    server = await createServer()
    server.route([
      {
        method: 'GET',
        path: '/test/sign-in',
        handler(request, h) {
          request.yar.set('user', { sub: 'test-user' })
          request.yar.set('oidcTransaction', { state: 'pending-state' })
          request.yar.set('loginReturnTo', '/submissions')
          return h.redirect('/')
        }
      },
      {
        method: 'GET',
        path: '/test/session',
        handler(request) {
          return {
            user: request.yar.get('user') ?? null,
            transaction: request.yar.get('oidcTransaction') ?? null,
            returnTo: request.yar.get('loginReturnTo') ?? null
          }
        }
      }
    ])
    await server.initialize()
  })

  beforeEach(() => {
    const configuration = new oidc.Configuration(
      {
        issuer: config.get('oidc.issuerUrl'),
        end_session_endpoint: providerLogoutUrl
      },
      config.get('oidc.clientId')
    )
    oidc.allowInsecureRequests(configuration)
    getOidcConfiguration.mockResolvedValue(configuration)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  async function signedInPage(path = '/') {
    const response = await server.inject('/test/sign-in')
    const cookie = response.headers['set-cookie']
      .map((value) => value.split(';')[0])
      .join('; ')
    const page = await server.inject({ url: path, headers: { cookie } })
    const cookies = new Map(
      [
        ...response.headers['set-cookie'],
        ...(page.headers['set-cookie'] ?? [])
      ].map((value) => {
        const pair = value.split(';')[0]
        return [pair.slice(0, pair.indexOf('=')), pair]
      })
    )
    const $ = load(page.payload)
    return {
      cookie: [...cookies.values()].join('; '),
      statusCode: page.statusCode,
      crumb: $('form[action="/auth/logout"] input[name="crumb"]').val(),
      $
    }
  }

  test.each([
    ['/order-pet-passports/start', 403],
    ['/non-existent-page', 404]
  ])('allows sign-out from the %s error page', async (path, status) => {
    const { cookie, crumb, statusCode } = await signedInPage(path)

    expect(statusCode).toBe(status)
    expect(crumb).toBeTruthy()
    const response = await server.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie },
      payload: { crumb }
    })

    expect(response.statusCode).toBe(302)
    expect(new URL(response.headers.location).pathname).toBe(
      '/cdp-defra-id-stub/logout'
    )
  })

  test('shows a CSRF-protected button and clears the session before provider logout', async () => {
    const { cookie, crumb, $ } = await signedInPage()
    expect($('form[action="/auth/logout"]').attr('method')).toBe('post')
    const heading = $('.app-service-heading')
    expect(heading.find('a[href="/"]').text()).toBe('Forms demo')
    expect(heading.find('form[action="/auth/logout"]')).toHaveLength(1)
    expect($('form[action="/auth/logout"] button').text().trim()).toBe(
      'Sign out'
    )
    expect(crumb).toBeTruthy()

    const response = await server.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie },
      payload: { crumb }
    })

    expect(response.statusCode).toBe(302)
    const destination = new URL(response.headers.location)
    expect(destination.origin + destination.pathname).toBe(providerLogoutUrl)
    expect(destination.searchParams.get('post_logout_redirect_uri')).toBe(
      new URL('/', config.get('oidc.redirectUri')).href
    )
    const clearedCookie = response.headers['set-cookie']
      .map((value) => value.split(';')[0])
      .join('; ')
    const session = await server.inject({
      url: '/test/session',
      headers: { cookie: clearedCookie }
    })
    expect(session.result).toEqual({
      user: null,
      transaction: null,
      returnTo: null
    })
  })

  test('rejects sign-out without a CSRF token and preserves the session', async () => {
    const { cookie } = await signedInPage()
    const response = await server.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie }
    })

    expect(response.statusCode).toBe(403)
    expect(getOidcConfiguration).not.toHaveBeenCalled()
    const session = await server.inject({
      url: '/test/session',
      headers: { cookie }
    })
    expect(session.result.user).toEqual({ sub: 'test-user' })
  })

  test('hides the button for anonymous users', async () => {
    const response = await server.inject('/')
    expect(load(response.payload)('form[action="/auth/logout"]')).toHaveLength(
      0
    )
  })

  test('reports provider failure after clearing the local session', async () => {
    const { cookie, crumb } = await signedInPage()
    getOidcConfiguration.mockRejectedValue(new Error('Provider unavailable'))

    const response = await server.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie },
      payload: { crumb }
    })

    expect(response.statusCode).toBe(503)
    expect(response.headers.location).toBeUndefined()
    const clearedCookie = response.headers['set-cookie']
      .map((value) => value.split(';')[0])
      .join('; ')
    const session = await server.inject({
      url: '/test/session',
      headers: { cookie: clearedCookie }
    })
    expect(session.result).toEqual({
      user: null,
      transaction: null,
      returnTo: null
    })
  })
})
