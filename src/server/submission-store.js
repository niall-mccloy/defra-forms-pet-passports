export const SUBMISSIONS_PAGE_SIZE = 25
export const RECENT_SUBMISSIONS_LIMIT = 10

async function backendRequest(
  path,
  { allowNotFound = false, ...options } = {}
) {
  const baseUrl = process.env.PET_PASSPORT_BACKEND_URL
  if (!baseUrl) {
    throw new Error('PET_PASSPORT_BACKEND_URL not set')
  }

  const response = await fetch(new URL(path, baseUrl).href, {
    ...options,
    signal: AbortSignal.timeout(10000)
  })

  if (allowNotFound && response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(
      `Submission backend request failed: ${options.method ?? 'GET'} (${response.status})`
    )
  }
  return response.json()
}

export function saveSubmission(document) {
  return backendRequest('/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(document)
  })
}

export function listSubmissions(page) {
  const query = new URLSearchParams({ page: String(page) })
  return backendRequest(`/submissions?${query}`)
}

export function listFormSubmissions(formId, page) {
  const path =
    formId === null
      ? '/submissions/unattributed'
      : `/submissions/forms/${encodeURIComponent(formId)}`
  const query = new URLSearchParams({ page: String(page) })
  return backendRequest(`${path}?${query}`)
}

export function getSubmissionReport(now = new Date()) {
  const query = new URLSearchParams({ now: now.toISOString() })
  return backendRequest(`/submissions/report?${query}`)
}

export async function getSubmission(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return null
  }
  return backendRequest(`/submissions/${id}`, { allowNotFound: true })
}
