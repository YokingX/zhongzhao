"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import {
  detectInAppBrowser,
  IN_APP_LABELS,
  type InAppBrowserKind,
} from "@/lib/in-app-browser";
import { SITE_URL } from "@/lib/site";

const DISMISS_KEY = "zhongzhao-inapp-dismiss";

export function InAppBrowserGuide() {
  const [kind, setKind] = useState<InAppBrowserKind | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const detected = detectInAppBrowser(ua);
    if (!detected) return;
    const wasDismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    setKind(detected);
    setDismissed(wasDismissed);
  }, []);

  if (!kind || dismissed) return null;

  const label = IN_APP_LABELS[kind];
  const siteUrl = typeof window !== "undefined" ? window.location.origin : SITE_URL;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = siteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="mx-auto flex max-w-6xl gap-3">
        <ExternalLink className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            当前在{label}内打开，部分安卓机型可能无法正常加载
          </p>
          <p className="mt-1 text-amber-900/90">
            请点击右上角 <strong>「…」</strong> → <strong>在浏览器中打开</strong>
            （推荐 Chrome / 系统浏览器）。也可
            <Link href="/open" className="mx-1 font-medium text-primary underline">
              查看访问指南
            </Link>
            或复制链接后到浏览器粘贴访问。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              {copied ? "已复制链接" : "复制网站地址"}
            </button>
            <Link
              href="/open"
              className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium"
            >
              访问指南
            </Link>
          </div>
        </div>
        <button
          type="button"
          aria-label="关闭提示"
          className="shrink-0 rounded p-1 hover:bg-amber-100"
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
