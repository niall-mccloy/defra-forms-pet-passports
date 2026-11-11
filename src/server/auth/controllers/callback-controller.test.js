import * as oidc from 'openid-client'

import { getOidcConfiguration } from '~/src/server/auth/oidc-client.js'
import { callbackController } from '~/src/server/auth/controllers/callback-controller.js'

jest.mock('openid-client', () => ({
  authorizationCodeGrant: jest.fn()
}))

jest.mock('~/src/server/auth/oidc-client.js', () => ({
  getOidcConfiguration: jest.fn()
}))

describe('callbackController', () => {
  let request
  let h
  let transaction

  beforeEach(() => {
    transaction = {
      codeVerifier: 'code-verifier',
      state: 'expected-state',
      nonce: 'expected-nonce',
      returnTo: '/order-pet-passports/start'
    }
    request = {
      url: new URL(
        'http://localhost:3000/oidc/callback?code=authorization-code&state=expected-state'
      ),
      yar: {
        get: jest.fn().mockReturnValue(transaction),
        clear: jest.fn(),
        set: jest.fn()
      },
      logger: {
        error: jest.fn()
      }
    }
    h = {
      response: jest.fn().mockReturnThis(),
      redirect: jest.fn(),
      code: jest.fn().mockReturnThis()
    }

    getOidcConfiguration.mockResolvedValue({})
    oidc.authorizationCodeGrant.mockResolvedValue({
      claims: () => ({
        sub: 'user-id',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('validates the callback and saves the authenticated user in session', async () => {
    await callbackController.handler(request, h)

    expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(
      {},
      new URL(
        'http://localhost:3000/oidc/callback?code=authorization-code&state=expected-state'
      ),
      {
        pkceCodeVerifier: 'code-verifier',
        expectedState: 'expected-state',
        expectedNonce: 'expected-nonce'
      }
    )
    expect(request.yar.clear).toHaveBeenCalledWith('oidcTransaction')
    expect(request.yar.set).toHaveBeenCalledWith('user', {
      sub: 'user-id',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      currentRelationshipId: undefined,
      relationships: undefined,
      roles: undefined
    })
    expect(h.redirect).toHaveBeenCalledWith('/order-pet-passports/start')
  })

  test('returns a bad request when there is no OIDC transaction', async () => {
    request.yar.get.mockReturnValue(undefined)

    await callbackController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith(
      'Your sign-in session has expired. Please try again.'
    )
    expect(h.code).toHaveBeenCalledWith(400)
    expect(oidc.authorizationCodeGrant).not.toHaveBeenCalled()
  })

  test('returns unauthorized when the OIDC exchange or validation fails', async () => {
    oidc.authorizationCodeGrant.mockRejectedValue(new Error('Invalid state'))

    await callbackController.handler(request, h)

    expect(request.yar.clear).toHaveBeenCalledWith('oidcTransaction')
    expect(request.logger.error).toHaveBeenCalled()
    expect(h.response).toHaveBeenCalledWith(
      'Unable to complete sign-in. Please try again.'
    )
    expect(h.code).toHaveBeenCalledWith(401)
  })
})
