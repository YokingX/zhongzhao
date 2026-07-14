# 系统架构

> 概念与数据流向说明。部署、Cron、密钥等操作见 [cloudflare.md](./cloudflare.md)。

## 原则

Cloudflare D1 是**唯一运行时数据库**。`src/data/schools.json` 由抓取与生成脚本产出，仅作为构建静态路径与种子写入的中间产物，不作为线上查询数据源。

## 数据流

```text
抓取源 → generate:schools / fetch → schools.json（中间产物）
                ↓
        本地 D1（开发） / 远程 D1（生产）
                ↓
        OpenNext Worker 运行时查询（src/db, src/lib/schools.ts）
```

- **本地 D1**：开发、测试时由种子脚本写入，Worker 预览绑定本地实例。
- **远程 D1**：生产环境唯一数据源；Sync Worker 定时抓取增量更新，全量刷新走种子脚本。
- **schools.json**：贯穿抓取→生成→种子的中间产物，构建阶段可读，运行时以 D1 为准。

## 运行时读路径

| 阶段 | 数据源 | 入口 |
|------|--------|------|
| **运行时** | D1 | `src/lib/schools.ts` 经 `src/db/` 按需 SQL 查询学校与分数线 |
| **构建时** | `schools.json` | `src/lib/schools.ts` 用于 SSG 静态路径生成（`generateStaticParams` 等） |
| **分数过滤** | 领域规则 | `src/lib/score-validate.ts` 校验分数线合理性，异常分数在展示层过滤 |

`npm run dev:next` 纯 UI 调试时可直接读 `schools.json`，不连 D1；常规开发应使用 `npm run dev`（绑定本地 D1）。

## 功能地图

| 路由 | 职责 |
|------|------|
| `/` | 首页：中考与填报倒计时、快捷入口 |
| `/schools` | 学校库列表，支持行政区网格筛选 |
| `/schools/[id]` | 单校详情：批次、分数线、基本信息 |
| `/scores` | 多校分数线查询与图表（**有风险信号**：异常分经 `score-validate` 过滤） |
| `/compare` | 学校对比，最多选择 3 所并排查看 |
| `/policies` | 招生政策浏览（MDX） |
| `/guide` | 填报攻略与流程说明 |
| `/guide/suggest` | 估分志愿建议 |
| `/faq` | 常见问题解答 |
| `/assist` | AI 志愿助手对话界面 |
| `/api/ai/chat` | AI 助手后端 API |
| `/timeline` | 中招关键时间节点 |
| `/open` | 开放页：安卓/微信等渠道引导 |
| `/api/health` | 站点健康检查 API |

## 关键目录

```text
migrations/          D1 schema
workers/sync/        Cron 抓取写入远程 D1
scripts/             抓取、种子、审计、health、smoke、repair-scores
src/app/             页面与 API
src/db/              D1 查询
src/lib/             领域逻辑（schools、compare、score-validate、zhongkao-schedule…）
src/data/            中间 JSON / 静态数据
```

## 脚本职责

以下为 `scripts/` 下核心脚本的概念说明；npm 命令对照见 `package.json`，可执行步骤见 [cloudflare.md](./cloudflare.md)。

| 脚本 | 职责 |
|------|------|
| `fetch-core.mjs` | 共享抓取核心（Worker 与本地脚本共用），解析各区分数线页面 |
| `generate-schools.mjs` | 聚合抓取结果，生成 `schools.json` 中间产物 |
| `d1-seed.mjs` | 将 `schools.json` 全量写入 D1（本地或远程） |
| `audit-aliases.mjs` | 审计抓取校名与官方库别名映射缺口 |
| `repair-scores.mjs` | 修复已入库的异常分数线数据 |
| `health-check.mjs` | 检查线上站点与 Sync Worker 健康状态 |
| `smoke-test.mjs` | 关键页面与 API 的冒烟测试 |

## 文档导航

| 文档 | 内容 |
|------|------|
| [HANDOFF.md](./HANDOFF.md) | 短交接：线上 URL、资源 ID、近期变更、高频命令 |
| [cloudflare.md](./cloudflare.md) | 部署、本地/远程 D1、Cron、监控告警与密钥 |
| [roadmap.md](./roadmap.md) | 基线完成说明与 P0/P1/P2 优化计划 |
| [README.md](../README.md) | 项目入口、技术栈与快速开始 |
