"use client";

import { useMemo } from "react";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

/** 极简消毒：去掉脚本/事件/危险协议，保留常见排版标签 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "");
}

export function MarkdownMessage({ content }: { content: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false }) as string;
    return sanitizeHtml(raw);
  }, [content]);

  return (
    <div
      className="assist-md text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:first:mt-0 [&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:mb-2 [&_p]:last:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_code]:rounded [&_code]:bg-background/60 [&_code]:px-1 [&_code]:text-[0.85em]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
