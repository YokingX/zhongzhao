import type { Metadata } from "next";
import Link from "next/link";
import { Database } from "lucide-react";
import meta from "@/data/meta.json";
import manifest from "@/data/data-manifest.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";

export const metadata: Metadata = {
  title: "数据说明",
  description: "本站学校名单、分数线来源、更新方式与免责说明。",
};

export default function DataAboutPage() {
  const lastUpdated = manifest.lastUpdated || meta.lastUpdated;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Database className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">数据说明</h1>
        </div>
        <p className="text-muted-foreground">
          写清楚数据从哪来、更新到什么程度，方便你判断能不能参考。
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">我们覆盖什么</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              当前收录约 <strong className="text-foreground">{meta.totalSchools}</strong> 所普高，其中约{" "}
              <strong className="text-foreground">{meta.schoolsWithScores}</strong> 所有统招分数线。
            </p>
            <p>
              <strong className="text-foreground">本站分数线以「统一招生」为主。</strong>
              提前招生、校额到校/指标分配的校线与计划数，站内暂无完整结构化数据；规则说明见政策解读与 FAQ。
            </p>
            <p>
              学校名单基准年：北京市教委 {meta.officialListYear} 年具有招生资格的普通高中名单。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">来源与口径</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>学校名单：{meta.schoolListSource}。</p>
            <p>分数线：{meta.dataSource}。</p>
            <p>
              权威出处请以{" "}
              <a
                href={meta.officialSource}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                北京教育考试院
              </a>{" "}
              当年正式发布为准。本站<strong className="text-foreground">不是官方网站</strong>。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">如何更新</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              数据最后更新：
              {lastUpdated
                ? new Date(lastUpdated).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "未知"}
              {manifest.autoSync ? " · 已启用自动同步" : ""}。
            </p>
            <p>
              同步主要增量更新统招分数线；学校名单与简介不会每天全量重写。发现明显错误可走反馈入口。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">访问说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              当前部署在 Cloudflare Workers（workers.dev）。若微信内打不开，请用系统浏览器打开，或查看{" "}
              <Link href="/open" className="text-primary hover:underline">
                手机访问指南
              </Link>
              。自定义域名需在 Cloudflare 绑定你自己的域名（见站点文档）。
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/feedback">反馈纠错</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/faq">常见问题</Link>
        </Button>
      </div>

      <DataDisclaimer className="mt-8" />
    </div>
  );
}
