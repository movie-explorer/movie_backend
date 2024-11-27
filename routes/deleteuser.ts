import { IncomingMessage, ServerResponse } from 'http'
import { auth, db } from '../connectors/shared'

export const deleteRoute = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
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
  
  if (token) {
    try {
      const encodedUsername = token.split('.')[0]
      username = Buffer.from(encodedUsername, 'base64').toString()
    } catch (error) {
      console.warn('Failed to decode username from Authorization header:', error)
    }
  }
  
  username = username || ''
  if (username === '') {
    sendResponse(400, { error: 'Username is required' })
    return
  }

  await db.deleteUser(username)

  console.log(`User ${username} deleted`)

  sendResponse(200, { message: 'Your user is now deleted' })
}
