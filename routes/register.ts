import { IncomingMessage, ServerResponse } from 'http'
import { db } from '../connectors/shared'

export const registerRoute = async (
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
    const { username, email, password } = await parseRequestBody()

    if (!username || !password || !email) {
      sendResponse(400, { error: 'Missing username, email, or password' })
      return
    }

    const userExists = await db.doesUserExist(username)
    if (userExists) {
      sendResponse(409, { error: 'User already exists' })
      return
    }

    const check = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/
    if (!check.test(password)) {
      sendResponse(409, {
        error: 'Password must contain at least one uppercase letter, number, and be 8 characters long.',
      })
      return
    }

    const userCreated = await db.register(username, email, password)

    if (!userCreated) {
      sendResponse(500, { error: 'User registration failed' })
      return
    }

    sendResponse(200, { message: 'User registered successfully' })
  } catch (error) {
    console.error('Registration error:', error)
    sendResponse(500, { error: 'Internal server error' })
  }
}
