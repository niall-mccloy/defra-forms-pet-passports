/**
 * @param {Partial<Request> | null} request
 */
export function buildNavigation(request) {
  return [
    {
      text: 'Simple form',
      href: '/simple-form/start',
      active: request?.path?.startsWith('/simple-form')
    },
    {
      text: 'Register a unicorn form',
      href: '/register-a-unicorn/where-do-you-live',
      active: request?.path?.startsWith('/register-a-unicorn')
    },
    {
      text: 'EU pet passports',
      href: '/pet-passports/start',
      active:
        request?.path === '/pet-passports' ||
        request?.path?.startsWith('/pet-passports/')
    },
    {
      text: 'Pet passport forecasting',
      href: '/pet-passports-forecasting/start',
      active: request?.path?.startsWith('/pet-passports-forecasting')
    },
    {
      text: 'Order pet passports',
      href: '/order-pet-passports/start',
      active: request?.path?.startsWith('/order-pet-passports')
    },
    {
      text: 'Report pet passport damage',
      href: '/report-pet-passport-damage/start',
      active: request?.path?.startsWith('/report-pet-passport-damage')
    }
  ]
}

/**
 * @import { Request } from '@hapi/hapi'
 */
