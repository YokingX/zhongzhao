# 开发交接文档

> 最后更新：2026-07-12（阶段 1 完成）  
> 用途：新开会话时粘贴或引用本文，快速恢复上下文。

## 项目概述

北京中考升学指导网站，帮助初三学生及家长查询普高信息、分数线、政策与填报攻略。

- **仓库**：https://github.com/YoKingX/zhongzhao.git
- **本地路径**：`/Users/zhaixiuchen/Dev/ai/zhongzhao`

## 线上环境

| 服务 | URL | 说明 |
|------|-----|------|
| 网站 | https://zhongzhao-web.zhaixiuchen.workers.dev | OpenNext + Cloudflare Workers |
| 同步 Worker | https://zhongzhao-sync.zhaixiuchen.workers.dev | 抓取分数线写入 D1 |
| 健康检查 | https://zhongzhao-sync.zhaixiuchen.workers.dev/health | 含 `lastSync` |
| 同步日志 | https://zhongzhao-sync.zhaixiuchen.workers.dev/logs | 最近 `sync_logs` |

### Cloudflare 资源

| 资源 | ID / 名称 |
|------|-----------|
| D1 数据库 | `zhongzhao-db` / `e33030b9-7326-43ae-bcd7-5b0a54d2b1be` |
| 账户 subdomain | `zhaixiuchen.workers.dev` |

### Cron 定时（UTC）

```
0 19 * * SUN        # 每周日 19:00 → 北京时间周一 03:00
0 19 * 6,7,8 *      # 6-8 月每天 19:00 → 北京时间次日 03:00
```

配置在 `wrangler.sync.jsonc`。详见 `docs/cloudflare.md`。

### 密钥

- `CRON_SECRET`：已通过 `wrangler secret put` 写入 Sync Worker
- 手动同步：`curl -H "Authorization: Bearer $CRON_SECRET" https://zhongzhao-sync.zhaixiuchen.workers.dev/sync`

## 架构

```
Cron Worker (zhongzhao-sync)  ──抓取──▶  D1 (zhongzhao-db) 远程
                                              ▲
Next.js (zhongzhao-web)       ──读取──────────┘
         │
         └── 本地：next dev 读 schools.json；sync:data 写本地 D1（wrangler --local）
```

**已移除**：SQLite（better-sqlite3）、GitHub Actions 定时同步、Vercel 配置。

## 数据规模

- **329** 所普高（市教委 2024 名单）
- **19** 个远程抓取源（`scripts/fetch-core.mjs`）

## 关键命令

```bash
npm run dev                 # 网站（JSON 回退）
npm run sync:data           # 抓取 + JSON + 本地 D1
npm run d1:seed:remote      # schools.json → 远程 D1
npm run d1:stats            # 本地 D1 统计
npm run cf:sync:deploy        # 部署 Sync Worker
npm run deploy                # 部署网站
npm run cf:sync:dev           # 本地 Sync Worker
```

## 目录结构（重要）

```
migrations/0001_init.sql     # D1 表结构
workers/sync/index.ts        # Cron Worker 入口
scripts/fetch-core.mjs       # 抓取核心（Worker 可用）
scripts/d1-seed.mjs          # schools.json → D1
src/db/d1-queries.ts         # 生产 D1 查询
src/db/schema.ts             # Drizzle schema（类型定义）
src/lib/schools.ts           # D1 优先，JSON 回退
src/lib/pinyin.ts            # 拼音首字母搜索
wrangler.jsonc               # 网站 Worker
wrangler.sync.jsonc          # Sync Worker + Cron
```

## 路线图状态

### 阶段 0 — MVP ✅

### 阶段 1 — 生产化 ✅

- [x] 扩展抓取源至 19 个（东城 24-25、丰台 2025、外围区预估）
- [x] 拼音首字母搜索
- [x] Sync `/logs` + `/health` 增强
- [x] 移除 SQLite，统一 D1（本地 wrangler --local）
- [x] 移除 GitHub Actions Cron
- [x] 部署 Cloudflare（Sync + 网站）

### 阶段 2 — 数据质量（下一步）

- [ ] 外围区 24-25 正式对比页（带区排名）
- [ ] 学校别名治理
- [ ] `/health` 数据质量指标

### 阶段 3 — 产品增强

- [ ] 学校详情分数线趋势图
- [ ] 填报攻略互动
- [ ] SEO 优化

### 阶段 4 — 运营

- [ ] 自定义域名
- [ ] Sync 监控告警
- [ ] 2026 成绩公布后实时更新

## 已知问题

- OpenNext 构建 MDX `Failed to copy` 警告（不影响部署）
- 首页冷启动偶发 503
- 外围区部分学校预估源无区排名

## 新会话启动提示词

```
继续开发北京中考升学指导网站（zhongzhao）。
请先阅读 docs/HANDOFF.md 和 docs/cloudflare.md。
线上：https://zhongzhao-web.zhaixiuchen.workers.dev
```
