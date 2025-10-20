import DatabaseCtor from 'better-sqlite3'
import type * as BS3 from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'airdrop.db')
let db: BS3.Database | null = null

function open() {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    db = new DatabaseCtor(DB_PATH)

    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  chain TEXT NOT NULL,
  website TEXT,
  twitter TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS airdrops (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('upcoming','live','ended')),
  start_date TEXT,
  end_date TEXT,
  reward TEXT,
  link TEXT
);

CREATE TABLE IF NOT EXISTS risk_factors (
  airdrop_id TEXT PRIMARY KEY REFERENCES airdrops(id) ON DELETE CASCADE,
  sybil_risk INTEGER DEFAULT 50,
  scam_risk INTEGER DEFAULT 50,
  task_risk INTEGER DEFAULT 50,
  kyc_required INTEGER DEFAULT 0,
  notes TEXT
);
`;

function seed() {
  const c = db!.prepare('SELECT COUNT(*) as c FROM airdrops').get() as { c: number }
  if (c.c > 0) return

  const insertProject = db!.prepare(`INSERT INTO projects (id, name, chain, website, twitter) VALUES (?, ?, ?, ?, ?)`)
  const insertAirdrop = db!.prepare(`INSERT INTO airdrops (id, project_id, title, status, start_date, end_date, reward, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertRisk = db!.prepare(`INSERT INTO risk_factors (airdrop_id, sybil_risk, scam_risk, task_risk, kyc_required, notes) VALUES (?, ?, ?, ?, ?, ?)`)

  const tx = db!.transaction(() => {
    insertProject.run('proj_sol_xyz', 'SOL XYZ', 'Solana', 'https://solxyz.io', 'https://twitter.com/solxyz')
    insertAirdrop.run('ad_sol_xyz_s1', 'proj_sol_xyz', 'Season 1 Early', 'live', '2025-10-01', '2025-12-31', '5% supply', 'https://solxyz.io/airdrop')
    insertRisk.run('ad_sol_xyz_s1', 40, 35, 50, 0, '普通交互，反女巫中等')

    insertProject.run('proj_evm_abc', 'EVM ABC', 'Ethereum', 'https://abc.xyz', 'https://twitter.com/abcxyz')
    insertAirdrop.run('ad_evm_abc_s1', 'proj_evm_abc', 'Quest Round', 'upcoming', '2025-11-01', null, 'Points → TGE', 'https://abc.xyz/airdrop')
    insertRisk.run('ad_evm_abc_s1', 55, 45, 35, 0, '任务较多，反女巫偏高')

    insertProject.run('proj_multi_def', 'MULTI DEF', 'Multi', 'https://def.app', 'https://twitter.com/defapp')
    insertAirdrop.run('ad_multi_def_beta', 'proj_multi_def', 'Beta Incentives', 'ended', '2025-07-01', '2025-09-15', 'OG role', 'https://def.app/beta')
    insertRisk.run('ad_multi_def_beta', 25, 20, 30, 100, '历史活动，KYC 强制')
  })
  tx()
}

export function ensureReady() {
  open()
  db!.exec(SCHEMA)
  seed()
}

export type AirdropItem = {
  id: string
  project: string
  chain: string
  title: string
  status: 'upcoming' | 'live' | 'ended'
  start_date: string | null
  end_date: string | null
  reward: string | null
  link: string | null
  sybil_risk: number
  scam_risk: number
  task_risk: number
  kyc_required: number
  risk_score: number
  rank_score: number
}

export function listAirdrops(): AirdropItem[] {
  ensureReady()
  const rows = db!.prepare(`
    SELECT 
      a.id,
      p.name AS project,
      p.chain AS chain,
      a.title,
      a.status,
      a.start_date,
      a.end_date,
      a.reward,
      a.link,
      rf.sybil_risk,
      rf.scam_risk,
      rf.task_risk,
      rf.kyc_required,
      ROUND(0.35*rf.sybil_risk + 0.25*rf.scam_risk + 0.20*rf.task_risk + 0.20*rf.kyc_required) AS risk_score,
      (100 - (0.35*rf.sybil_risk + 0.25*rf.scam_risk + 0.20*rf.task_risk + 0.20*rf.kyc_required))
        + CASE a.status WHEN 'live' THEN 5 WHEN 'upcoming' THEN 2 ELSE 0 END AS rank_score
    FROM airdrops a
    JOIN projects p ON p.id = a.project_id
    JOIN risk_factors rf ON rf.airdrop_id = a.id
    ORDER BY rank_score DESC
  `).all() as AirdropItem[]
  return rows
}

/** ✅ 唯一且完整的筛选参数类型 */
export type ListOptions = {
  chain?: string
  status?: 'upcoming'|'live'|'ended'
  q?: string
  riskMin?: number
  riskMax?: number
  sort?: 'rank'|'riskAsc'|'riskDesc'|'start'|'end'
}

/** ✅ 带筛选/排序的查询（SQLite 兼容 NULLS LAST 写法） */
export function listAirdropsFiltered(opts: ListOptions = {}): AirdropItem[] {
  ensureReady()
  const where: string[] = []
  const params: Record<string, unknown> = {}

  if (opts.chain) { where.push('p.chain = @chain'); params.chain = opts.chain }
  if (opts.status) { where.push('a.status = @status'); params.status = opts.status }
  if (opts.q) { where.push('(p.name LIKE @q OR a.title LIKE @q)'); params.q = `%${opts.q}%` }
  if (typeof opts.riskMin === 'number') { where.push('rf_calc.risk_score >= @rmin'); params.rmin = opts.riskMin }
  if (typeof opts.riskMax === 'number') { where.push('rf_calc.risk_score <= @rmax'); params.rmax = opts.riskMax }

  const order =
    opts.sort === 'riskAsc'  ? 'rf_calc.risk_score ASC' :
    opts.sort === 'riskDesc' ? 'rf_calc.risk_score DESC' :
    opts.sort === 'start'    ? 'CASE WHEN a.start_date IS NULL THEN 1 ELSE 0 END, a.start_date ASC' :
    opts.sort === 'end'      ? 'CASE WHEN a.end_date IS NULL THEN 1 ELSE 0 END, a.end_date ASC' :
                                'rank_score DESC'

  const sql = `
    WITH rf_calc AS (
      SELECT 
        a.id AS aid,
        ROUND(0.35*rf.sybil_risk + 0.25*rf.scam_risk + 0.20*rf.task_risk + 0.20*rf.kyc_required) AS risk_score,
        (100 - (0.35*rf.sybil_risk + 0.25*rf.scam_risk + 0.20*rf.task_risk + 0.20*rf.kyc_required))
          + CASE a.status WHEN 'live' THEN 5 WHEN 'upcoming' THEN 2 ELSE 0 END AS rank_score
      FROM airdrops a JOIN risk_factors rf ON rf.airdrop_id = a.id
    )
    SELECT 
      a.id,
      p.name AS project,
      p.chain AS chain,
      a.title,
      a.status,
      a.start_date,
      a.end_date,
      a.reward,
      a.link,
      rf.sybil_risk,
      rf.scam_risk,
      rf.task_risk,
      rf.kyc_required,
      rf_calc.risk_score,
      rf_calc.rank_score
    FROM airdrops a
    JOIN projects p ON p.id = a.project_id
    JOIN risk_factors rf ON rf.airdrop_id = a.id
    JOIN rf_calc ON rf_calc.aid = a.id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${order}
  `
  return db!.prepare(sql).all(params) as AirdropItem[]
}
