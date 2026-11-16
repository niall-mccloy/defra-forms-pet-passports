import { buildNavigation } from '~/src/config/nunjucks/context/build-navigation.js'
import { isSubmissionViewerEnabled } from '~/src/config/config.js'

jest.mock('~/src/config/config.js', () => ({
  isSubmissionViewerEnabled: jest.fn()
}))

/**
 * @param {Partial<Request>} [options]
 */
function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  beforeEach(() => {
    isSubmissionViewerEnabled.mockReturnValue(false)
  })

  test.each(['/submissions', '/submissions/dashboard', '/submissions/example'])(
    'shows and highlights the enabled submissions dashboard on %s',
    (path) => {
      isSubmissionViewerEnabled.mockReturnValue(true)

      expect(buildNavigation(mockRequest({ path }))).toContainEqual({
        text: 'Submissions dashboard',
        href: '/submissions/dashboard',
        active: true
      })
    }
  )

  test('does not highlight the dashboard on unrelated pages', () => {
    isSubmissionViewerEnabled.mockReturnValue(true)

    expect(buildNavigation(mockRequest({ path: '/' }))).toContainEqual({
      text: 'Submissions dashboard',
      href: '/submissions/dashboard',
      active: false
    })
  })

  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        active: false,
        text: 'EU pet passports',
        href: '/pet-passports/start'
      },
      {
        active: false,
        text: 'Pet passport forecasting',
        href: '/pet-passports-forecasting/start'
      },
      {
        active: false,
        text: 'Order pet passports',
        href: '/order-pet-passports/start'
      },
      {
        active: false,
        text: 'Report pet passport damage',
        href: '/report-pet-passport-damage/start'
      }
    ])
  })

  test('Should highlight the pet passports navigation item', () => {
    const navigation = buildNavigation(
      mockRequest({ path: '/pet-passports/start' })
    )

    expect(navigation[0].active).toBe(true)
  })

  test('Should highlight the pet passport forecasting navigation item', () => {
    const navigation = buildNavigation(
      mockRequest({ path: '/pet-passports-forecasting/start' })
    )

    expect(navigation[0].active).toBe(false)
    expect(navigation[1].active).toBe(true)
  })

  test('Should highlight the pet passport ordering navigation item', () => {
    const navigation = buildNavigation(
      mockRequest({ path: '/order-pet-passports/start' })
    )

    expect(navigation[2].active).toBe(true)
  })

  test('Should highlight the pet passport damage reporting navigation item', () => {
    const navigation = buildNavigation(
      mockRequest({ path: '/report-pet-passport-damage/start' })
    )

    expect(navigation[3].active).toBe(true)
  })
})

/**
 * @import { Request } from '@hapi/hapi'
 */
