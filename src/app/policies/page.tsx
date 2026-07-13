import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, BookOpen } from "lucide-react";
import {
  getAllPolicies,
  getPolicyCategories,
  getFeaturedPolicy,
} from "@/lib/policies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "政策解读",
  description: "北京中考招生政策详细解读，包括校额到校、指标分配、志愿填报等核心政策。",
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

const categoryHints: Record<string, string> = {
  政策概览: "整体框架与改革要点",
  指标分配: "校额到校与市级统筹",
  提前招生: "贯通项目与特长生",
  志愿填报: "统一招生填报技巧",
  综合评价: "综评等级与资格",
  报考资格: "学籍与特殊考生",
};

export default async function PoliciesPage({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const all = getAllPolicies();
  const categories = getPolicyCategories();
  const featured = getFeaturedPolicy();
  const filtered =
    category && category !== "全部"
      ? all.filter((p) => p.category === category)
      : all;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">政策解读</h1>
        <p className="text-muted-foreground">
          基于北京教育考试院公开文件整理，按批次与主题分类，帮助初三家庭准确理解升学规则。
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium">信息以官方发布为准</p>
            <p className="text-muted-foreground">
              本站为非官方参考平台，报名资格、分数线等请以北京教育考试院当年通知为准。
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="https://www.bjeea.cn" target="_blank" rel="noopener noreferrer">
            北京教育考试院
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </div>

      {featured && !category && (
        <Link href={`/policies/${featured.slug}`} className="mb-8 block">
          <Card className="border-primary/30 bg-gradient-to-br from-blue-50 to-card transition-shadow hover:shadow-md">
            <CardHeader>
              <Badge className="w-fit">推荐阅读</Badge>
              <CardTitle className="text-xl">{featured.title}</CardTitle>
              <CardDescription className="text-base">{featured.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">{featured.date}</span>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/policies"
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            !category || category === "全部"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          全部 ({all.length})
        </Link>
        {categories.map((cat) => {
          const count = all.filter((p) => p.category === cat).length;
          const active = category === cat;
          return (
            <Link
              key={cat}
              href={`/policies?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat} ({count})
            </Link>
          );
        })}
      </div>

      {category && category !== "全部" && categoryHints[category] && (
        <p className="mb-4 text-sm text-muted-foreground">{categoryHints[category]}</p>
      )}

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="mb-4 text-muted-foreground">该分类暂无文章</p>
          <Button variant="outline" asChild>
            <Link href="/policies">查看全部政策</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((policy) => (
            <Link key={policy.slug} href={`/policies/${policy.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    {policy.category}
                  </Badge>
                  <CardTitle className="text-base leading-snug">{policy.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{policy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <time className="text-xs text-muted-foreground">{policy.date}</time>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/guide">志愿填报攻略</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/timeline">查看升学日历</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/scores">查询分数线</Link>
        </Button>
      </div>
    </div>
  );
}
