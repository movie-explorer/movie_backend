import { IncomingMessage, ServerResponse } from 'http'
import { db, auth } from '../connectors/shared'

export const loginRoute = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  const sendResponse = (statusCode: number, data: any) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  const parseRequestBody = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', chunk => (body += chunk))
      req.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  try {
    const { username, password } = await parseRequestBody()

    if (!username || !password) {
      sendResponse(400, { error: 'Missing username or password' })
      return
    }

    const loggedIn = await db.login(username, password)

    if (!loggedIn) {
      sendResponse(401, { error: 'Invalid credentials' })
      return
    }

    const authToken = auth.setLoggedIn(username)
    console.log(`User ${username} logged in`)
    sendResponse(200, { message: 'Logged in successfully', token: authToken })
  } catch (error) {
    console.error('Login error:', error)
    sendResponse(500, { error: 'Internal server error' })
  }
}
