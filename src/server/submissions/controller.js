import Boom from '@hapi/boom'

import {
  getSubmission,
  getSubmissionReport,
  listFormSubmissions,
  listSubmissions,
  SUBMISSIONS_PAGE_SIZE
} from '~/src/server/submission-store.js'

function formatAnswer(answer) {
  const value = answer.value
  return {
    title: answer.title ?? answer.name,
    value:
      value === null || value === undefined
        ? 'Not provided'
        : typeof value === 'string'
          ? value
          : JSON.stringify(value, null, 2),
    subItems: answer.subItems?.map((row) => row.map(formatAnswer))
  }
}

function getPage(query) {
  const pageQuery = query.page ?? '1'
  const page = Number(pageQuery)
  if (
    typeof pageQuery !== 'string' ||
    !/^[1-9]\d*$/.test(pageQuery) ||
    !Number.isSafeInteger(page) ||
    page > Math.floor(Number.MAX_SAFE_INTEGER / SUBMISSIONS_PAGE_SIZE)
  ) {
    throw Boom.badRequest('Invalid page number')
  }
  return page
}

function summary(submission) {
  return {
    id: submission._id.toHexString(),
    title: formLabel(submission.form, 'Unknown form'),
    submittedAt:
      submission.submittedAt instanceof Date
        ? submission.submittedAt.toISOString()
        : (submission.submittedAt ?? 'Not recorded')
  }
}

function formLabel(form, fallback) {
  if (form?.title) {
    return form.title
  }
  if (form?.slug) {
    return form.slug
  }
  return fallback
}

function formPath(formId) {
  return formId === null
    ? '/submissions/unattributed'
    : `/submissions/forms/${encodeURIComponent(formId)}`
}

export const submissionsController = {
  handler: async (request, h) => {
    const page = getPage(request.query)
    const result = await listSubmissions(page)
    return h
      .view('submissions/index', {
        pageTitle: 'Form submissions',
        submissions: result.submissions.map(summary),
        page,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: result.hasNextPage ? page + 1 : null
      })
      .header('Cache-Control', 'no-store')
  }
}

export const dashboardController = {
  handler: async (_request, h) => {
    const report = await getSubmissionReport(new Date())
    return h
      .view('submissions/dashboard', {
        pageTitle: 'Submission dashboard',
        totals: report.totals,
        forms: report.forms.map((form) => ({
          ...form,
          href: formPath(form._id)
        })),
        recent: report.recent.map(summary)
      })
      .header('Cache-Control', 'no-store')
  }
}

export const formSubmissionsController = {
  handler: async (request, h) => {
    const page = getPage(request.query)
    const formId = request.params.formId ?? null
    if (formId !== null && (typeof formId !== 'string' || formId === '')) {
      throw Boom.notFound('Form not found')
    }
    const result = await listFormSubmissions(formId, page)
    if (!result.count) {
      throw Boom.notFound('Form not found')
    }
    const path = formPath(formId)
    const detailQuery =
      formId === null
        ? `fromUnattributed=1&page=${page}`
        : `fromForm=${encodeURIComponent(formId)}&page=${page}`
    return h
      .view('submissions/form', {
        pageTitle:
          formId === null
            ? 'Unattributed submissions'
            : formLabel(result.submissions[0]?.form, formId),
        count: result.count,
        submissions: result.submissions.map((submission) => ({
          ...summary(submission),
          detailQuery
        })),
        page,
        previousPage: page > 1 ? `${path}?page=${page - 1}` : null,
        nextPage: result.hasNextPage ? `${path}?page=${page + 1}` : null
      })
      .header('Cache-Control', 'no-store')
  }
}

export const submissionController = {
  handler: async (request, h) => {
    const submission = await getSubmission(request.params.id)
    if (!submission) {
      throw Boom.notFound('Submission not found')
    }

    let backLink = '/submissions'
    const { fromForm, fromUnattributed } = request.query
    if (fromForm !== undefined || fromUnattributed !== undefined) {
      const page = getPage(request.query)
      const formId = submission.form?.id
      if (
        fromForm !== undefined &&
        typeof fromForm === 'string' &&
        fromForm !== '' &&
        fromUnattributed === undefined &&
        formId === fromForm
      ) {
        backLink = `${formPath(fromForm)}?page=${page}`
      } else if (
        fromUnattributed === '1' &&
        fromForm === undefined &&
        (typeof formId !== 'string' || formId === '')
      ) {
        backLink = `${formPath(null)}?page=${page}`
      } else {
        throw Boom.badRequest('Invalid submission navigation')
      }
    }

    return h
      .view('submissions/detail', {
        pageTitle: 'Submission details',
        detailBackLink: backLink,
        submission: {
          id: submission._id.toHexString(),
          form: submission.form,
          submittedAt: summary(submission).submittedAt,
          answers: submission.answers.map(formatAnswer)
        }
      })
      .header('Cache-Control', 'no-store')
  }
}
