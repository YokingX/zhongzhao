import type { Metadata } from "next";
import Link from "next/link";
import { GitCompare } from "lucide-react";
import { getSchoolById, filterSchools } from "@/lib/schools";
import {
  MAX_COMPARE_SCHOOLS,
  addCompareId,
  buildCompareUrl,
  parseCompareIds,
} from "@/lib/compare";
import { firstParam } from "@/lib/search-params";
import { CompareTable } from "@/components/compare/CompareTable";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "学校对比",
  description: "并排对比北京高中的行政区、类型、统招分数线与区排名，最多同时对比 3 所学校。",
};

interface PageProps {
  searchParams: Promise<{
    ids?: string | string[];
    q?: string | string[];
  }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const ids = parseCompareIds(firstParam(raw.ids));
  const q = firstParam(raw.q)?.trim() ?? "";

  const schools = (
    await Promise.all(ids.map((id) => getSchoolById(id)))
  ).filter((s): s is NonNullable<typeof s> => Boolean(s));

  const foundIds = schools.map((s) => s.id);
  const missing = ids.filter((id) => !foundIds.includes(id));

  const searchResult = q
    ? await filterSchools({ query: q, pageSize: 10, page: 1 })
    : null;

  const canAddMore = schools.length < MAX_COMPARE_SCHOOLS;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <GitCompare className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">学校对比</h1>
        </div>
        <p className="text-muted-foreground">
          最多同时对比 {MAX_COMPARE_SCHOOLS} 所学校。可并排查看行政区、类型、历年统招线与区排名。
          {schools.length > 0 && (
            <span className="ml-1">
              当前已选 <strong className="text-foreground">{schools.length}</strong> 所。
            </span>
          )}
        </p>
      </div>

      {missing.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          有 {missing.length} 所学校未找到或已下线，已自动跳过。
        </div>
      )}

      {schools.length >= 2 ? (
        <div className="mb-8">
          <CompareTable schools={schools} ids={foundIds} />
          <p className="mt-3 text-xs text-muted-foreground">
            提示：2025 年起满分 510 分，与 2024 年（670 分）不可直接比较绝对分值，建议优先对比同年区排名。
          </p>
        </div>
      ) : schools.length === 1 ? (
        <div className="mb-8 rounded-xl border border-border bg-card p-6 text-center">
          <p className="mb-2 font-medium">已加入「{schools[0].shortName}」</p>
          <p className="mb-4 text-sm text-muted-foreground">
            请再搜索添加 1～2 所学校开始对比。
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/schools/${schools[0].id}`}>查看该校详情</Link>
          </Button>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="mb-2 font-medium">还没有选择学校</p>
          <p className="mb-4 text-sm text-muted-foreground">
            在下方搜索添加，或从学校详情页点击「加入对比」。
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/schools">去学校库浏览</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href={buildCompareUrl([
                  "hd-1yv0spl",
                  "xc-36caut",
                  "dc-354hnq",
                ])}
              >
                试看示例：人大附 / 四中 / 二中
              </Link>
            </Button>
          </div>
        </div>
      )}

      <section className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold">
          {canAddMore ? "添加学校" : "已满 3 所，搜索后可替换最后一所"}
        </h2>
        <form className="mb-4 flex flex-col gap-3 sm:flex-row" action="/compare" method="get">
          {foundIds.length > 0 && (
            <input type="hidden" name="ids" value={foundIds.join(",")} />
          )}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="输入学校名称或拼音，如 人大附、rdfz"
            className="flex h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit">搜索</Button>
        </form>

        {searchResult && (
          <div>
            {searchResult.schools.length === 0 ? (
              <p className="text-sm text-muted-foreground">未找到匹配学校，请换个关键词。</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {searchResult.schools.map((school) => {
                  const inList = foundIds.includes(school.id);
                  const nextIds = addCompareId(foundIds, school.id);
                  return (
                    <li
                      key={school.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{school.shortName}</div>
                        <div className="text-xs text-muted-foreground">
                          {school.name} · {school.district}区
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {inList && <Badge variant="secondary">已选</Badge>}
                        {inList ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={buildCompareUrl(foundIds)}>查看对比</Link>
                          </Button>
                        ) : (
                          <Button size="sm" asChild>
                            <Link href={buildCompareUrl(nextIds)}>
                              {foundIds.length >= MAX_COMPARE_SCHOOLS
                                ? "替换加入"
                                : "加入对比"}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {!q && foundIds.length > 0 && foundIds.length < MAX_COMPARE_SCHOOLS && (
          <p className="text-sm text-muted-foreground">
            输入学校名搜索后点击「加入对比」。当前还可再加{" "}
            {MAX_COMPARE_SCHOOLS - foundIds.length} 所。
          </p>
        )}
      </section>

      {foundIds.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/compare">清空对比</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/schools">返回学校库</Link>
          </Button>
        </div>
      )}

      <DataDisclaimer />
    </div>
  );
}
