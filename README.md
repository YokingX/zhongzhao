# 北京中考升学指导

面向北京初三学生及家长的中考升学信息查询与指导平台。

## 功能

- **学校库** — 浏览北京优质高中信息，支持按行政区和类型筛选
- **分数线查询** — 查询历年录取分数线，支持多维度筛选
- **政策解读** — 详细解读中招政策（校额到校、指标分配、志愿填报等）
- **填报攻略** — 分批次志愿填报指南，含资格自查工具
- **升学日历** — 2026年中考升学关键时间节点

## 技术栈

- Next.js 15 (App Router) + OpenNext（Cloudflare Workers 部署）
- Cloudflare D1（生产数据库）+ SQLite（本地开发）
- TypeScript / Tailwind CSS 4 / MDX / Recharts

## 自动数据同步

| 触发方式 | 说明 |
|---------|------|
| **Cloudflare Cron** | Sync Worker 定时抓取写入 D1（见 `wrangler.sync.jsonc`） |
| **GitHub Actions** | 每周一 + 中招季每天抓取并提交（备用） |
| **部署前** | `npm run build` 前自动执行 `generate:schools` + `db:import` |
| **手动** | `npm run sync:data` 或调用 Sync Worker `/sync` 端点 |

```bash
# 手动全量同步（抓取远程 + 重新生成 JSON + 本地 SQLite）
npm run sync:data

# 导入远程 D1
npm run d1:seed:remote

# 部署
npm run cf:sync:deploy   # Sync Worker
npm run deploy           # 网站
```

Cloudflare 部署详见 [docs/cloudflare.md](docs/cloudflare.md)，开发交接见 [docs/HANDOFF.md](docs/HANDOFF.md)。

## 数据更新

学校数据基于北京市教委 2024 年招生资格名单，分数线来自公开网传数据及自动抓取。

当前收录 **329 所**普通高中，其中 **276 所**有历年统招分数线。

## 快速开始

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

## 部署

生产环境部署在 **Cloudflare Workers**：

```bash
npm run deploy           # 网站
npm run cf:sync:deploy   # 定时同步 Worker
```

详见 [docs/cloudflare.md](docs/cloudflare.md)。

本地构建：

```bash
npm run build
npm start
```

## 免责声明

本网站为非官方升学信息参考平台，数据来源于北京教育考试院公开信息，仅供参考，以官方发布为准。非北京教育考试院官方网站。
