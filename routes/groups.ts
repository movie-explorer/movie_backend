import { IncomingMessage, ServerResponse } from 'http'
import { db } from '../connectors/shared'

export const groupsRoute = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const sendResponse = (statusCode: number, data: any) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  const { method } = req
  const authHeader = req.headers['authorization']
  let username = ''
  
  if (authHeader) {
    try {
      const encodedUsername = authHeader.split('.')[0]
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

  if (method === 'POST') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', async () => {
      try {
        const { groupName } = JSON.parse(body)
        if (!groupName) {
          sendResponse(400, { error: 'Group name is required' })
          return
        }

        const success = await db.createGroup(groupName, username)
        if (success) {
          sendResponse(200, { message: 'Group created successfully' })
        } else {
          sendResponse(500, { error: 'Failed to create group' })
        }
      } catch (error) {
        sendResponse(500, { error: 'Internal server error' })
      }
    })
  } else if (method === 'GET') {
    try {
      const groups = await db.getUserGroups(username)
      sendResponse(200, { groups })
    } catch (error) {
      sendResponse(500, { error: 'Internal server error' })
    }
  } else {
    sendResponse(405, { error: 'Method not allowed' })
  }
}
