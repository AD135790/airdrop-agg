import { z } from 'zod'


export const ProjectSchema = z.object({
id: z.string(),
name: z.string(),
chain: z.string(),
website: z.string().optional().nullable(),
twitter: z.string().optional().nullable(),
})


export const AirdropSchema = z.object({
id: z.string(),
project_id: z.string(),
title: z.string(),
status: z.enum(['upcoming','live','ended']),
start_date: z.string().optional().nullable(),
end_date: z.string().optional().nullable(),
reward: z.string().optional().nullable(),
link: z.string().optional().nullable(),
})


export const RiskSchema = z.object({
airdrop_id: z.string(),
sybil_risk: z.number().int().min(0).max(100).default(50),
scam_risk: z.number().int().min(0).max(100).default(50),
task_risk: z.number().int().min(0).max(100).default(50),
kyc_required: z.number().int().min(0).max(100).default(0),
notes: z.string().optional().nullable(),
})


export const ImportItemSchema = z.object({
project: ProjectSchema,
airdrop: AirdropSchema,
risk: RiskSchema,
})


export const ImportPayloadSchema = z.object({
items: z.array(ImportItemSchema).min(1),
})


export function riskScoreOf(r: {sybil_risk:number; scam_risk:number; task_risk:number; kyc_required:number}) {
return Math.round(0.35*r.sybil_risk + 0.25*r.scam_risk + 0.20*r.task_risk + 0.20*r.kyc_required)
}