import type { IncomingMessage, ServerResponse } from 'node:http'
import { processAssistantRequest } from '../src/assistantCore.ts'

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }))
    return
  }

  try {
    let body: any = req.body

    // If body was not already pre-parsed by the Vercel Node runtime
    if (!body || typeof body !== 'object') {
      const chunks: Buffer[] = []
      let byteCount = 0
      const MAX_BYTES = 64 * 1024

      for await (const chunk of req) {
        byteCount += chunk.length
        if (byteCount > MAX_BYTES) {
          res.statusCode = 413
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Payload too large. Maximum 64KB.' }))
          return
        }
        chunks.push(chunk)
      }

      const raw = Buffer.concat(chunks).toString('utf8')
      body = raw ? JSON.parse(raw) : {}
    }

    const apiKey = process.env.GEMINI_API_KEY
    const result = await processAssistantRequest(body, apiKey)

    res.statusCode = result.status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result.data))
  } catch (err: any) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err?.message || 'Server error processing request.' }))
  }
}
