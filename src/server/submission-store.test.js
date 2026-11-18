import fetchMock from 'jest-fetch-mock'

import {
  getSubmission,
  getSubmissionReport,
  listFormSubmissions,
  listSubmissions,
  saveSubmission
} from './submission-store.js'

describe('submission backend client', () => {
  const originalUrl = process.env.PET_PASSPORT_BACKEND_URL
  const baseUrl = 'http://127.0.0.1:3001'

  beforeEach(() => {
    process.env.PET_PASSPORT_BACKEND_URL = baseUrl
    fetchMock.resetMocks()
  })

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.PET_PASSPORT_BACKEND_URL
    } else {
      process.env.PET_PASSPORT_BACKEND_URL = originalUrl
    }
  })

  test('sends the unchanged document as JSON and returns its backend ID', async () => {
    const document = {
      schemaVersion: 1,
      submittedAt: '2026-11-11T12:00:00.000Z',
      form: { id: 'form-1' },
      answers: [{ name: 'quantity', value: 10 }]
    }
    fetchMock.mockResponseOnce(JSON.stringify({ id: 'submission-id' }), {
      status: 201
    })
    await expect(saveSubmission(document)).resolves.toEqual({
      id: 'submission-id'
    })
    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(`${baseUrl}/submissions`)
    expect(options).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(document),
        signal: expect.any(AbortSignal)
      })
    )
  })

  test('preserves string IDs and pagination from the backend', async () => {
    const result = {
      submissions: [{ _id: '507f1f77bcf86cd799439011' }],
      hasNextPage: true
    }
    fetchMock.mockResponseOnce(JSON.stringify(result))
    await expect(listSubmissions(2)).resolves.toEqual(result)
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${baseUrl}/submissions?page=2`
    )
  })

  test.each([
    ['form/with spaces', '/submissions/forms/form%2Fwith%20spaces?page=3'],
    [null, '/submissions/unattributed?page=3']
  ])('routes form filter %s to the correct endpoint', async (formId, path) => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ submissions: [], count: 0, hasNextPage: false })
    )
    await listFormSubmissions(formId, 3)
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${baseUrl}${path}`)
  })

  test('passes the report timestamp and returns the report unchanged', async () => {
    const now = new Date('2026-03-29T12:00:00.000Z')
    const report = { totals: { submissions: 2 }, forms: [], recent: [] }
    fetchMock.mockResponseOnce(JSON.stringify(report))
    await expect(getSubmissionReport(now)).resolves.toEqual(report)
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.pathname).toBe('/submissions/report')
    expect(url.searchParams.get('now')).toBe(now.toISOString())
  })

  test('retrieves a detail and maps only a missing detail to null', async () => {
    const id = '507f1f77bcf86cd799439011'
    fetchMock.mockResponseOnce(JSON.stringify({ _id: id, answers: [] }))
    await expect(getSubmission(id)).resolves.toEqual({ _id: id, answers: [] })
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${baseUrl}/submissions/${id}`
    )
    fetchMock.mockResponseOnce('', { status: 404 })
    await expect(getSubmission(id)).resolves.toBeNull()
  })

  test.each(['bad-id', 'abcdefghijklmnopqrstuvwx', '123'])(
    'rejects malformed ID %s without contacting the backend',
    async (id) => {
      await expect(getSubmission(id)).resolves.toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    }
  )

  test('reports missing backend configuration', async () => {
    delete process.env.PET_PASSPORT_BACKEND_URL
    await expect(listSubmissions(1)).rejects.toThrow(
      'PET_PASSPORT_BACKEND_URL not set'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test.each([400, 404, 500])(
    'surfaces HTTP %i rather than returning an empty list',
    async (status) => {
      fetchMock.mockResponseOnce('{}', { status })
      await expect(listSubmissions(1)).rejects.toThrow(`(${status})`)
    }
  )

  test('does not retry failed writes', async () => {
    fetchMock.mockRejectOnce(new Error('Connection lost'))
    await expect(saveSubmission({ answers: [] })).rejects.toThrow(
      'Connection lost'
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('propagates timeouts and invalid backend JSON', async () => {
    fetchMock.mockRejectOnce(new DOMException('Timed out', 'TimeoutError'))
    await expect(listSubmissions(1)).rejects.toThrow('Timed out')
    fetchMock.mockResponseOnce('not JSON')
    await expect(listSubmissions(1)).rejects.toThrow()
  })
})
