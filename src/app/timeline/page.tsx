import type { Metadata } from "next";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { getTimelineEvents } from "@/lib/timeline-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { ShareLinkButton } from "@/components/layout/ShareLinkButton";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "升学日历",
  description: "北京中考报名、考试、志愿填报与录取关键时间节点一览（参考日历）。",
};

const categoryColor: Record<string, string> = {
  报名: "bg-sky-100 text-sky-800",
  考试: "bg-amber-100 text-amber-900",
  志愿: "bg-emerald-100 text-emerald-900",
  录取: "bg-violet-100 text-violet-900",
  其他: "bg-muted text-muted-foreground",
};

export default function TimelinePage() {
  const events = getTimelineEvents();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">升学日历</h1>
          </div>
          <p className="text-muted-foreground">
            2026 中招关键节点参考。正式报名、考试、填报与录取时间以北京教育考试院及本区通知为准。
          </p>
        </div>
        <ShareLinkButton
          title="北京中考升学日历"
          summary="报名、考试、志愿填报与录取关键时间"
          url={`${SITE_URL}/timeline`}
        />
      </div>

      <ol className="relative space-y-4 border-l border-border pl-6">
        {events.map((ev) => {
          const past = ev.date < todayKey;
          return (
            <li key={ev.id} className="relative">
              <span
                className={`absolute -left-[1.625rem] top-2 h-3 w-3 rounded-full border-2 border-background ${
                  past ? "bg-muted-foreground/40" : "bg-primary"
                }`}
                aria-hidden
              />
              <Card className={past ? "opacity-80" : undefined}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <time dateTime={ev.date} className="text-sm font-semibold text-primary">
                      {ev.date}
                    </time>
                    <Badge className={`border-0 ${categoryColor[ev.category] ?? categoryColor.其他}`}>
                      {ev.category}
                    </Badge>
                    {past && (
                      <span className="text-xs text-muted-foreground">已过（参考）</span>
                    )}
                  </div>
                  <CardTitle className="text-base">{ev.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{ev.description}</p>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/guide">去填报攻略</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/assist">问 AI 助手</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/rank">估分看区排</Link>
        </Button>
      </div>

      <DataDisclaimer className="mt-8" />
    </div>
  );
}
