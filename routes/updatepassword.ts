import { IncomingMessage, ServerResponse } from 'http';
import { db } from '../connectors/shared';

export const updatePasswordRoute = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const sendResponse = (statusCode: number, data: any) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const { method } = req;
  const authHeader = req.headers['authorization'];
  let username = '';

  if (authHeader) {
    try {
      const encodedUsername = authHeader.split('.')[0];
      username = Buffer.from(encodedUsername, 'base64').toString();
    } catch (error) {
      console.warn('Failed to decode username from Authorization header:', error);
    }
  }

  if (username === '') {
    sendResponse(400, { error: 'Username is required' });
    return;
  }

  if (method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { currentPassword, newPassword } = JSON.parse(body);

        if (!currentPassword || !newPassword) {
          sendResponse(400, { error: 'Current password and new password are required' });
          return;
        }

        // Call the method to update the password
        const success = await db.updatePassword(username, currentPassword, newPassword);

        if (success) {
          sendResponse(200, { message: 'Password updated successfully' });
        } else {
          sendResponse(400, { error: 'Failed to update password' });
        }
      } catch (error) {
        sendResponse(500, { error: 'Internal server error' });
      }
    });
  } else {
    sendResponse(405, { error: 'Method not allowed' });
  }
};
