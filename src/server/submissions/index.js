import { submissionController, submissionsController } from './controller.js'

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const submissions = {
  plugin: {
    name: 'submissions',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/submissions',
          ...submissionsController
        },
        {
          method: 'GET',
          path: '/submissions/{id}',
          ...submissionController
        }
      ])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
