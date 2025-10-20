import { NextResponse } from 'next/server'
import { ensureReady, listAirdropsFiltered, type ListOptions } from '@/src/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Status = 'upcoming' | 'live' | 'ended'
type Sort = 'rank' | 'riskAsc' | 'riskDesc' | 'start' | 'end'

function parseStatus(v: string | null): Status | undefined {
  const s = v ?? undefined
  return s === 'upcoming' || s === 'live' || s === 'ended' ? s : undefined
}
function parseSort(v: string | null): Sort {
  const s = v ?? 'rank'
  return (['rank', 'riskAsc', 'riskDesc', 'start', 'end'] as const).includes(s as Sort) ? (s as Sort) : 'rank'
}

export async function GET(req: Request) {
  ensureReady()
  const { searchParams } = new URL(req.url)

  const chain = searchParams.get('chain') ?? undefined
  const status = parseStatus(searchParams.get('status'))
  const q = searchParams.get('q') ?? undefined
  const riskMin = searchParams.get('riskMin') ? Number(searchParams.get('riskMin')) : undefined
  const riskMax = searchParams.get('riskMax') ? Number(searchParams.get('riskMax')) : undefined
  const sort = parseSort(searchParams.get('sort'))

  const opts: ListOptions = { chain, status, q, riskMin, riskMax, sort }
  const items = listAirdropsFiltered(opts)
  return NextResponse.json({ items })
}
