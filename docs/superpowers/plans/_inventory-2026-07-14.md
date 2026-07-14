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
