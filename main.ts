import { createServer, IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import { router } from './routes/routes'
const port = 3000

const handleCors = (res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

const serverHandler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = parse(req.url || '', true)
  const handled = await router(req, res, url.pathname || '')

  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
  }
}

createServer(serverHandler).listen(port, () => {
  console.log(`Server running on port ${port}`)
})
