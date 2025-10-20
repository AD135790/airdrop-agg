'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function FilterBar() {
  const router = useRouter()
  const sp = useSearchParams()

  const q       = sp.get('q') ?? ''
  const chain   = sp.get('chain') ?? ''
  const status  = sp.get('status') ?? ''
  const riskMin = Number(sp.get('riskMin') ?? 0)
  const riskMax = Number(sp.get('riskMax') ?? 100)

  const setParam = useCallback((k: string, v?: string) => {
    const p = new URLSearchParams(Array.from(sp.entries()))
    if (!v || v === '') p.delete(k)
    else p.set(k, v)
    router.push('?' + p.toString())
  }, [router, sp, router])

  const setRange = useCallback((min: number, max: number) => {
    const p = new URLSearchParams(Array.from(sp.entries()))
    p.set('riskMin', String(min))
    p.set('riskMax', String(max))
    router.push('?' + p.toString())
  }, [router, sp, router])

  return (
    <div className="mb-4 rounded-2xl border bg-white shadow-sm">
      <div className="grid gap-3 p-4 md:grid-cols-5">
        {/* 关键词 */}
        <input
          className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring"
          placeholder="关键词（项目/活动）"
          defaultValue={q}
          onBlur={(e) => setParam('q', e.currentTarget.value)}
        />

        {/* 链（原生 select，允许空字符串代表“全部”） */}
        <select
          className="h-9 rounded-md border bg-white px-2 text-sm"
          value={chain}
          onChange={(e) => setParam('chain', e.target.value || undefined)}
        >
          <option value="">全部链</option>
          <option value="Solana">Solana</option>
          <option value="Ethereum">Ethereum</option>
          <option value="Multi">Multi</option>
        </select>

        {/* 状态（原生 select） */}
        <select
          className="h-9 rounded-md border bg-white px-2 text-sm"
          value={status}
          onChange={(e) => setParam('status', e.target.value || undefined)}
        >
          <option value="">全部状态</option>
          <option value="live">live</option>
          <option value="upcoming">upcoming</option>
          <option value="ended">ended</option>
        </select>

        {/* 风险最小 */}
        <div className="col-span-1">
          <div className="mb-1 text-xs text-gray-500">风险最小：{riskMin}</div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={riskMin}
            onChange={(e) => setRange(Number(e.target.value), riskMax)}
            className="w-full"
          />
        </div>

        {/* 风险最大 */}
        <div className="col-span-1">
          <div className="mb-1 text-xs text-gray-500">风险最大：{riskMax}</div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={riskMax}
            onChange={(e) => setRange(riskMin, Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
