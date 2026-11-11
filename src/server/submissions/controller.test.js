import { ObjectId } from 'mongodb'
import { load } from 'cheerio'

import { config } from '~/src/config/config.js'
import { createServer } from '~/src/server/index.js'
import {
  getSubmission,
  listSubmissions
} from '~/src/server/submission-store.js'

jest.mock('~/src/server/submission-store.js', () => ({
  SUBMISSIONS_PAGE_SIZE: 25,
  listSubmissions: jest.fn(),
  getSubmission: jest.fn(),
  saveSubmission: jest.fn()
}))

const originalEnv = config.get('env')
const originalEnabled = config.get('submissionViewerEnabled')
const id = new ObjectId('507f1f77bcf86cd799439011')
const metadata = {
  _id: id,
  form: { title: 'Order pet passports' },
  submittedAt: '2026-11-11T12:00:00.000Z'
}

describe('local submission viewer', () => {
  let server

  beforeAll(async () => {
    config.set('env', 'development')
    config.set('submissionViewerEnabled', true)
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    listSubmissions.mockResolvedValue({
      submissions: [metadata],
      hasNextPage: false
    })
    getSubmission.mockResolvedValue({ ...metadata, answers: [] })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    config.set('env', originalEnv)
    config.set('submissionViewerEnabled', originalEnabled)
  })

  test('binds to loopback and shows the homepage link', async () => {
    expect(server.info.host).toBe('127.0.0.1')
    const response = await server.inject('/')
    expect(response.statusCode).toBe(200)
    expect(load(response.payload)('a[href="/submissions"]')).toHaveLength(1)
  })

  test('renders summary links without loading answers or requiring login', async () => {
    const response = await server.inject('/submissions')
    const $ = load(response.payload)
    expect(response.statusCode).toBe(200)
    expect(response.headers['cache-control']).toBe('no-store')
    expect($('tbody tr')).toHaveLength(1)
    expect($(`a[href="/submissions/${id.toHexString()}"]`).text()).toContain(
      'View details'
    )
    expect($('time').text()).toBe(metadata.submittedAt)
    expect(listSubmissions).toHaveBeenCalledWith(1)
    expect(getSubmission).not.toHaveBeenCalled()
    expect($('a[rel="prev"], a[rel="next"]')).toHaveLength(0)
  })

  test('renders pagination for subsequent pages', async () => {
    listSubmissions.mockResolvedValue({
      submissions: [metadata],
      hasNextPage: true
    })
    const response = await server.inject('/submissions?page=2')
    const $ = load(response.payload)
    expect(listSubmissions).toHaveBeenCalledWith(2)
    expect($('a[rel="prev"]').attr('href')).toBe('/submissions?page=1')
    expect($('a[rel="next"]').attr('href')).toBe('/submissions?page=3')
  })

  test('renders an empty state', async () => {
    listSubmissions.mockResolvedValue({ submissions: [], hasNextPage: false })
    const response = await server.inject('/submissions')
    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain('No submissions found.')
  })

  test.each(['0', '-1', '1.5', 'abc', '', '9007199254740991', '1&page=2'])(
    'rejects invalid page %s',
    async (page) => {
      const response = await server.inject(`/submissions?page=${page}`)
      expect(response.statusCode).toBe(400)
      expect(listSubmissions).not.toHaveBeenCalled()
    }
  )

  test('renders escaped scalar, structured and nested answers', async () => {
    getSubmission.mockResolvedValue({
      ...metadata,
      form: { title: '<script>form()</script>' },
      answers: [
        { title: 'Name', value: '<script>alert(1)</script>' },
        { title: 'Quantity', value: 0 },
        { title: 'Confirmed', value: false },
        { name: 'optional', value: null },
        { title: 'Address', value: { line1: '<b>Street</b>' } },
        {
          title: 'Pets',
          subItems: [
            [
              {
                title: 'Pet name',
                value: 'Rover',
                subItems: [[{ title: 'Nested', value: 'Deep answer' }]]
              }
            ],
            [{ title: 'Pet name', value: 'Fido' }]
          ]
        }
      ]
    })
    const response = await server.inject(`/submissions/${id.toHexString()}`)
    const $ = load(response.payload)
    expect(response.statusCode).toBe(200)
    expect(response.headers['cache-control']).toBe('no-store')
    expect(getSubmission).toHaveBeenCalledWith(id.toHexString())
    expect($('main script, main b')).toHaveLength(0)
    const text = $('main').text()
    for (const value of [
      '<script>alert(1)</script>',
      '<script>form()</script>',
      '0',
      'false',
      'Not provided',
      '<b>Street</b>',
      'Deep answer',
      'Fido'
    ]) {
      expect(text).toContain(value)
    }
    expect($('h3').text()).toContain('Entry 2')
  })

  test('renders details without answers', async () => {
    const response = await server.inject(`/submissions/${id.toHexString()}`)
    expect(response.payload).toContain('No answers recorded.')
  })

  test('returns 404 for missing or invalid IDs', async () => {
    getSubmission.mockResolvedValue(null)
    for (const value of [id.toHexString(), 'bad-id']) {
      expect((await server.inject(`/submissions/${value}`)).statusCode).toBe(
        404
      )
    }
  })

  test.each(['list', 'detail'])(
    'reports %s database failures as errors',
    async (kind) => {
      listSubmissions.mockRejectedValue(new Error('Database unavailable'))
      getSubmission.mockRejectedValue(new Error('Database unavailable'))
      const response = await server.inject(
        kind === 'list' ? '/submissions' : `/submissions/${id.toHexString()}`
      )
      expect(response.statusCode).toBe(500)
      expect(response.payload).toContain('Something went wrong')
      expect(response.payload).not.toContain('Database unavailable')
      expect(response.payload).not.toContain('No submissions found.')
    }
  )

  test('preserves order form sign-in', async () => {
    const response = await server.inject('/order-pet-passports/start')
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/auth/login')
  })
})

describe.each([
  ['development', false],
  ['production', true],
  ['test', true]
])('disabled viewer in %s with flag %s', (env, enabled) => {
  let server

  beforeAll(async () => {
    config.set('env', env)
    config.set('submissionViewerEnabled', enabled)
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    config.set('env', originalEnv)
    config.set('submissionViewerEnabled', originalEnabled)
  })

  test('has no viewer routes or homepage link', async () => {
    expect((await server.inject('/submissions')).statusCode).toBe(404)
    expect(
      (await server.inject(`/submissions/${id.toHexString()}`)).statusCode
    ).toBe(404)
    const response = await server.inject('/')
    expect(load(response.payload)('a[href="/submissions"]')).toHaveLength(0)
    expect(listSubmissions).not.toHaveBeenCalled()
  })
})
