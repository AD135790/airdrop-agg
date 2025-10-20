// app/page.tsx
import Link from 'next/link'
import FilterBar from '@/components/filters/FilterBar'
import { listAirdropsFiltered } from '@/src/lib/db'
export const dynamic = 'force-dynamic'

type Status = 'upcoming' | 'live' | 'ended'
type Sort = 'rank' | 'riskAsc' | 'riskDesc' | 'start' | 'end'
type SearchParams = { [k: string]: string | string[] | undefined }

function riskColor(score: number) {
  if (score <= 30) return 'bg-green-500'
  if (score <= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function pick(sp: SearchParams, k: string): string | undefined {
  const v = sp?.[k]
  return typeof v === 'string' ? v : undefined
}
function isStatus(v: string | undefined): v is Status {
  return v === 'live' || v === 'upcoming' || v === 'ended'
}
function isSort(v: string | undefined): v is Sort {
  return v === 'rank' || v === 'riskAsc' || v === 'riskDesc' || v === 'start' || v === 'end'
}

export default async function Page({ searchParams = {} }: { searchParams?: SearchParams }) {
  const chain = pick(searchParams, 'chain')
  const st = pick(searchParams, 'status')
  const status = isStatus(st) ? st : undefined
  const q = pick(searchParams, 'q')
  const rmin = pick(searchParams, 'riskMin')
  const rmax = pick(searchParams, 'riskMax')
  const srt = pick(searchParams, 'sort')
  const sort: Sort = isSort(srt) ? srt : 'rank'

  const items = listAirdropsFiltered({
    chain,
    status,
    q,
    riskMin: rmin ? Number(rmin) : undefined,
    riskMax: rmax ? Number(rmax) : undefined,
    sort,
  })

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <FilterBar />
      <header className="mb-3">
        <h1 className="text-2xl font-bold">Airdrop 聚合排行 · MVP</h1>
        <p className="text-sm text-gray-500">支持筛选：链 / 状态 / 风险 / 关键词（默认按 rank_score 排序）</p>
      </header>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">项目</th>
              <th className="p-3">链</th>
              <th className="p-3">活动</th>
              <th className="p-3">状态</th>
              <th className="p-3">奖励</th>
              <th className="p-3">风险</th>
              <th className="p-3">链接</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{idx + 1}</td>
                <td className="p-3">{it.project}</td>
                <td className="p-3">{it.chain}</td>
                <td className="p-3">{it.title}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 border text-xs">{it.status}</span>
                </td>
                <td className="p-3">{it.reward ?? '-'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-12 rounded-full ${riskColor(it.risk_score)}`} />
                    <span className="tabular-nums text-xs text-gray-600">{it.risk_score}</span>
                  </div>
                </td>
                <td className="p-3">
                  {it.link ? (
                    <Link className="text-blue-600 hover:underline" href={it.link} target="_blank">
                      详情
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-6 text-xs text-gray-500">
        说明：风险分 = 0.35×女巫 + 0.25×跑路 + 0.20×任务复杂 + 0.20×KYC 强度，0(安全)→100(危险)。
      </footer>
    </main>
  )
}
