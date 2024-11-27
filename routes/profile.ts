import { IncomingMessage, ServerResponse } from 'http'
import { db, auth } from '../connectors/shared'

export const profileRoute = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const sendResponse = (statusCode: number, data: any) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  const token = req.headers.authorization

  if (!token || !auth.isUserLoggedin(token)) {
    sendResponse(401, { error: 'Not logged in' })
    return
  }

  let username = ''

  try {
    const encodedUsername = token.split('.')[0]
    username = Buffer.from(encodedUsername, 'base64').toString()
  } catch (error) {
    console.warn('Failed to decode username from Authorization header:', error)
    sendResponse(400, { error: 'Invalid token structure' })
    return
  }

  try {
    const user = await db.getUserProfile(username)

    if (!user) {
      sendResponse(404, { error: 'User not found' })
      return
    }

    sendResponse(200, {
      username: user.username,
      email: user.email,
      created_at: user.createdat,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    sendResponse(500, { error: 'Internal server error' })
  }
}
