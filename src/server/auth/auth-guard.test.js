import { authGuard } from './auth-guard.js'

describe('authGuard', () => {
  test('allows an authenticated user to access the order form', () => {
    const request = {
      params: {
        slug: 'order-pet-passports'
      },
      yar: {
        get: jest.fn().mockReturnValue({ sub: 'user-id' })
      }
    }
    const h = {
      continue: Symbol('continue'),
      redirect: jest.fn()
    }

    expect(authGuard(request, h)).toBe(h.continue)
    expect(request.yar.get).toHaveBeenCalledWith('user')
    expect(h.redirect).not.toHaveBeenCalled()
  })
})
