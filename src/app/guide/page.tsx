"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GuideScoreAdvisor } from "@/components/guide/GuideScoreAdvisor";
import { VolunteerDraft } from "@/components/guide/VolunteerDraft";
import { DataFreshnessBar } from "@/components/layout/DataFreshnessBar";

const batches = [
  {
    id: "early",
    title: "提前招生",
    badge: "第一批次",
    badgeVariant: "default" as const,
    volunteers: "8个志愿，每校1个专业",
    threshold: "贯通项目 ≥380分",
    tips: [
      "含贯通培养项目、艺术体育特长生等",
      "被提前录取后不再参加后续批次",
      "贯通项目适合有明确职业倾向的学生",
      "填报前务必详细了解培养方案",
    ],
  },
  {
    id: "quota",
    title: "指标分配招生",
    badge: "第二批次",
    badgeVariant: "secondary" as const,
    volunteers: "8个志愿，每校2个专业",
    threshold: "≥430分 + 综评B等 + 三年学籍",
    tips: [
      "含校额到校和市级统筹",
      "是校内竞争，关注校内排名",
      "优质高中50%以上计划分配到初中",
      "8个志愿要有冲稳保梯度",
    ],
  },
  {
    id: "unified",
    title: "统一招生",
    badge: "第三批次",
    badgeVariant: "accent" as const,
    volunteers: "12个志愿，每志愿2个专业",
    threshold: "有升学资格即可",
    tips: [
      "最主要的录取批次",
      "按分数优先、遵循志愿顺序录取",
      "12个志愿建议冲3稳4保3兜2",
      "每个志愿可填2个专业",
    ],
  },
];

const eligibilityItems = [
  { id: "graduate", label: "我是应届初中毕业生" },
  { id: "score430", label: "我的预估中考总分 ≥ 430分" },
  { id: "evalB", label: "我的综合素质评价 ≥ B等" },
  { id: "threeYear", label: "我在同一初中有连续三年学籍" },
  { id: "notReturn", label: "我不是回户籍/往届生/外省回京考生" },
];

export default function GuidePage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = eligibilityItems.every((item) => checked[item.id]);
  const checkedCount = eligibilityItems.filter((item) => checked[item.id]).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">志愿填报攻略</h1>
        <p className="text-muted-foreground">
          分批次了解北京中考志愿填报规则，完成资格自查，科学填报志愿。
        </p>
      </div>

      <DataFreshnessBar className="mb-6" />

      <GuideScoreAdvisor />

      <div id="volunteer-draft">
        <VolunteerDraft />
      </div>

      {/* Eligibility Check */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>指标分配资格自查</CardTitle>
          <CardDescription>
            勾选以下各项，检查自己是否符合指标分配招生（校额到校/市级统筹）的填报资格
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eligibilityItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={checked[item.id] || false}
                  onCheckedChange={(value) =>
                    setChecked((prev) => ({ ...prev, [item.id]: value === true }))
                  }
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            {allChecked ? (
              <p className="text-sm font-medium text-green-700">
                恭喜！你符合指标分配招生的填报资格，可以填报校额到校和市级统筹志愿。
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                已满足 {checkedCount}/{eligibilityItems.length} 项条件。
                {checkedCount < eligibilityItems.length && " 如未全部满足，你将无法参加指标分配招生，但仍可通过统一招生报考高中。"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Guides */}
      <h2 className="mb-4 text-2xl font-bold">分批次填报指南</h2>
      <div className="space-y-6">
        {batches.map((batch, index) => (
          <Card key={batch.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant={batch.badgeVariant}>{batch.badge}</Badge>
                <CardTitle>{batch.title}</CardTitle>
              </div>
              <CardDescription>
                {batch.volunteers} · 门槛：{batch.threshold}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {batch.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{index + 1}.{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Common Mistakes */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>常见填报误区</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-bold text-red-500">✕</span>
              <span><strong>全部填报同一层次学校</strong> — 应拉开梯度，确保有保底志愿</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-red-500">✕</span>
              <span><strong>最后一天才填报志愿</strong> — 7月17日17:00截止后不可修改，建议提前准备</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-red-500">✕</span>
              <span><strong>忽视招生简章</strong> — 每所学校的报考条件和专业要求可能不同</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-red-500">✕</span>
              <span><strong>只看分数不看趋势</strong> — 关注近三年分数线的变化趋势</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-red-500">✕</span>
              <span><strong>忽略综合素质评价</strong> — 指标分配硬性要求综评B等</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/scores">查看历年分数线</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/policies">阅读政策解读</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/faq">常见问题</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/compare">学校对比</Link>
        </Button>
      </div>
    </div>
  );
}
