# Cloudflare 部署

概念与数据流见 [architecture.md](./architecture.md)。

## 架构

D1（`zhongzhao-db`）是唯一数据库：

| 实例 | 命令标志 | 用途 |
|------|----------|------|
| 本地 D1 | `--local` | 开发、测试（`.wrangler/state/`） |
| 远程 D1 | `--remote` | 生产（线上 Worker 绑定） |

Cron Sync Worker 写入远程 D1，Next.js 网站只读 D1；本地开发走 `sync:data` → 本地 D1 → `npm run dev`。完整数据流与功能地图见 [architecture.md](./architecture.md)。

## 密钥与环境变量

| 变量 | 用途 | 配置方式 |
|------|------|----------|
| `CRON_SECRET` | Sync Worker `/sync` 手动触发鉴权 | `npx wrangler secret put CRON_SECRET -c wrangler.sync.jsonc` |
| `D1_REMOTE_CONFIRM=1` | 写入远程 D1 前必须显式确认，防止误操作 | 执行远程写入脚本时在命令前加前缀（见下方生产维护、分数修复） |
| `ALERT_WEBHOOK_URL` | 可选：同步失败 / 数据降级 Webhook 告警 | `npx wrangler secret put ALERT_WEBHOOK_URL -c wrangler.sync.jsonc` |
| `NEXT_PUBLIC_SITE_URL` / `SITE_URL` | SEO、sitemap、Open Graph；自定义域名见 [custom-domain.md](./custom-domain.md) | 构建 / 部署环境或 `wrangler.jsonc` vars |

本地参考：根目录 [`env.example`](../env.example)（`CRON_SECRET`、`D1_REMOTE_CONFIRM`）。

## 首次设置

```bash
npx wrangler d1 create zhongzhao-db   # 已完成可跳过
npx wrangler secret put CRON_SECRET -c wrangler.sync.jsonc

npm run d1:migrate      # 本地 D1 表结构
npm run sync:data       # 抓取 + 写入本地 D1
npm run d1:seed:remote  # 可选：初始化远程 D1

npm run cf:sync:deploy
npm run deploy
```

## 本地开发

```bash
npm run sync:data    # 填充本地 D1
npm run dev          # preview，绑定本地 D1
npm run d1:stats     # 本地 D1：学校数 / 分数线数
```

`npm run dev:next` 仅用于纯 UI 调试（读 `schools.json`，不连 D1）。

## 生产数据维护

```bash
# 增量：Cron Worker 定时抓取分数线写入远程 D1
curl -H "Authorization: Bearer $CRON_SECRET" https://zhongzhao-sync.zhaixiuchen.workers.dev/sync

# 全量：从 schools.json 刷新远程 D1（需 D1_REMOTE_CONFIRM=1，脚本已内置）
npm run d1:seed:remote

# 查看远程 D1 统计
npm run d1:stats:remote
```

## 检查命令

```bash
npm run health:check   # 线上 / 本地健康巡检
npm run smoke:test     # 关键页面与 API 冒烟测试
```

## 分数修复

无 npm script，按需手动运行（详见 [architecture.md](./architecture.md) 数据质量流程）：

```bash
node scripts/repair-scores.mjs --local
D1_REMOTE_CONFIRM=1 node scripts/repair-scores.mjs --remote
```

## 定时任务（UTC）

| 表达式 | 北京时间 | 说明 |
|--------|----------|------|
| `0 19 * * SUN` | 周一 03:00 | 周同步 |
| `0 19 * 6,7,8 *` | 次日 03:00 | 中招季每日 |

## 线上地址

| 服务 | URL |
|------|-----|
| 网站 | https://zhongzhao-web.zhaixiuchen.workers.dev |
| 网站健康检查 | https://zhongzhao-web.zhaixiuchen.workers.dev/api/health |
| Sync Worker | https://zhongzhao-sync.zhaixiuchen.workers.dev |
| 健康检查 | https://zhongzhao-sync.zhaixiuchen.workers.dev/health |
| 同步日志 | https://zhongzhao-sync.zhaixiuchen.workers.dev/logs |

## 监控与告警

```bash
# 可选：同步失败 / 数据降级时 Webhook 告警
npx wrangler secret put ALERT_WEBHOOK_URL -c wrangler.sync.jsonc
```

自定义域名见 [custom-domain.md](./custom-domain.md)。
