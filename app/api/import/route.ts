import { NextResponse } from 'next/server'
import { ensureReady } from '@/src/lib/db'
import DatabaseCtor from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { ImportPayloadSchema, ImportItemSchema } from '@/src/lib/schema'
import type { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ImportItem = z.infer<typeof ImportItemSchema>

function openDB() {
  const DB_PATH = path.join(process.cwd(), 'data', 'airdrop.db')
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const db = new DatabaseCtor(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

export async function POST(req: Request) {
  ensureReady()
  const json = await req.json()
  const parsed = ImportPayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
  }

  const db = openDB()
  const insertProject = db.prepare(
    `INSERT OR REPLACE INTO projects (id, name, chain, website, twitter) VALUES (@id,@name,@chain,@website,@twitter)`
  )
  const insertAirdrop = db.prepare(
    `INSERT OR REPLACE INTO airdrops (id, project_id, title, status, start_date, end_date, reward, link)
     VALUES (@id,@project_id,@title,@status,@start_date,@end_date,@reward,@link)`
  )
  const insertRisk = db.prepare(
    `INSERT OR REPLACE INTO risk_factors (airdrop_id, sybil_risk, scam_risk, task_risk, kyc_required, notes)
     VALUES (@airdrop_id,@sybil_risk,@scam_risk,@task_risk,@kyc_required,@notes)`
  )

  const tx = db.transaction((items: ImportItem[]) => {
    for (const it of items) {
      insertProject.run(it.project)
      insertAirdrop.run(it.airdrop)
      insertRisk.run(it.risk)
    }
  })

  tx(parsed.data.items)
  return NextResponse.json({ ok: true, count: parsed.data.items.length })
}
