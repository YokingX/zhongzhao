import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { AssistChat } from "@/components/assist/AssistChat";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { DataFreshnessBar } from "@/components/layout/DataFreshnessBar";
import { ShareLinkButton } from "@/components/layout/ShareLinkButton";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI 志愿填报助手",
  description:
    "结合站内分数线与政策要点，用对话辅助家长与考生梳理北京中考冲稳保志愿思路。",
};

export default function AssistPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MessageSquareText className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">AI 志愿助手</h1>
          </div>
          <p className="text-muted-foreground">
            说明批次规则、按估分给出参考学校区间，并链接到攻略与分数线。回答由 AI
            生成且可能有误，不能替代官方系统与招生简章。
          </p>
        </div>
        <ShareLinkButton
          title="AI 志愿填报助手"
          summary="对话辅助梳理冲稳保志愿与批次规则（仅供参考）"
          url={`${SITE_URL}/assist`}
        />
      </div>

      <DataFreshnessBar className="mb-6" />
      <AssistChat />

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/guide">填报攻略 / 志愿草案</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/faq">常见问题</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/scores">分数线查询</Link>
        </Button>
      </div>

      <div className="mt-8">
        <DataDisclaimer />
      </div>
    </div>
  );
}
