import { NextResponse } from 'next/server'

const cache = new Map<string, { timestamp: number; data: any }>()
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json([], { status: 200 })

  const limit = searchParams.get('limit') || '5'
  const countrycodes = searchParams.get('countrycodes') || ''

  const cacheKey = `${q}|${limit}|${countrycodes}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    q
  )}&limit=${limit}${countrycodes ? `&countrycodes=${countrycodes}` : ''}`

  const res = await fetch(nominatimUrl, {
    headers: {
      'User-Agent': 'project-boss/1.0 (contact: bossappofficial1@gmail.com)',
      Accept: 'application/json'
    }
  })

  if (!res.ok) {
    // forward status, but avoid leaking remote body directly
    return NextResponse.json([], { status: res.status })
  }

  const data = await res.json()
  cache.set(cacheKey, { timestamp: Date.now(), data })
  return NextResponse.json(data)
}
