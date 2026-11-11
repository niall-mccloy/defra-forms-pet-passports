import { isSubmissionViewerEnabled } from '~/src/config/config.js'

/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 * @satisfies {Partial<ServerRoute>}
 */
export const homeController = {
  handler(_request, h) {
    return h.view('home/index', {
      pageTitle: 'Forms engine plugin demo',
      heading: 'Forms engine plugin demo',
      submissionViewerEnabled: isSubmissionViewerEnabled()
    })
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
