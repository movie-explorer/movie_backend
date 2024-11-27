import { ServerResponse } from 'http'

export const rootRoute = (res: ServerResponse): void => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'Hello World' }))
}
