import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPolicyBySlug, getAllPolicySlugs } from "@/lib/policies";
import { PolicyContent } from "@/components/policies/PolicyContent";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPolicySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);
  if (!policy) return { title: "文章未找到" };
  return {
    title: policy.meta.title,
    description: policy.meta.description,
  };
}

export default async function PolicyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);
  if (!policy) notFound();

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
          <Badge variant="secondary" className="mb-3">{policy.meta.category}</Badge>
          <h1 className="mb-3 text-3xl font-bold leading-tight">{policy.meta.title}</h1>
          <p className="text-muted-foreground">{policy.meta.description}</p>
          <time className="mt-2 block text-sm text-muted-foreground">{policy.meta.date}</time>
        </header>

        <PolicyContent source={policy.content} />

        <footer className="mt-12 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          本文内容基于北京教育考试院公开政策文件整理解读，仅供参考，具体政策以
          <a href="https://www.bjeea.cn" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            北京教育考试院
          </a>
          官方发布为准。
        </footer>
      </article>
    </div>
  );
}
