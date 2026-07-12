# Cloudflare 部署

## 架构

```
Cron Worker (zhongzhao-sync)  ──定时抓取──▶  D1 数据库 (zhongzhao-db)
                                              ▲
Next.js (zhongzhao-web)      ──读取数据──────┘
```

## 首次设置

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create zhongzhao-db
```

将返回的 `database_id` 填入 `wrangler.jsonc` 和 `wrangler.sync.jsonc` 中的 `database_id` 字段。

### 2. 设置密钥

```bash
npx wrangler secret put CRON_SECRET -c wrangler.sync.jsonc
```

### 3. 同步并导入数据

```bash
# 抓取 + 生成 JSON + 本地 SQLite
npm run sync:data

# 导入到本地 D1（开发）
npm run d1:seed

# 导入到远程 D1（生产）
npm run d1:seed:remote
```

### 4. 部署

```bash
# 部署定时抓取 Worker
npm run cf:sync:deploy

# 部署 Next.js 网站（OpenNext + Cloudflare Workers）
npm run deploy
```

## 本地开发

```bash
# 网站（JSON/SQLite 回退）
npm run dev

# 测试 Cron Worker + 本地 D1
npm run cf:sync:dev

# 手动触发同步
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:8787/sync
```

## 定时任务

Cloudflare Workers 使用 **5 字段** Cron（全部为 **UTC**）：

```
分(0-59)  时(0-23)  日(1-31)  月(1-12)  周(1-7 或 SUN-SAT)
```

| 表达式 | UTC 时间 | 北京时间 | 说明 |
|--------|----------|----------|------|
| `0 19 * * SUN` | 每周日 19:00 | 每周一 03:00 | 常规周同步 |
| `0 19 * 6,7,8 *` | 6–8 月每天 19:00 | 次日 03:00 | 中招季每日同步 |

> **常见错误**：`0 19 1-31 6,7,8 *` 有 6 个字段，Cloudflare 不支持。  
> 限定月份应写在第 4 字段（月），日字段用 `*`：`0 19 * 6,7,8 *`。  
> 周日请用 `SUN` 或 `1`，不要用 `0`（Cloudflare 周日为 1，不是 Unix 风格的 0）。

配置位于 `wrangler.sync.jsonc` 的 `triggers.crons`。若 CLI 部署 Cron 返回 403，可在 Dashboard → Workers → zhongzhao-sync → Triggers 中粘贴上表表达式。

也可通过 GitHub Actions（`.github/workflows/sync-school-data.yml`）或手动调用：

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://zhongzhao-sync.zhaixiuchen.workers.dev/sync
```

## 线上地址

| 服务 | URL |
|------|-----|
| 网站 | https://zhongzhao-web.zhaixiuchen.workers.dev |
| 同步 Worker 健康检查 | https://zhongzhao-sync.zhaixiuchen.workers.dev/health |
