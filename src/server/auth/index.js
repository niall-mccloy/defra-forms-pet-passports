import { loginController } from './controllers/login-controller.js'
import { callbackController } from './controllers/callback-controller.js'
import { authGuard } from './auth-guard.js'

export const auth = {
  plugin: {
    name: 'auth',
    register(server) {
      server.ext('onPreAuth', authGuard)

      server.route([
        {
          method: 'GET',
          path: '/oidc/callback',
          ...callbackController
        },
        {
          method: 'GET',
          path: '/auth/login',
          ...loginController
        }
      ])
    }
  }
}
