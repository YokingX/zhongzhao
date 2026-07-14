# 北京中考升学指导

面向北京初三学生及家长的中考升学信息查询与指导平台。

## 技术栈

- Next.js 15 + OpenNext（Cloudflare Workers）
- **Cloudflare D1**（唯一数据库：本地 D1 测试 / 远程 D1 生产）
- TypeScript / Tailwind CSS 4 / MDX / Recharts

## 数据流

抓取 → `schools.json`（中间产物）→ D1（本地开发 / 远程生产）。详见 [docs/architecture.md](docs/architecture.md)。

## 快速开始

```bash
npm install
npm run d1:migrate     # 首次：本地 D1 表结构
npm run sync:data      # 抓取并写入本地 D1
npm run dev            # 本地预览（绑定本地 D1）
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run sync:data` | 抓取 → JSON → **本地 D1** |
| `npm run d1:seed:remote` | schools.json → **远程 D1（生产）** |
| `npm run deploy` | 部署网站到 Cloudflare |

完整脚本对照见 `package.json`；部署、D1、Cron 与监控见 [docs/cloudflare.md](docs/cloudflare.md)、[docs/HANDOFF.md](docs/HANDOFF.md)。

## 文档

| 文档 | 说明 |
|------|------|
| [docs/HANDOFF.md](docs/HANDOFF.md) | 短交接（URL、资源、高频命令） |
| [docs/architecture.md](docs/architecture.md) | 数据流与功能地图 |
| [docs/cloudflare.md](docs/cloudflare.md) | 部署、D1、Cron、监控与密钥 |
| [docs/custom-domain.md](docs/custom-domain.md) | 自定义域名与 SITE_URL |
| [docs/roadmap.md](docs/roadmap.md) | 下一步 P0 / P1 / P2 |

## 免责声明

本网站为非官方升学信息参考平台，数据仅供参考，以北京教育考试院官方发布为准。
