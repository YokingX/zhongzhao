# 开发交接文档

> 最后更新：2026-07-14  
> 用途：新开会话时粘贴或引用本文，快速恢复上下文。  
> 架构与数据流 → [architecture.md](./architecture.md) · 优化计划 → [roadmap.md](./roadmap.md) · 部署与 D1 操作 → [cloudflare.md](./cloudflare.md)

## 维护约定

- **`package.json` 是 npm 脚本唯一真相**；本文只列 8–12 条高频命令，完整对照见 `package.json`。
- **线上 URL 与 Cloudflare 资源 ID 以本文为准**；Cron、密钥、首次部署步骤见 [cloudflare.md](./cloudflare.md)。
- **架构与目录** → [architecture.md](./architecture.md)；**下一步优化** → [roadmap.md](./roadmap.md)。
- 数据原则：D1 是唯一运行时数据库；`schools.json` 仅为构建/种子中间产物（详见 architecture）。

## 项目概述

北京中考升学指导网站，帮助初三学生及家长查询普高信息、分数线、政策与填报攻略。

- **仓库**：[https://github.com/YokingX/zhongzhao](https://github.com/YokingX/zhongzhao)（本地自行 clone）
- **技术栈**：Next.js 15 + OpenNext on Cloudflare Workers + D1

## 线上环境

| 服务 | URL |
|------|-----|
| 网站 | [https://zhongzhao-web.zhaixiuchen.workers.dev](https://zhongzhao-web.zhaixiuchen.workers.dev) |
| 网站健康检查 | [https://zhongzhao-web.zhaixiuchen.workers.dev/api/health](https://zhongzhao-web.zhaixiuchen.workers.dev/api/health) |
| 同步 Worker | [https://zhongzhao-sync.zhaixiuchen.workers.dev](https://zhongzhao-sync.zhaixiuchen.workers.dev) |
| Sync 健康检查 | [https://zhongzhao-sync.zhaixiuchen.workers.dev/health](https://zhongzhao-sync.zhaixiuchen.workers.dev/health) |
| 同步日志 | [https://zhongzhao-sync.zhaixiuchen.workers.dev/logs](https://zhongzhao-sync.zhaixiuchen.workers.dev/logs) |

## Cloudflare 资源

| 资源 | ID / 名称 |
|------|-----------|
| D1 数据库 | `zhongzhao-db` / `e33030b9-7326-43ae-bcd7-5b0a54d2b1be` |

## 近期变更

- AI 志愿助手 `/assist` + `/api/ai/chat` 已上线
- FAQ 常见问题页 `/faq` 已上线
- 学校对比 `/compare`（最多 3 校并排）已上线
- 学校库行政区网格筛选 `/schools` 已上线
- 首页中考/填报倒计时增强已上线
- 分数线异常分过滤：`score-validate` 统一校验口径
- 分数修复脚本 `scripts/repair-scores.mjs`（无 npm script，按需手动运行）
- 冒烟测试 `npm run smoke:test` 已加入 package.json
- 阶段 0–4 基线已于 2026-07-13 完成部署（详情见 [roadmap.md](./roadmap.md)）

## 高频命令

```bash
npm run d1:migrate        # 首次：初始化本地 D1 表结构
npm run sync:data         # 抓取 → JSON → 本地 D1
npm run dev               # OpenNext preview + 本地 D1
npm run audit:aliases     # 审计抓取校名与官方库别名映射缺口
npm run d1:stats          # 查看本地 D1 统计
npm run d1:stats:remote   # 查看远程 D1 统计
npm run d1:seed:remote    # schools.json 全量刷新远程 D1（需 D1_REMOTE_CONFIRM=1）
npm run health:check      # 检查线上站点与 Sync Worker 健康
npm run smoke:test        # 关键页面与 API 冒烟测试
npm run cf:sync:deploy    # 部署 Sync Worker
npm run deploy            # 构建并部署网站 Worker
```

更多命令（`dev:build`、`d1:seed`、`cf:sync:dev` 等）见 `package.json` 与 [cloudflare.md](./cloudflare.md)。

## 新会话启动提示词

```
继续开发北京中考升学指导网站（zhongzhao）。
请先阅读 docs/HANDOFF.md、docs/architecture.md 和 docs/roadmap.md；部署与 D1 操作见 docs/cloudflare.md。
线上：https://zhongzhao-web.zhaixiuchen.workers.dev
```
