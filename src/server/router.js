import inert from '@hapi/inert'

import { health } from '~/src/server/health/index.js'
import { auth } from '~/src/server/auth/index.js'
import { home } from '~/src/server/home/index.js'
import { submissions } from '~/src/server/submissions/index.js'
import { isSubmissionViewerEnabled } from '~/src/config/config.js'
import { serveStaticFiles } from '~/src/server/common/helpers/serve-static-files.js'

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      await server.register([auth])
      await server.register([home])
      if (isSubmissionViewerEnabled()) {
        await server.register([submissions])
      }

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
