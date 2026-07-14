# 文档整理与路线图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已批准设计，将项目文档拆成模块化真相源，并写出带 P0/P1/P2 日历的 `roadmap.md`（本轮不实现业务功能）。

**Architecture:** 方案 B——`README` 短入口；`HANDOFF` 薄交接；`architecture` 概念与功能地图；`cloudflare` / `custom-domain` 操作与密钥；`roadmap` 基线 + 分层计划。盘点状态仅允许：`已上线` / `文档未记载` / `有风险信号` / `未验证`。

**Tech Stack:** Markdown 文档；对照 `package.json` scripts、`src/app/**` 路由、`scripts/*`、现有 `docs/*`；规格见 `docs/superpowers/specs/2026-07-14-docs-and-roadmap-design.md`。

**Spec:** `docs/superpowers/specs/2026-07-14-docs-and-roadmap-design.md`

---

## File map

| 文件 | 动作 | 职责 |
|------|------|------|
| `docs/architecture.md` | Create | 数据流、运行时读路径、功能地图、目录/脚本职责 |
| `docs/roadmap.md` | Create | 基线说明、缺口盘点、P0/P1/P2、非目标 |
| `docs/HANDOFF.md` | Rewrite（瘦身） | URL、资源 ID、近期变更、高频命令、提示词、链接 |
| `README.md` | Modify | 最短快速开始 + 文档索引；去掉与 HANDOFF 重复的长表 |
| `docs/cloudflare.md` | Modify | 补密钥/`env.example`、smoke、repair 引用；去掉与 architecture 重复的概念长述（改为链接） |
| `docs/custom-domain.md` | Modify（轻量） | 顶部注明绑定状态用 `未验证`；链到 roadmap 运维项 |

---

### Task 1: 盘点表（写入 roadmap 的素材，先落临时清单）

**Files:**
- Create: `docs/superpowers/plans/_inventory-2026-07-14.md`（实现完 Task 6 后删除，或并入 roadmap 附录后删除）

- [ ] **Step 1: 建盘点文件，按四类标签填产品面**

写入至少下列路由（证据：路径存在即 `已上线`；若现行 docs 未提则加 `文档未记载`）：

