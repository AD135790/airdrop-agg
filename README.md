# 🪂 Airdrop Aggregator | 空投聚合与风险评分平台

基于 **Solana** 的空投聚合与风险分析工具，帮助用户发现、筛选、追踪高价值空投，并评估参与风险。

## 状态 / Status
- ✅ 已初始化：Next.js + Tailwind + shadcn/ui
- 🧩 正在搭组件：空投列表、风险色彩（绿→红）
- 🧠 规划：风险评分逻辑 & 链上数据聚合（Devnet）

## 技术栈 / Tech
- Frontend: Next.js 14, Tailwind CSS, shadcn/ui
- Data: SQLite（原型）
- On-chain (planned): Rust + Anchor (Solana)
- Deploy: Vercel (Web), Devnet (Program)

## 黑客松目标 / Hackathon Goals
- 完成：空投排行页、风险评分可视化、我的计划页(MVP)
- 集成：基础链上数据聚合
- 发布：第一个可交互 Demo

## 开发 / Dev
```bash
yarn install
yarn dev
# 生产构建
yarn build && yarn start

