# 开发交接文档

> 最后更新：2026-07-12  
> 用途：新开会话时粘贴或引用本文，快速恢复上下文。

## 项目概述

北京中考升学指导网站，帮助初三学生及家长查询普高信息、分数线、政策与填报攻略。

- **仓库**：https://github.com/YoKingX/zhongzhao.git
- **本地路径**：`/Users/zhaixiuchen/Dev/ai/zhongzhao`

## 线上环境（已部署）

| 服务 | URL | 说明 |
|------|-----|------|
| 网站 | https://zhongzhao-web.zhaixiuchen.workers.dev | OpenNext + Cloudflare Workers |
| 同步 Worker | https://zhongzhao-sync.zhaixiuchen.workers.dev | 抓取分数线写入 D1 |
| 健康检查 | https://zhongzhao-sync.zhaixiuchen.workers.dev/health | 应返回 `{"ok":true,"schools":329}` |

### Cloudflare 资源

| 资源 | ID / 名称 |
|------|-----------|
| D1 数据库 | `zhongzhao-db` / `e33030b9-7326-43ae-bcd7-5b0a54d2b1be` |
| 账户 subdomain | `zhaixiuchen.workers.dev` |
| Sync Worker 版本 | `8c9ce9e7-3ed3-40ab-9ba0-0732157ff77c` |

### Cron 定时（UTC）

```
0 19 * * SUN        # 每周日 19:00 → 北京时间周一 03:00
0 19 * 6,7,8 *      # 6-8 月每天 19:00 → 北京时间次日 03:00
```

配置在 `wrangler.sync.jsonc`。详见 `docs/cloudflare.md`。

### 密钥

- `CRON_SECRET`：已通过 `wrangler secret put` 写入 Sync Worker（值未记录在仓库中）
- 手动同步：`curl -H "Authorization: Bearer $CRON_SECRET" https://zhongzhao-sync.zhaixiuchen.workers.dev/sync`

## 架构

```
Cron Worker (zhongzhao-sync)  ──抓取──▶  D1 (zhongzhao-db)
                                              ▲
Next.js (zhongzhao-web)       ──读取──────────┘
         │
         └── 本地开发回退：JSON (schools.json) + SQLite (data/zhongzhao.db)
```

## 数据规模

- **329** 所普高（市教委 2024 名单）
- **276** 所有分数线记录（575 条 score_lines）
- **16** 个远程抓取源（`scripts/fetch-core.mjs`）
- **132** 校标记「自动抓取更新」

## 关键命令

```bash
# 本地开发
npm run dev

# 全量同步（抓取 + JSON + 本地 SQLite）
npm run sync:data

# D1 种子数据
npm run d1:seed:remote          # 导入远程 D1
npm run d1:migrate              # 本地 D1 迁移

# 部署
npm run cf:sync:deploy          # 部署 Sync Worker + Cron
npm run deploy                  # 构建并部署 Next.js 网站

# 本地测试 Sync Worker
npm run cf:sync:dev
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:8787/sync
```

## 目录结构（新增/重要）

```
migrations/0001_init.sql     # D1 表结构
workers/sync/index.ts        # Cron Worker 入口
scripts/fetch-core.mjs       # 抓取核心（无 fs，Worker 可用）
scripts/fetch-scores.mjs       # CLI 抓取，写 scores-fetched.json
scripts/d1-seed.mjs            # JSON/SQLite → D1 导入
src/db/d1-queries.ts          # 生产 D1 查询
src/db/schema.ts              # Drizzle schema
src/lib/schools.ts            # D1 优先，JSON 回退
wrangler.jsonc                # 网站 Worker 配置
wrangler.sync.jsonc           # Sync Worker + Cron 配置
docs/cloudflare.md            # 部署文档
```

## 本次已完成

- [x] SQLite + Drizzle 本地数据库层
- [x] Cloudflare D1 迁移与种子数据（远程 329 校 / 575 分数线）
- [x] `fetch-core.mjs` 拆分，修复 Worker 中 `import.meta.url` 报错
- [x] Sync Worker 部署 + 正确 Cron 表达式
- [x] Next.js 通过 OpenNext 部署到 Cloudflare Workers
- [x] 网站从 D1 读取数据，线上验证通过

## 待办（下一会话可继续）

### 高优先级

1. **推送 GitHub**：确认 `git push` 成功（此前可能因安全策略需用户批准）
2. **GitHub Actions 密钥**：若用 Actions 作备用同步，配置 `CRON_SECRET` 等 secrets
3. **自定义域名**：绑定自有域名到 `zhongzhao-web` Worker

### 中优先级

4. **扩展抓取源**：丰台、通州、大兴等区 24-25 对比页
5. **D1 为唯一数据源**：考虑去掉 build 时 SQLite 依赖，简化 `prebuild`
6. **Sync 监控**：D1 `sync_logs` 表 + Dashboard 告警

### 低优先级

7. **搜索优化**：学校名模糊搜索、拼音首字母
8. **2026 实时数据**：成绩公布后的分数线更新
9. **Vercel 文档清理**：README 仍提及 Vercel，可改为 Cloudflare 为主

## 已知问题

- OpenNext 构建时有若干 `Failed to copy` 警告（MDX 相关包），但不影响部署
- 首页首次访问偶发 503（冷启动），刷新即可
- `data/zhongzhao.db` 仅本地使用，已 gitignore，不入库

## 新会话启动提示词（可复制）

```
继续开发北京中考升学指导网站（zhongzhao）。
请先阅读 docs/HANDOFF.md 和 docs/cloudflare.md。
线上：https://zhongzhao-web.zhaixiuchen.workers.dev
本地：/Users/zhaixiuchen/Dev/ai/zhongzhao
```
