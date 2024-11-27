import { IncomingMessage, ServerResponse } from 'http'
import { rootRoute } from './root'
import { loginRoute } from './login'
import { registerRoute } from './register'
import { testRoute } from './test'
import { logoutRoute } from './logout'
import { favoritesRoute } from './favourites'
import { groupsRoute } from './groups'
import { followersRoute } from './followers'
import { deleteRoute } from './deleteuser'
import { profileRoute } from './profile'

export const router = async (
  req: IncomingMessage,
  res: ServerResponse,
  path: string
): Promise<boolean> => {
  if (req.method === 'GET') {
    switch (path) {
      case '/':
        rootRoute(res)
        return true

      case '/test':
        testRoute(req, res)
        return true

      case '/logout':
        logoutRoute(req, res)
        return true

      case '/favorites':
        await favoritesRoute(req, res)
        return true


      case '/groups':
        await groupsRoute(req, res)
        return true

      case '/profile':
        await profileRoute(req, res)
        return true

      default:
        return false
    }
  }

  if (req.method === 'POST') {
    switch (path) {
      case '/login':
        await loginRoute(req, res)
        return true

      case '/register':
        await registerRoute(req, res)
        return true

      case '/favorites':
        await favoritesRoute(req, res)
        return true

      case '/groups':
        await groupsRoute(req, res)
        return true

      case '/followers':
        await followersRoute(req, res)
        return true

      default:
        return false
    }
  }

  if (req.method === 'DELETE') {
    switch (path) {
      case '/followers':
        await followersRoute(req, res)
        return true

      case '/deleteme':
        await deleteRoute(req, res)
        return true

      default:
        return false
    }
  }

  return false
}
