"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";

interface ShareLinkButtonProps {
  title: string;
  summary?: string;
  /** 完整 URL；缺省用当前页 */
  url?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ShareLinkButton({
  title,
  summary,
  url,
  variant = "outline",
  size = "sm",
  className,
}: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const link =
      url ?? (typeof window !== "undefined" ? window.location.href : "");
    const text = [
      `【${SITE_NAME}】${title}`,
      summary,
      "",
      "打开链接：",
      link,
      "",
      "若微信内打不开：右上角「…」→ 在浏览器中打开",
      "或访问 /open 查看手机访问指南",
    ]
      .filter((line) => line !== undefined)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: `${SITE_NAME} · ${title}`, text, url: link });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={handleShare}>
      {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Share2 className="mr-1.5 h-4 w-4" />}
      {copied ? "已复制分享文案" : "分享给家长"}
    </Button>
  );
}
