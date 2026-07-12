# 北京中考升学指导

面向北京初三学生及家长的中考升学信息查询与指导平台。

## 功能

- **学校库** — 浏览北京优质高中信息，支持按行政区和类型筛选
- **分数线查询** — 查询历年录取分数线，支持多维度筛选
- **政策解读** — 详细解读中招政策（校额到校、指标分配、志愿填报等）
- **填报攻略** — 分批次志愿填报指南，含资格自查工具
- **升学日历** — 2026年中考升学关键时间节点

## 技术栈

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4
- MDX (政策文章)
- Recharts (分数线趋势图)

## 自动数据同步

网站已配置自动数据更新流水线：

| 触发方式 | 说明 |
|---------|------|
| **部署前** | `npm run build` 前自动执行 `generate:schools` |
| **GitHub Actions** | 每周一 + 中招季（6-8月）每天自动抓取并提交 |
| **手动推送脚本** | 修改 `scripts/score-data.mjs` 后 push 触发同步 |
| **本地开发** | `npm run watch:data` 监听数据文件变动 |

```bash
# 手动全量同步（抓取远程 + 重新生成）
npm run sync:data

# 仅重新生成（不抓取）
npm run generate:schools

# 开发时监听数据变动
npm run watch:data
```

部署到 Vercel 后，GitHub Actions 提交数据更新会自动触发 Vercel 重新部署。

### GitHub 仓库配置

1. 将代码 push 到 GitHub
2. 在 [Vercel](https://vercel.com) 导入该仓库（Git 集成）
3. Actions 会自动运行 `Sync School Data` 工作流

## 数据更新

学校数据基于北京市教委 2024 年招生资格名单，分数线来自公开网传数据整理。

```bash
# 更新 scripts/score-data.mjs 后重新生成
npm run generate:schools
```

当前收录 **329 所**普通高中，其中 **273 所**有历年统招分数线（含 2022-2025 部分年份）。剩余主要为国际学校/双语民办校，通常不公布统一招生分数线。

## 快速开始

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

## 部署

```bash
npm run build
npm start
```

推荐部署到 [Vercel](https://vercel.com)。

## 免责声明

本网站为非官方升学信息参考平台，数据来源于北京教育考试院公开信息，仅供参考，以官方发布为准。非北京教育考试院官方网站。
