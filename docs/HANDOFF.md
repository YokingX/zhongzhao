# 开发交接文档

> 最后更新：2026-07-13  
> 用途：新开会话时粘贴或引用本文，快速恢复上下文。

## 项目概述

北京中考升学指导网站，帮助初三学生及家长查询普高信息、分数线、政策与填报攻略。

- **仓库**：https://github.com/YokingX/zhongzhao
- **本地路径**：`/Users/zhaixiuchen/Dev/ai/zhongzhao`

## 数据架构（核心）

**D1 是唯一数据库**。`schools.json` 仅为构建/种子中间产物，不是运行时数据源。

| 环境 | D1 实例 | 用途 | 写入方式 |
|------|---------|------|----------|
| **本地** | `wrangler --local`（`.wrangler/state/`） | 开发、测试 | `npm run sync:data`、`npm run d1:seed` |
| **线上** | Cloudflare 远程 `zhongzhao-db` | 生产 | Cron `/sync` 抓取更新；全量刷新用 `d1:seed:remote` |

```
抓取源 ──▶ generate:schools ──▶ schools.json（中间产物）
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            本地 D1（测试）                    远程 D1（生产）
            sync:data / d1:seed              Cron /sync 或 d1:seed:remote
                    │                               │
                    ▼                               ▼
            npm run dev（preview）            zhongzhao-web Worker
```

> 写入远程 D1 需 `D1_REMOTE_CONFIRM=1`（`d1:seed:remote` 已内置）。

## 线上环境

| 服务 | URL |
|------|-----|
| 网站 | https://zhongzhao-web.zhaixiuchen.workers.dev |
| 同步 Worker | https://zhongzhao-sync.zhaixiuchen.workers.dev |
| 健康检查 | https://zhongzhao-sync.zhaixiuchen.workers.dev/health |
| 同步日志 | https://zhongzhao-sync.zhaixiuchen.workers.dev/logs |

### Cloudflare 资源

| 资源 | ID / 名称 |
|------|-----------|
| D1 数据库 | `zhongzhao-db` / `e33030b9-7326-43ae-bcd7-5b0a54d2b1be` |

### Cron（UTC，见 `wrangler.sync.jsonc`）

```
0 19 * * SUN       # 北京时间周一 03:00
0 19 * 6,7,8 *     # 中招季每天北京时间次日 03:00
```

## 关键命令

```bash
# 本地开发（读本地 D1）
npm run d1:migrate          # 首次：初始化本地 D1 表结构
npm run sync:data           # 抓取 → JSON → 本地 D1
npm run audit:aliases       # 审计抓取校名与官方库映射缺口
npm run dev                 # OpenNext preview + 本地 D1
npm run dev:build           # 强制重建后启动 dev
npm run d1:stats            # 查看本地 D1 统计

# 生产 D1
npm run d1:stats:remote     # 查看远程 D1 统计
npm run d1:seed:remote      # schools.json 全量刷新远程 D1（需确认）
curl -H "Authorization: Bearer $CRON_SECRET" …/sync   # Cron Worker 增量抓取

# 部署
npm run cf:sync:deploy
npm run deploy

# git push 若 github.com:443 超时，可用 API 推送（需 gh 已登录）
npm run push:gh

# 仅 UI 快速迭代（不连 D1，读 schools.json）
npm run dev:next
```

## 目录结构

```
migrations/0001_init.sql   # D1 表结构
workers/sync/index.ts      # Cron → 远程 D1
scripts/fetch-core.mjs     # 抓取核心（别名见 score-aliases.mjs）
scripts/score-aliases.mjs  # SCORE_ALIASES + FETCH_NAME_ALIASES 统一别名表
scripts/audit-aliases.mjs    # 别名映射缺口审计
scripts/d1-seed.mjs        # schools.json → D1（local / remote）
scripts/dev.mjs            # 本地 preview + 本地 D1
src/db/d1-queries.ts       # D1 查询
src/lib/schools.ts         # 运行时读 D1；构建时读 schools.json
wrangler.jsonc             # 网站 Worker（远程 D1）
wrangler.sync.jsonc        # Sync Worker（远程 D1）
```

## 路线图

- 阶段 0–1 ✅ MVP + Cloudflare 生产化
- 阶段 2 🔄 数据质量（进行中）
  - ✅ `/health` 数据质量指标（校数、分数线、失败源、各源状态）
  - ✅ 别名合并至 `score-aliases.mjs`（`FETCH_NAME_ALIASES`）
  - ✅ `npm run audit:aliases` 审计脚本（当前约 119 校待补别名）
  - ⏳ 外围区 24-25 正式对比页（替换预估源）
- 阶段 3 🎯 产品增强（趋势图、攻略互动）
- 阶段 4 🚀 运营（自定义域名、监控告警）

## 新会话启动提示词

```
继续开发北京中考升学指导网站（zhongzhao）。
请先阅读 docs/HANDOFF.md 和 docs/cloudflare.md。
线上：https://zhongzhao-web.zhaixiuchen.workers.dev
```
