import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleWarning } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";

export const metadata: Metadata = {
  title: "反馈纠错",
  description: "反馈分数线错误、学校信息问题或使用建议。",
};

const ISSUE_URL =
  "https://github.com/YokingX/zhongzhao/issues/new?title=%E6%95%B0%E6%8D%AE%E7%BA%A0%E9%94%99&body=%E5%AD%A6%E6%A0%A1%EF%BC%9A%0A%E5%B9%B4%E4%BB%BD%2F%E6%89%B9%E6%AC%A1%EF%BC%9A%0A%E4%BD%A0%E8%AE%A4%E4%B8%BA%E6%AD%A3%E7%A1%AE%E7%9A%84%E5%88%86%E6%95%B0%2F%E5%8C%BA%E6%8E%92%EF%BC%9A%0A%E4%BE%9D%E6%8D%AE%E9%93%BE%E6%8E%A5%E6%88%96%E8%AF%B4%E6%98%8E%EF%BC%9A%0A";

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <MessageCircleWarning className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">反馈纠错</h1>
        </div>
        <p className="text-muted-foreground">
          发现分数明显不对、校名有误，或有改进建议，欢迎告诉我们。我们会人工核对后再改库。
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">怎么反馈最有用</CardTitle>
          <CardDescription>请尽量写全下面几项，方便快速核实。</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>学校全称或站内详情页链接</li>
            <li>年份、批次（目前以统招为主）、你认为正确的分数/区排</li>
            <li>你的依据（考试院截图、区教委链接、新闻出处等）</li>
            <li>可选：行政区、页面报错截图</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer">
                在 GitHub 提交反馈
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/data">先看数据说明</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/faq">常见问题</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            打不开 GitHub 时，也可把上述要点发给站点维护者。提交前请勿粘贴隐私证件信息。
          </p>
        </CardContent>
      </Card>

      <DataDisclaimer />
    </div>
  );
}
