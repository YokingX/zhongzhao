import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { ShareLinkButton } from "@/components/layout/ShareLinkButton";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "常见问题 FAQ",
  description: "北京中考分数线怎么比、区排名、志愿填报与本站使用说明。",
};

const faqs = [
  {
    q: "2025 年 510 分和 2024 年 670 分能直接比吗？",
    a: "不能直接比较绝对分值。2025 年起中考满分由 670 调整为 510。跨年请优先看区排名或同一年度分数，本站趋势图也作了相应提示。",
  },
  {
    q: "为什么建议看区排名而不只看分数？",
    a: "各区考生人数、难度与录取结构不同，同分在不同区竞争强度不同。区排名更能反映相对位置，尤其适合跨年或跨区分参考。可用「估分看区排」做粗估，正式排名以考试院为准。",
  },
  {
    q: "统招线、校额到校、提前招生有什么区别？",
    a: "提前招生为第一批次（含贯通等），录取后不再参加后续；指标分配（校额到校/市级统筹）有分数与学籍/综评等条件；统一招生是最主要的普通高中录取批次，志愿最多。详见填报攻略与政策解读。",
  },
  {
    q: "本站有校额到校/提前批分数线吗？",
    a: "结构化校线目前以统一招生为主。校额到校、提前批请以当年简章与官方系统为准；站内政策解读与 FAQ 可帮你理解规则，但不要把空的批次筛选结果当成「没有学校」。",
  },
  {
    q: "本站分数线是官方数据吗？",
    a: "不是。本站为非官方参考平台，分数线多来自公开信息与网传统招数据交叉整理，仅供参考。报名资格、分数线请以北京教育考试院当年正式发布为准。详见「数据说明」。",
  },
  {
    q: "微信里打不开网站怎么办？",
    a: "点右上角「…」→「在浏览器中打开」，推荐系统浏览器或 Chrome。也可打开本站「手机访问指南」复制链接到浏览器粘贴。",
  },
  {
    q: "学校对比最多几所？志愿草案会上传吗？",
    a: "学校对比最多 3 所。志愿草案支持统招/指标/提前三套本地草稿，仅保存在你手机/电脑的浏览器本地，不会上传。清除浏览器数据会丢失草案。",
  },
  {
    q: "估分助手给出的学校清单可靠吗？",
    a: "仅按近年统招最低线区间做匹配参考，不考虑招生计划、专业限制、志愿规则与当年难度变化，不能当作录取预测。请结合区排名、简章与官方系统综合判断。",
  },
  {
    q: "发现分数明显错误怎么办？",
    a: "请到「反馈纠错」页提交学校、年份、你认为正确的分数与出处链接，我们会人工核对后更新。",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">常见问题</h1>
          </div>
          <p className="text-muted-foreground">
            快速了解分制、区排名、批次差异与本站使用注意点。
          </p>
        </div>
        <ShareLinkButton
          title="常见问题 FAQ"
          summary="北京中考分制、区排名与志愿填报要点答疑"
          url={`${SITE_URL}/faq`}
        />
      </div>

      <div className="space-y-3">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-border bg-card open:shadow-sm"
          >
            <summary className="cursor-pointer list-none px-4 py-3 font-medium leading-snug marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                <span>{item.q}</span>
                <span className="shrink-0 text-muted-foreground transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <div className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/guide">填报攻略</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/rank">估分看区排</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/scores">分数线查询</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/open">手机访问指南</Link>
        </Button>
      </div>

      <DataDisclaimer className="mt-8" />
    </div>
  );
}
