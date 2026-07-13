import type { Metadata } from "next";
import Link from "next/link";
import { Chrome, Smartphone, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopySiteLink } from "@/components/layout/CopySiteLink";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "手机访问指南",
  description: "安卓、微信内打开北京中考升学指导网站的说明与推荐访问方式。",
};

export default function OpenGuidePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Smartphone className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">手机访问指南</h1>
        <p className="text-sm text-muted-foreground">
          若在{SITE_NAME}内遇到白屏、加载失败，请按以下方式进入。
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-5 w-5 text-primary" />
            微信 / QQ 内打开
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. 点击右上角 <strong className="text-foreground">「…」</strong> 或 <strong className="text-foreground">「⋮」</strong></p>
          <p>2. 选择 <strong className="text-foreground">在浏览器中打开</strong> 或 <strong className="text-foreground">用 Safari / Chrome 打开</strong></p>
          <p>3. 推荐使用系统自带浏览器或 Chrome，兼容性更好</p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Chrome className="h-5 w-5 text-primary" />
            安卓浏览器直接访问
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-foreground">
            {SITE_URL}
          </p>
          <CopySiteLink url={SITE_URL} />
          <p className="text-muted-foreground">
            复制后粘贴到 Chrome、华为浏览器、小米浏览器等地址栏打开。可添加到主屏幕，下次一键进入。
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">快捷入口</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/scores">分数线查询</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/schools">学校库</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/guide">填报攻略</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/policies">政策解读</Link>
          </Button>
        </CardContent>
      </Card>

      <Button asChild className="w-full" size="lg">
        <Link href="/">进入网站首页</Link>
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        若仍无法访问，可能是当前网络对国际域名有限制，请切换 Wi‑Fi / 移动数据后重试，或联系站点维护者配置国内可访问域名。
      </p>
    </div>
  );
}
