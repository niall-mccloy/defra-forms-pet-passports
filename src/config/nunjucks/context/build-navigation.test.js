import { buildNavigation } from '~/src/config/nunjucks/context/build-navigation.js'

/**
 * @param {Partial<Request>} [options]
 */
function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
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
