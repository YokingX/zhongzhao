import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  getPolicyBySlug,
  getAllPolicySlugs,
  getRelatedPolicies,
  getPolicyNeighbors,
} from "@/lib/policies";
import { PolicyContent } from "@/components/policies/PolicyContent";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-static";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPolicySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = await getPolicyBySlug(slug);
  if (!policy) return { title: "文章未找到" };
  return {
    title: policy.meta.title,
    description: policy.meta.description,
    keywords: [policy.meta.category, "北京中考", "招生政策", policy.meta.title],
  };
}

export default async function PolicyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const policy = await getPolicyBySlug(slug);
  if (!policy) notFound();

  const { prev, next } = getPolicyNeighbors(slug);
  const related = getRelatedPolicies(slug);
  const readingMin = policy.meta.readingMinutes ?? 3;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/policies"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        返回政策列表
      </Link>

      <article>
        <header className="mb-8">
          <Badge variant="secondary" className="mb-3">
            {policy.meta.category}
          </Badge>
          <h1 className="mb-3 text-3xl font-bold leading-tight">{policy.meta.title}</h1>
          <p className="text-lg text-muted-foreground">{policy.meta.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <time dateTime={policy.meta.date}>{policy.meta.date}</time>
            <span>·</span>
            <span>约 {readingMin} 分钟阅读</span>
          </div>
        </header>

        <PolicyContent html={policy.html} />

        <footer className="mt-12 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          本文内容基于北京教育考试院公开政策文件整理解读，仅供参考，具体政策以
          <a
            href="https://www.bjeea.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            北京教育考试院
          </a>
          官方发布为准。
        </footer>
      </article>

      {(prev || next) && (
        <nav className="mt-8 grid gap-4 sm:grid-cols-2">
          {prev ? (
            <Link href={`/policies/${prev.slug}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  上一篇
                </CardContent>
                <CardHeader className="pt-0">
                  <CardTitle className="text-base group-hover:text-primary">{prev.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ) : (
            <div />
          )}
          {next && (
            <Link href={`/policies/${next.slug}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-end gap-2 pt-6 text-sm text-muted-foreground">
                  下一篇
                  <ArrowRight className="h-4 w-4" />
                </CardContent>
                <CardHeader className="pt-0 text-right">
                  <CardTitle className="text-base group-hover:text-primary">{next.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          )}
        </nav>
      )}

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">相关解读</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((item) => (
              <Link key={item.slug} href={`/policies/${item.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm leading-snug">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
