import { IncomingMessage, ServerResponse } from 'http'
import { db } from '../connectors/shared'

export const followersRoute = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const sendResponse = (statusCode: number, data: any) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  const { method } = req
  const followerUsername = req.headers['username']?.toString()

  if (!followerUsername) {
    sendResponse(400, { error: 'Username is required' })
    return
  }

  if (method === 'POST') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', async () => {
      try {
        const { followedUsername } = JSON.parse(body)
        if (!followedUsername) {
          sendResponse(400, { error: 'Followed username is required' })
          return
        }

        const success = await db.followUser(followerUsername, followedUsername)
        if (success) {
          sendResponse(200, { message: `You are now following ${followedUsername}` })
        } else {
          sendResponse(500, { error: 'Failed to follow user' })
        }
      } catch (error) {
        sendResponse(500, { error: 'Internal server error' })
      }
    })
  } else if (method === 'DELETE') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', async () => {
      try {
        const { followedUsername } = JSON.parse(body)
        if (!followedUsername) {
          sendResponse(400, { error: 'Followed username is required' })
          return
        }

        const success = await db.unfollowUser(followerUsername, followedUsername)
        if (success) {
          sendResponse(200, { message: `You have unfollowed ${followedUsername}` })
        } else {
          sendResponse(500, { error: 'Failed to unfollow user' })
        }
      } catch (error) {
        sendResponse(500, { error: 'Internal server error' })
      }
    })
  } else {
    sendResponse(405, { error: 'Method not allowed' })
  }
}
