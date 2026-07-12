# Cloudflare 部署

## 架构

```
Cron Worker (zhongzhao-sync)  ──定时抓取──▶  D1 数据库 (zhongzhao-db)
                                              ▲
Next.js (zhongzhao-web)      ──读取数据──────┘

本地开发：sync:data → 本地 D1（wrangler --local）；next dev 使用 schools.json 回退
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
# 抓取 + 生成 JSON + 导入本地 D1
npm run sync:data

# 导入到远程 D1（生产）
npm run d1:seed:remote
```

### 4. 部署

```bash
npm run cf:sync:deploy
npm run deploy
```

## 本地开发

```bash
# 网站（JSON 回退，无需 D1 绑定）
npm run dev

# 查看本地 D1 统计
npm run d1:stats

# 测试 Sync Worker + 本地 D1
npm run cf:sync:dev
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:8787/sync
```

## 定时任务

Cloudflare Workers 使用 **5 字段** Cron（全部为 **UTC**）：

| 表达式 | UTC 时间 | 北京时间 | 说明 |
|--------|----------|----------|------|
| `0 19 * * SUN` | 每周日 19:00 | 每周一 03:00 | 常规周同步 |
| `0 19 * 6,7,8 *` | 6–8 月每天 19:00 | 次日 03:00 | 中招季每日同步 |

配置位于 `wrangler.sync.jsonc` 的 `triggers.crons`。

手动触发同步：

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://zhongzhao-sync.zhaixiuchen.workers.dev/sync

# 健康检查（含最近一次同步）
curl https://zhongzhao-sync.zhaixiuchen.workers.dev/health

# 同步日志
curl https://zhongzhao-sync.zhaixiuchen.workers.dev/logs?limit=5
```

## 线上地址

| 服务 | URL |
|------|-----|
| 网站 | https://zhongzhao-web.zhaixiuchen.workers.dev |
| 同步 Worker | https://zhongzhao-sync.zhaixiuchen.workers.dev |
| 健康检查 | https://zhongzhao-sync.zhaixiuchen.workers.dev/health |
| 同步日志 | https://zhongzhao-sync.zhaixiuchen.workers.dev/logs |
