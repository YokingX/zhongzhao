# 北京中考升学指导

面向北京初三学生及家长的中考升学信息查询与指导平台。

## 功能

- **学校库** — 浏览北京优质高中信息，支持按行政区和类型筛选、拼音首字母搜索
- **分数线查询** — 查询历年录取分数线，支持多维度筛选
- **政策解读** — 详细解读中招政策（校额到校、指标分配、志愿填报等）
- **填报攻略** — 分批次志愿填报指南，含资格自查工具
- **升学日历** — 2026年中考升学关键时间节点

## 技术栈

- Next.js 15 (App Router) + OpenNext（Cloudflare Workers 部署）
- Cloudflare D1（生产 + 本地 `wrangler --local`）
- TypeScript / Tailwind CSS 4 / MDX / Recharts

## 数据同步

| 触发方式 | 说明 |
|---------|------|
| **Cloudflare Cron** | Sync Worker 定时抓取写入远程 D1（见 `wrangler.sync.jsonc`） |
| **手动（本地）** | `npm run sync:data` → 抓取 + JSON + 本地 D1 |
| **手动（远程）** | `curl -H "Authorization: Bearer $CRON_SECRET" …/sync` 或 `npm run d1:seed:remote` |
| **构建前** | `prebuild` 仅执行 `generate:schools`（网站读 D1，JSON 作回退） |

```bash
# 本地全量同步（抓取 + JSON + 本地 D1）
npm run sync:data

# 将 schools.json 导入远程 D1
npm run d1:seed:remote

# 部署
npm run cf:sync:deploy   # Sync Worker + Cron
npm run deploy           # 网站
```

Cloudflare 部署详见 [docs/cloudflare.md](docs/cloudflare.md)，开发交接见 [docs/HANDOFF.md](docs/HANDOFF.md)。

## 快速开始

```bash
npm install
npm run d1:migrate      # 首次：初始化本地 D1
npm run sync:data       # 可选：抓取并填充本地 D1
npm run dev             # 网站（读 JSON 回退；生产读 D1）
```

本地测试 Sync Worker：`npm run cf:sync:dev`

## 部署

```bash
npm run cf:sync:deploy
npm run deploy
npm run d1:seed:remote   # 首次或全量刷新远程 D1
```

## 免责声明

本网站为非官方升学信息参考平台，数据来源于北京教育考试院公开信息，仅供参考，以官方发布为准。非北京教育考试院官方网站。
