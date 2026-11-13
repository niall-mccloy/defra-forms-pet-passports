import { isCertifiedVet } from './certification-lookup.js'
import { authGuard } from './auth-guard.js'

jest.mock('./certification-lookup.js', () => ({
  isCertifiedVet: jest.fn()
}))

describe('authGuard', () => {
  const relationshipId = 'relationship-123'
  let request
  let h
  let redirect

  beforeEach(() => {
    redirect = { takeover: jest.fn().mockReturnValue('redirected') }
    request = {
      params: { slug: 'order-pet-passports' },
      yar: { get: jest.fn() },
      logger: { warn: jest.fn(), error: jest.fn() }
    }
    h = {
      continue: Symbol('continue'),
      redirect: jest.fn().mockReturnValue(redirect)
    }
    isCertifiedVet.mockResolvedValue(true)
  })

  test('redirects an anonymous user to sign in', async () => {
    expect(await authGuard(request, h)).toBe('redirected')
    expect(h.redirect).toHaveBeenCalledWith('/auth/login')
    expect(redirect.takeover).toHaveBeenCalled()
    expect(isCertifiedVet).not.toHaveBeenCalled()
  })

  test.each([
    ['vet', 'complete'],
    ['Vet', 'complete'],
    ['Vet', 'Complete']
  ])(
    'allows role %s with status %s for the selected organisation',
    async (role, status) => {
      const user = {
        sub: 'test-user',
        currentRelationshipId: relationshipId,
        roles: ['other:vet:complete', `${relationshipId}:${role}:${status}`]
      }
      request.yar.get.mockReturnValue(user)

      expect(await authGuard(request, h)).toBe(h.continue)
      expect(request.yar.get).toHaveBeenCalledWith('user')
      expect(h.redirect).not.toHaveBeenCalled()
      expect(isCertifiedVet).toHaveBeenCalledWith(
        user.sub,
        user.currentRelationshipId
      )
    }
  )

  test.each([
    ['a different role', 'relationship-123:employee:complete'],
    ['an admin role', 'relationship-123:admin:complete'],
    ['a pending vet role', 'relationship-123:vet:pending'],
    ['a blocked vet role', 'relationship-123:vet:blocked'],
    ['a blocked capitalized vet role', 'relationship-123:Vet:blocked'],
    ['a role for another organisation', 'other:vet:complete'],
    ['a malformed role', 'relationship-123:vet:complete:extra'],
    ['a non-string role', null]
  ])('denies access for %s', async (_description, role) => {
    request.yar.get.mockReturnValue({
      currentRelationshipId: relationshipId,
      roles: [role]
    })

    expect((await authGuard(request, h)).output.statusCode).toBe(403)
    expect(isCertifiedVet).not.toHaveBeenCalled()
  })

  test.each([
    ['missing roles', { currentRelationshipId: relationshipId }],
    ['invalid roles', { currentRelationshipId: relationshipId, roles: 'vet' }],
    ['missing organisation', { roles: [`${relationshipId}:vet:complete`] }],
    ['empty organisation', { currentRelationshipId: '', roles: [] }]
  ])('denies access with %s', async (_description, user) => {
    request.yar.get.mockReturnValue(user)

    expect((await authGuard(request, h)).output.statusCode).toBe(403)
    expect(request.logger.warn).toHaveBeenCalledWith(
      'Missing or invalid role claims'
    )
    expect(isCertifiedVet).not.toHaveBeenCalled()
  })

  test('denies a user who is not certified', async () => {
    const user = {
      sub: 'test-user',
      currentRelationshipId: relationshipId,
      roles: [`${relationshipId}:vet:complete`]
    }
    request.yar.get.mockReturnValue(user)
    isCertifiedVet.mockResolvedValue(false)

    expect((await authGuard(request, h)).output.statusCode).toBe(403)
    expect(isCertifiedVet).toHaveBeenCalledWith(
      user.sub,
      user.currentRelationshipId
    )
  })

  test('returns a service unavailable error when certification lookup fails', async () => {
    const user = {
      sub: 'test-user',
      currentRelationshipId: relationshipId,
      roles: [`${relationshipId}:vet:complete`]
    }
    const error = new Error('lookup failed')
    request.yar.get.mockReturnValue(user)
    isCertifiedVet.mockRejectedValue(error)

    expect((await authGuard(request, h)).output.statusCode).toBe(503)
    expect(isCertifiedVet).toHaveBeenCalledWith(
      user.sub,
      user.currentRelationshipId
    )
    expect(request.logger.error).toHaveBeenCalledWith(
      { err: error },
      'Certification lookup failed'
    )
  })

  test('does not restrict unrelated routes', async () => {
    request.params.slug = 'pet-passports'

    expect(await authGuard(request, h)).toBe(h.continue)
    expect(request.yar.get).not.toHaveBeenCalled()
    expect(isCertifiedVet).not.toHaveBeenCalled()
  })
})
