# 自定义域名

当前默认地址：`https://zhongzhao-web.zhaixiuchen.workers.dev`

## 前置条件

- 域名已接入 Cloudflare（DNS 由 Cloudflare 托管）
- 已登录 `wrangler`（`npx wrangler login`）

## 步骤

### 1. 在 Cloudflare 控制台绑定 Worker

1. 打开 [Workers & Pages](https://dash.cloudflare.com/) → `zhongzhao-web`
2. **Settings** → **Domains & Routes** → **Add** → **Custom Domain**
3. 输入域名，例如 `zhongzhao.example.com` 或 `www.zhongzhao.example.com`
4. 等待 SSL 证书签发（通常数分钟）

Sync Worker（`zhongzhao-sync`）一般保持 `*.workers.dev` 即可，无需对外暴露自定义域名。

### 2. 更新站点 URL（SEO / sitemap）

部署前设置环境变量，使 sitemap、Open Graph、JSON-LD 指向新域名：

```bash
# wrangler.jsonc 中 vars（或在 CI 构建环境设置）
NEXT_PUBLIC_SITE_URL=https://zhongzhao.example.com
```

然后重新构建并部署：

```bash
npm run deploy
```

### 3. 验证

```bash
curl -s https://zhongzhao.example.com/api/health | jq .
curl -s https://zhongzhao.example.com/sitemap.xml | head
npm run health:check
```

设置 `SITE_URL` 后运行健康检查：

```bash
SITE_URL=https://zhongzhao.example.com npm run health:check
```

## 可选：wrangler routes（Zone 路由）

若使用 `example.com/*` 整站路由而非 Custom Domain，可在 `wrangler.jsonc` 增加：

```jsonc
"routes": [
  { "pattern": "zhongzhao.example.com/*", "zone_name": "example.com" }
]
```

Custom Domain 方式更简单，推荐优先使用控制台绑定。

## 监控告警

配置 Sync Worker Webhook（Slack / Discord / 企业微信等）：

```bash
npx wrangler secret put ALERT_WEBHOOK_URL -c wrangler.sync.jsonc
```

同步失败或数据质量降级时，Worker 会向该 URL POST JSON 告警。