```markdown
# 盘点 2026-07-14

## 产品

| 能力 | 路径/证据 | 状态 |
|------|-----------|------|
| 首页（含中考/填报倒计时） | `src/app/page.tsx`, `src/lib/zhongkao-schedule.ts` | 已上线；文档未记载（倒计时增强） |
| 学校库 + 行政区筛选 | `src/app/schools/page.tsx`, `src/app/schools/[id]/page.tsx` | 已上线；文档未记载（网格筛选） |
| 分数线 | `src/app/scores/page.tsx` | 已上线；有风险信号（`dea4011` 异常分过滤） |
| 学校对比（最多 3） | `src/app/compare/page.tsx`, `src/lib/compare.ts` | 已上线；文档未记载 |
| 政策 | `src/app/policies/**` | 已上线 |
| 填报攻略 / 估分志愿 | `src/app/guide/page.tsx`, `src/app/guide/suggest/page.tsx` | 已上线 |
| FAQ | `src/app/faq/page.tsx` | 已上线；文档未记载 |
| AI 志愿助手 | `src/app/assist/page.tsx`, `src/app/api/ai/chat/route.ts` | 已上线；文档未记载 |
| 时间线 | `src/app/timeline/page.tsx` | 已上线 |
| 开放页（安卓/微信渠道） | `src/app/open/page.tsx`, `src/lib/in-app-browser.ts` | 已上线；文档未记载 |
| 健康检查 API | `src/app/api/health/route.ts` | 已上线 |
```

- [ ] **Step 2: 补数据面与工程面**

在同一文件追加：

```markdown
## 数据

| 项 | 证据 | 状态 |
|----|------|------|
| D1 唯一运行时库 | `docs/HANDOFF.md`, `wrangler.jsonc` | 已上线 |
| schools.json 中间产物 | `src/data/schools.json`, `scripts/generate-schools.mjs` | 已上线 |
| 别名审计 | `npm run audit:aliases`, `scripts/score-aliases.mjs` | 已上线 |
| 分数校验 | `src/lib/score-validate.ts`, `scripts/score-validate.mjs` | 已上线；有风险信号 |
| 分数修复脚本 | `scripts/repair-scores.mjs`（无 package.json script） | 已上线；文档未记载；有风险信号 |
| Sync Worker | `workers/sync/index.ts`, `wrangler.sync.jsonc` | 已上线 |

## 工程运维

| 项 | 证据 | 状态 |
|----|------|------|
| health:check + Actions | `scripts/health-check.mjs`, `.github/workflows/health.yml` | 已上线 |
| smoke:test | `npm run smoke:test`, `scripts/smoke-test.mjs` | 已上线；文档未记载 |
| 自定义域名实际绑定 | 仅有 `docs/custom-domain.md` 指南 | 未验证 |
| ALERT_WEBHOOK_URL 是否已配置 | 仅文档说明如何 put secret | 未验证 |
```

- [ ] **Step 3: 提交盘点素材**

```bash
git add docs/superpowers/plans/_inventory-2026-07-14.md
git commit -m "docs: add inventory worksheet for docs restructure"
```

---

### Task 2: 新建 `docs/architecture.md`

**Files:**
- Create: `docs/architecture.md`
- Reference: `docs/superpowers/plans/_inventory-2026-07-14.md`

- [ ] **Step 1: 写入完整 architecture 文档**

文件须含以下章节（可微调措辞，不可缺节）：

1. **原则**：D1 是唯一运行时数据库；`schools.json` 仅为构建/种子中间产物  
2. **数据流**（概念图，不写 wrangler 操作命令）：

```text
抓取源 → generate:schools / fetch → schools.json（中间产物）
                ↓
        本地 D1（开发） / 远程 D1（生产）
                ↓
        OpenNext Worker 运行时查询（src/db, src/lib/schools.ts）
```

3. **运行时读路径**：`src/lib/schools.ts` 运行时读 D1；构建时可读 `schools.json`；分数合理性过滤见 `src/lib/score-validate.ts`  
4. **功能地图**：用 Task 1 产品表，每行路由 + 一句话职责（状态列可省略或只保留需注意的 `有风险信号`）  
5. **关键目录**：

```text
migrations/          D1 schema
workers/sync/        Cron 抓取写入远程 D1
scripts/             抓取、种子、审计、health、smoke、repair-scores
src/app/             页面与 API
src/db/              D1 查询
src/lib/             领域逻辑（schools、compare、score-validate、zhongkao-schedule…）
src/data/            中间 JSON / 静态数据
```

6. **脚本职责（概念，命令细节链到 cloudflare / package.json）**：列出 `fetch-core`、`generate-schools`、`d1-seed`、`audit-aliases`、`repair-scores`、`health-check`、`smoke-test` 各一句  
7. **文档导航**：链到 `HANDOFF.md`、`cloudflare.md`、`roadmap.md`、`README.md`

- [ ] **Step 2: 自检**

Run:

```bash
test -f docs/architecture.md && rg -n "功能地图|schools\.json|score-validate|assist|compare|faq" docs/architecture.md
```

Expected: 文件存在；上述关键词均有匹配。

- [ ] **Step 3: 提交**

```bash
git add docs/architecture.md
git commit -m "docs: add architecture overview and feature map"
```

---

### Task 3: 新建 `docs/roadmap.md`

**Files:**
- Create: `docs/roadmap.md`
- Reference: inventory + spec §3

- [ ] **Step 1: 写入 roadmap 全文结构**

必须包含：

```markdown
# 路线图

> 日历锚点（2026-07-14）：P0 ≈ 至 2026-07 末；P1 ≈ 2026 Q3；P2 ≈ 2027 中招季前。
> 影响 2026 季内在用可信度/关键动线的项不得放入 P2。

## 基线已完成

截至约 2026-07-13：阶段 0–4（MVP、Cloudflare 生产化、数据质量、产品增强、运营监控）已完成。
其后已上线但需在文档中对齐的能力见 [architecture.md](./architecture.md)（AI 助手、对比、FAQ、行政区筛选、倒计时增强、分数修复脚本等）。

## 缺口盘点摘要

（从 inventory 压缩 8–15 行表格：项 / 状态 / 建议层级）

## P0（≈ 2026-07 末）

每条格式：
### P0-x 标题
- **目标：** …
- **成功标准：** …
- **触及面：** 产品 | 数据 | 工程
- **依赖：** …

至少包含：
- P0-1 文档体系按设计落地（本轮文档任务；成功标准=设计 §4 checklist）
- P0-2 数据质量流程文档化（异常分规则、`repair-scores` 用法、别名审计例行化说明）— 本轮若只写进 architecture/cloudflare 可标「文档部分」；**实现/跑修复**属后续
- P0-3 运维基线可核对（health/smoke/告警/域名；未核验标 `未验证`）

## P1（2026 Q3）

至少 3 条，覆盖：对比/筛选动线或助手边界；抓取稳定性/可诊断；smoke 扩展或脚本可维护性。每条同样四字段。

## P2（2027 中招季前）

至少 2 条加深项 + 指向非目标。

## 非目标

- 换数据库
- 视觉体系大改
- 公开营销站
- 对外开放完整 API 平台
- 本轮不实现除文档债务外的业务代码

## 附录（可选）

曾用阶段 0–4 勾选清单已归档为「基线」；明细不再维护。
```

- [ ] **Step 2: 自检无禁用状态词、无 TBD**

Run:

```bash
rg -n "半完成|已知坑|TBD|TODO" docs/roadmap.md || true
rg -n "P0-|P1-|P2-|非目标|2026-07|2027" docs/roadmap.md
```

Expected: 第一命令无业务正文命中（或仅出现在「禁止使用」说明里）；第二命令均有命中。

- [ ] **Step 3: 提交**

```bash
git add docs/roadmap.md
git commit -m "docs: add prioritized roadmap P0/P1/P2"
```

---

### Task 4: 瘦身重写 `docs/HANDOFF.md`

**Files:**
- Modify: `docs/HANDOFF.md`（整体重写，保留 URL 与 D1 ID 等事实）

- [ ] **Step 1: 替换为薄交接稿**

目标结构（保留现有正确的 workers.dev URL 与 D1 ID `e33030b9-7326-43ae-bcd7-5b0a54d2b1be`）：

```markdown
# 开发交接文档

> 最后更新：2026-07-14  
> 用途：新开会话快速恢复上下文。详细架构见 [architecture.md](./architecture.md)，下一步见 [roadmap.md](./roadmap.md)，部署操作见 [cloudflare.md](./cloudflare.md)。

## 维护约定
- 命令全集以 `package.json` scripts 为准；本文仅列高频 8–12 条
- 线上 URL / 资源 ID 以本文为准
- 架构与功能地图 → architecture；路线图 → roadmap

## 项目概述
（3–5 行）

## 线上环境
（表格：网站、/api/health、sync、sync /health、/logs — 沿用现 URL）

## Cloudflare 资源
（D1 名称与 ID）

## 近期变更（摘要）
- AI 志愿填报助手（`/assist`）
- FAQ、估分清单与志愿草案
- 学校对比（最多 3）
- 学校库/分数线行政区网格筛选
- 中考与填报倒计时增强
- 异常分数线过滤与 `repair-scores` 修复脚本
（不超过 10 条）

## 高频命令
仅列出例如：
`d1:migrate`, `sync:data`, `dev`, `audit:aliases`, `d1:stats`, `d1:stats:remote`, `d1:seed:remote`, `health:check`, `smoke:test`, `cf:sync:deploy`, `deploy`
每条一行说明；详细步骤链到 cloudflare.md。

## 新会话启动提示词
```
继续开发北京中考升学指导网站（zhongzhao）。
请先阅读 docs/HANDOFF.md、docs/architecture.md、docs/roadmap.md。
线上：https://zhongzhao-web.zhaixiuchen.workers.dev
```
```

**删除：** 旧「路线图阶段 0–4」大段勾选、大段数据架构复制（改为一句 + 链到 architecture）、过长目录树（保留 5–8 行或链到 architecture）。

- [ ] **Step 2: 自检**

Run:

```bash
rg -n "architecture\.md|roadmap\.md|阶段 0|assist|compare" docs/HANDOFF.md
wc -l docs/HANDOFF.md
```

Expected: 有 architecture/roadmap/assist/compare 链接或提及；**不应**再出现完整「阶段 0–4」打勾清单；行数明显少于原文（原文约 150 行，目标 roughly ≤ 100 行）。

- [ ] **Step 3: 提交**

```bash
git add docs/HANDOFF.md
git commit -m "docs: slim HANDOFF into short session handoff"
```

---

### Task 5: 更新 `README.md` 与运维文档

**Files:**
- Modify: `README.md`
- Modify: `docs/cloudflare.md`
- Modify: `docs/custom-domain.md`

- [ ] **Step 1: 更新 README**

保留定位、技术栈、最短快速开始（install / d1:migrate / sync:data / dev）。  
将「常用命令」大表缩为 3–5 条或删除并指向 HANDOFF/cloudflare。  
**必须增加文档索引：**

```markdown
## 文档

| 文档 | 说明 |
|------|------|
| [docs/HANDOFF.md](docs/HANDOFF.md) | 短交接（URL、资源、高频命令） |
| [docs/architecture.md](docs/architecture.md) | 数据流与功能地图 |
| [docs/cloudflare.md](docs/cloudflare.md) | 部署、D1、Cron、监控与密钥 |
| [docs/custom-domain.md](docs/custom-domain.md) | 自定义域名与 SITE_URL |
| [docs/roadmap.md](docs/roadmap.md) | 下一步 P0 / P1 / P2 |
```

- [ ] **Step 2: 校准 cloudflare.md**

- 文首加一句：概念与数据流见 [architecture.md](./architecture.md)  
- 增加 **密钥与环境变量** 小节：指向根目录 `env.example`；说明 `CRON_SECRET`、`D1_REMOTE_CONFIRM`、`ALERT_WEBHOOK_URL`、`NEXT_PUBLIC_SITE_URL` / `SITE_URL` 用途（操作命令写在此，不写在 architecture）  
- 增加 **检查命令**：`npm run health:check`、`npm run smoke:test`  
- 提及 `scripts/repair-scores.mjs` 用于分数回填/修复（注明无 npm script，直接 `node scripts/repair-scores.mjs --help` 或读文件头注释；若脚本无 --help，则写「见脚本内用法注释」——实现时打开脚本确认一行真实调用方式并写入）  
- 删除或缩短与 HANDOFF 重复的「线上地址」大表？**保留**操作向 URL 表（操作手册需要），HANDOFF 也保留（交接需要）——可接受的最小重复；勿再复制数据流 ASCII 长文，改为链接 architecture

- [ ] **Step 3: 轻改 custom-domain.md**

文首增加：

```markdown
> 当前是否已在 Cloudflare 控制台绑定自定义域名：**未验证**（以控制台为准）。本页仅操作指南。
```

并链到 `roadmap.md` 中对应 P0 运维核对项（若有标题锚点则用锚点）。

- [ ] **Step 4: 提交**

```bash
git add README.md docs/cloudflare.md docs/custom-domain.md
git commit -m "docs: index README and align ops guides with architecture"
```

---

### Task 6: 规格完成标准自检 + 清理临时盘点

**Files:**
- Delete: `docs/superpowers/plans/_inventory-2026-07-14.md`（内容已并入 roadmap / architecture）
- Verify: 全部 docs

- [ ] **Step 1: 对照设计 §4 checklist 逐项验证**

Run:

```bash
# README 索引
rg -n "HANDOFF|architecture|cloudflare|roadmap|custom-domain" README.md

# HANDOFF：URL、命令、双链接
rg -n "workers\.dev|architecture\.md|roadmap\.md|npm run" docs/HANDOFF.md

# architecture：数据流 + post-阶段4 能力
rg -n "D1|功能地图|assist|compare|faq" docs/architecture.md

# roadmap：日历与层级
rg -n "2026-07|P0|P1|P2|非目标" docs/roadmap.md

# 禁用主观状态
rg -n "半完成|已知坑" docs/*.md README.md || true
```

Expected: 前四组均有命中；「半完成|已知坑」无命中（或仅出现在「禁止使用」说明）。

手动确认：

- [ ] HANDOFF 至少 5 个线上相关 URL（或注明未使用）  
- [ ] HANDOFF 至少 3 条启动/同步相关命令  
- [ ] 旧阶段 0–4 打勾清单已从 HANDOFF 移除  

- [ ] **Step 2: 删除临时盘点文件并提交**

```bash
git rm docs/superpowers/plans/_inventory-2026-07-14.md
git commit -m "docs: finish docs restructure checklist and drop inventory worksheet"
```

- [ ] **Step 3: 最终 status**

```bash
git status -sb
git log --oneline -8
```

Expected: 文档相关提交齐全；无未提交的 docs 改动（`src/data/schools.json` 等无关脏文件不要纳入本计划提交）。

---

## Spec coverage（计划自检）

| Spec 要求 | Task |
|-----------|------|
| §1 文件职责与真相源 | Task 2–5 |
| §1 重叠硬规则 / secrets 归 cloudflare | Task 5 Step 2 |
| §2 盘点四类状态标签 | Task 1 |
| §2 旧阶段压缩 | Task 3、4 |
| §3 P0/P1/P2 日历与主题 | Task 3 |
| §3 本轮只出文档+路线图 | 全计划无业务代码任务 |
| §4 落地顺序与完成标准 | Task 1→6 顺序；Task 6 checklist |

## Placeholder scan

计划内步骤均为可执行命令或须写入的章节/表格模板；无 TBD/TODO 实现洞。`repair-scores` 调用方式要求实现时打开脚本确认一行——属调研一步，非占位。
