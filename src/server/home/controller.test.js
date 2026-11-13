import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { load } from 'cheerio'

describe('#homeController', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(result).toEqual(
      expect.stringContaining('Forms engine plugin demo |')
    )
    expect(statusCode).toBe(statusCodes.ok)
  })

  test('shows pet passport journeys without unrelated example forms', async () => {
    const response = await server.inject('/')
    const $ = load(response.payload)
    const headings = $('main h2')
      .map((_, element) => $(element).text().trim())
      .get()
    expect(headings).toEqual([
      'EU pet passports',
      'Pet passport forecasting',
      'Order pet passports',
      'Report a problem with a pet passport'
    ])
    for (const path of [
      '/pet-passports/start',
      '/pet-passports-forecasting/start',
      '/order-pet-passports/start',
      '/report-pet-passport-damage/start'
    ]) {
      expect($(`main a[href="${path}"]`)).toHaveLength(1)
    }
  })

  test('Should render the pet passport damage report start page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/report-pet-passport-damage/start'
    })

    expect(result).toEqual(
      expect.stringContaining(
        'Report a damaged, destroyed, lost or incorrectly completed pet passport'
      )
    )
    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should redirect anonymous users from the order form to sign in', async () => {
    const { headers, statusCode } = await server.inject({
      method: 'GET',
      url: '/order-pet-passports/start'
    })

    expect(statusCode).toBe(302)
    expect(headers.location).toBe('/auth/login')
  })

  test('Should redirect anonymous order form submissions to sign in', async () => {
    const { headers, statusCode } = await server.inject({
      method: 'POST',
      url: '/order-pet-passports/start'
    })

    expect(statusCode).toBe(302)
    expect(headers.location).toBe('/auth/login')
  })

  test('Should not intercept the OIDC callback', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/oidc/callback'
    })

    expect(statusCode).toBe(statusCodes.badRequest)
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
