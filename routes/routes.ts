import { IncomingMessage, ServerResponse } from 'http';
import { rootRoute } from './root';
import { loginRoute } from './login';
import { registerRoute } from './register';
import { testRoute } from './test';
import { logoutRoute } from './logout';
import { favoritesRoute } from './favourites';
import { groupsRoute } from './groups';  // Import groupsRoute here
import { followersRoute } from './followers';
import { deleteRoute } from './deleteuser';
import { profileRoute } from './profile';
import { reviewRoute } from './review';
import { updatePasswordRoute } from './updatepassword';

export const router = async (
  req: IncomingMessage,
  res: ServerResponse,
  path: string
): Promise<boolean> => {
  // Extract the base path (only the first part before a slash)
  const basePath = `/${path.split('/')[1]}`;
  console.log(basePath)

  if (req.method === 'GET') {
    switch (basePath) {
      case '/':
        rootRoute(res);
        return true;

      case '/test':
        testRoute(req, res);
        return true;

      case '/review':
        await reviewRoute(req, res);
        return true;

      case '/logout':
        logoutRoute(req, res);
        return true;

      case '/favorites':
        await favoritesRoute(req, res);
        return true;

      case '/groups':
        await groupsRoute(req, res);  // Add the groupsRoute logic here for GET
        return true;

      case '/profile':
        await profileRoute(req, res);
        return true;

      default:
        return false;
    }
  }

  if (req.method === 'POST') {
    switch (basePath) {
      case '/login':
        await loginRoute(req, res);
        return true;

      case '/review':
        await reviewRoute(req, res);
        return true;

      case '/register':
        await registerRoute(req, res);
        return true;

      case '/favorites':
        await favoritesRoute(req, res);
        return true;

      case '/groups':
        await groupsRoute(req, res);  // Add the groupsRoute logic here for POST
        return true;

      case '/followers':
        await followersRoute(req, res);
        return true;

      case '/passwordupdate':
        await updatePasswordRoute(req, res);
        return true;

      default:
        return false;
    }
  }

  if (req.method === 'DELETE') {
    switch (basePath) {
      case '/followers':
        await followersRoute(req, res);
        return true;

      case '/deleteme':
        await deleteRoute(req, res);
        return true;

      case '/favorites':
        await favoritesRoute(req, res);
        return true;

      case '/groups':
        await groupsRoute(req, res);  // Add the groupsRoute logic here for DELETE
        return true;

      default:
        return false;
    }
  }

  return false;
};
