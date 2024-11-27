import { IncomingMessage, ServerResponse } from 'http'
import { auth } from '../connectors/shared'

export const testRoute = (req: IncomingMessage, res: ServerResponse): void => {
  const sendResponse = (statusCode: number, data: any) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  const token = req.headers.authorization

  if (!token || !auth.isUserLoggedin(token)) {
    sendResponse(401, { error: 'Not logged in' })
    return
  }

  sendResponse(200, { message: 'You are logged in!' })
}
