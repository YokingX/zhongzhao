import type { Metadata } from "next";
import timelineData from "@/data/timeline.json";
import { TimelineEvent } from "@/types/school";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "升学日历",
  description: "2026年北京中考升学关键时间节点，包括考试、志愿填报和录取时间安排。",
};

const categoryColors: Record<string, string> = {
  报名: "bg-gray-100 text-gray-700",
  考试: "bg-blue-100 text-blue-700",
  志愿: "bg-orange-100 text-orange-700",
  录取: "bg-green-100 text-green-700",
  其他: "bg-purple-100 text-purple-700",
};

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TimelinePage() {
  const events = timelineData as TimelineEvent[];
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">升学日历</h1>
        <p className="text-muted-foreground">
          2026年北京中考升学关键时间节点，帮助你合理安排备考和升学规划。
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border sm:left-6" />

        <div className="space-y-6">
          {sortedEvents.map((event) => {
            const days = getDaysUntil(event.date);
            const isPast = days < 0;
            const isToday = days === 0;

            return (
              <div key={event.id} className="relative flex gap-4 sm:gap-6">
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12 ${
                    isPast
                      ? "border-muted bg-muted text-muted-foreground"
                      : isToday
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary bg-card text-primary"
                  }`}
                >
                  <div className="h-2 w-2 rounded-full bg-current sm:h-3 sm:w-3" />
                </div>

                <Card className={`flex-1 ${isPast ? "opacity-60" : ""}`}>
                  <CardContent className="pt-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className={categoryColors[event.category] || categoryColors["其他"]}>
                        {event.category}
                      </Badge>
                      {isToday && <Badge variant="default">今天</Badge>}
                      {!isPast && !isToday && days <= 30 && (
                        <Badge variant="accent">还有{days}天</Badge>
                      )}
                    </div>
                    <h3 className="mb-1 text-lg font-semibold">{event.title}</h3>
                    <time className="mb-2 block text-sm text-primary font-medium">
                      {formatDate(event.date)}
                    </time>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        以上时间为2026年参考安排，具体日期以北京教育考试院官方通知为准。
      </div>
    </div>
  );
}
