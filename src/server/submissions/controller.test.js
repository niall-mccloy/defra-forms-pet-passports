import { ObjectId } from 'mongodb'
import { load } from 'cheerio'

import { config } from '~/src/config/config.js'
import { createServer } from '~/src/server/index.js'
import {
  getSubmission,
  getSubmissionReport,
  listFormSubmissions,
  listSubmissions
} from '~/src/server/submission-store.js'

jest.mock('~/src/server/submission-store.js', () => ({
  SUBMISSIONS_PAGE_SIZE: 25,
  listSubmissions: jest.fn(),
  listFormSubmissions: jest.fn(),
  getSubmissionReport: jest.fn(),
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
    listFormSubmissions.mockResolvedValue({
      count: 1,
      submissions: [metadata],
      hasNextPage: false
    })
    getSubmissionReport.mockResolvedValue({
      totals: { submissions: 3, unattributed: 1, today: 1, week: 2, month: 3 },
      forms: [{ _id: 'form-1', title: 'Order pet passports', count: 2 }],
      recent: [metadata]
    })
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
    expect(
      load(response.payload)('a[href="/submissions/dashboard"]')
    ).toHaveLength(1)
  })

  test('shows reporting metrics, form links and recent submissions', async () => {
    const response = await server.inject('/submissions/dashboard')
    const $ = load(response.payload)
    expect(response.statusCode).toBe(200)
    expect(response.headers['cache-control']).toBe('no-store')
    const metrics = $('dl.govuk-summary-list dd')
      .map((_, element) => $(element).text().trim())
      .get()
    expect(metrics).toEqual(['1', '3', '1', '2', '3'])
    expect($('a[href="/submissions/forms/form-1"]').text()).toBe(
      'Order pet passports'
    )
    expect($('a[href="/submissions/unattributed"]')).toHaveLength(1)
    expect($(`a[href="/submissions/${id.toHexString()}"]`)).toHaveLength(1)
    expect(getSubmissionReport).toHaveBeenCalledWith(expect.any(Date))
  })

  test('shows empty dashboard states', async () => {
    getSubmissionReport.mockResolvedValue({
      totals: { submissions: 0, unattributed: 0, today: 0, week: 0, month: 0 },
      forms: [],
      recent: []
    })
    const response = await server.inject('/submissions/dashboard')
    expect(response.payload).toContain('No submissions found.')
    expect(response.payload).toContain('No recent submissions.')
  })

  test('links and navigates to forms with special characters in their IDs', async () => {
    getSubmissionReport.mockResolvedValue({
      totals: { submissions: 1, unattributed: 0, today: 1, week: 1, month: 1 },
      forms: [{ _id: 'form/one & two', title: 'Special form', count: 1 }],
      recent: []
    })
    const dashboard = await server.inject('/submissions/dashboard')
    const $ = load(dashboard.payload)
    const href = $('a')
      .filter((_, element) => $(element).text() === 'Special form')
      .attr('href')
    const response = await server.inject(href)
    expect(response.statusCode).toBe(200)
    expect(listFormSubmissions).toHaveBeenCalledWith('form/one & two', 1)
  })

  test('renders filtered pagination and a safe detail back link', async () => {
    listFormSubmissions.mockResolvedValue({
      count: 30,
      submissions: [{ ...metadata, form: { id: 'form-1', title: '<Form>' } }],
      hasNextPage: true
    })
    const response = await server.inject('/submissions/forms/form-1?page=2')
    const $ = load(response.payload)
    expect(response.statusCode).toBe(200)
    expect(response.headers['cache-control']).toBe('no-store')
    expect($('h1').text()).toBe('<Form>')
    expect($('main form')).toHaveLength(0)
    expect($('a[rel="prev"]').attr('href')).toBe(
      '/submissions/forms/form-1?page=1'
    )
    expect($('a[rel="next"]').attr('href')).toBe(
      '/submissions/forms/form-1?page=3'
    )
    const detailUrl = $('tbody a').attr('href')
    expect(detailUrl).toContain('?fromForm=form-1&page=2')
    expect(listFormSubmissions).toHaveBeenCalledWith('form-1', 2)
    getSubmission.mockResolvedValue({
      ...metadata,
      form: { id: 'form-1', title: 'Form' },
      answers: []
    })
    const detail = await server.inject(detailUrl)
    expect(load(detail.payload)('a.govuk-back-link').attr('href')).toBe(
      '/submissions/forms/form-1?page=2'
    )
    expect(
      (await server.inject(`/submissions/${id.toHexString()}?fromForm=another`))
        .statusCode
    ).toBe(400)
  })

  test('supports unattributed submissions and their detail navigation', async () => {
    listFormSubmissions.mockResolvedValue({
      count: 1,
      submissions: [{ ...metadata, form: {} }],
      hasNextPage: false
    })
    const response = await server.inject('/submissions/unattributed')
    expect(listFormSubmissions).toHaveBeenCalledWith(null, 1)
    getSubmission.mockResolvedValue({ ...metadata, form: {}, answers: [] })
    const detail = await server.inject(
      load(response.payload)('tbody a').attr('href')
    )
    expect(load(detail.payload)('a.govuk-back-link').attr('href')).toBe(
      '/submissions/unattributed?page=1'
    )
  })

  test('rejects invalid filtered pages and missing forms', async () => {
    expect(
      (await server.inject('/submissions/forms/form-1?page=0')).statusCode
    ).toBe(400)
    listFormSubmissions.mockResolvedValue({
      count: 0,
      submissions: [],
      hasNextPage: false
    })
    expect((await server.inject('/submissions/forms/missing')).statusCode).toBe(
      404
    )
  })

  test.each([
    '/submissions/dashboard',
    '/submissions/forms/form-1',
    '/submissions/unattributed'
  ])('reports database failures for %s', async (url) => {
    getSubmissionReport.mockRejectedValue(new Error('Database unavailable'))
    listFormSubmissions.mockRejectedValue(new Error('Database unavailable'))
    const response = await server.inject(url)
    expect(response.statusCode).toBe(500)
    expect(response.payload).toContain('Something went wrong')
    expect(response.payload).not.toContain('Database unavailable')
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
    for (const path of [
      '/submissions/dashboard',
      '/submissions/forms/form-1',
      '/submissions/unattributed'
    ]) {
      expect((await server.inject(path)).statusCode).not.toBe(200)
    }
    expect(
      server.table().some((route) => route.path === '/submissions/dashboard')
    ).toBe(false)
    expect(
      server
        .table()
        .some((route) => route.path === '/submissions/forms/{formId}')
    ).toBe(false)
    expect(
      server.table().some((route) => route.path === '/submissions/unattributed')
    ).toBe(false)
    const response = await server.inject('/')
    expect(load(response.payload)('a[href="/submissions"]')).toHaveLength(0)
    expect(
      load(response.payload)('a[href="/submissions/dashboard"]')
    ).toHaveLength(0)
    expect(listSubmissions).not.toHaveBeenCalled()
  })
})
