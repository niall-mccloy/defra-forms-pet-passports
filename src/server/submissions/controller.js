import Boom from '@hapi/boom'

import {
  getSubmission,
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

export const submissionsController = {
  handler: async (request, h) => {
    const pageQuery = request.query.page ?? '1'
    const page = Number(pageQuery)
    if (
      typeof pageQuery !== 'string' ||
      !/^[1-9]\d*$/.test(pageQuery) ||
      !Number.isSafeInteger(page) ||
      page > Math.floor(Number.MAX_SAFE_INTEGER / SUBMISSIONS_PAGE_SIZE)
    ) {
      throw Boom.badRequest('Invalid page number')
    }

    const result = await listSubmissions(page)
    return h
      .view('submissions/index', {
        pageTitle: 'Form submissions',
        submissions: result.submissions.map((submission) => ({
          id: submission._id.toHexString(),
          title: submission.form?.title,
          submittedAt: submission.submittedAt
        })),
        page,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: result.hasNextPage ? page + 1 : null
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

    return h
      .view('submissions/detail', {
        pageTitle: 'Submission details',
        submission: {
          id: submission._id.toHexString(),
          form: submission.form,
          submittedAt: submission.submittedAt,
          answers: submission.answers.map(formatAnswer)
        }
      })
      .header('Cache-Control', 'no-store')
  }
}
