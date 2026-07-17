"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BEIJING_DISTRICTS } from "@/types/school";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "@/components/assist/MarkdownMessage";

type Role = "user" | "assistant";

interface Msg {
  role: Role;
  content: string;
}

interface SuggestLink {
  label: string;
  href: string;
}

const SUGGESTIONS = [
  "估分 480，海淀怎么填统招冲稳保？",
  "校额到校和统招有什么区别？",
  "510 分和 670 分怎么对比？",
  "帮我看下人大附中近年统招大概多少分",
];

const WELCOME = `## 一句话结论
你好，我是志愿填报助手，会用好懂的分点方式回答。

## 怎么做
- 先填好上方的估分、年份、意向行政区
- 再问我：怎么排冲稳保、某校分数线、批次规则等

## 要注意
- 回答仅供参考，以北京教育考试院官方为准
- 本站分数线以统招为主

## 下一步
- 也可以先去 /guide 填志愿草案，或 /rank 粗估区排`;

export function AssistChat() {
  const [score, setScore] = useState("480");
  const [year, setYear] = useState<"2024" | "2025">("2025");
  const [district, setDistrict] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<SuggestLink[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    const scoreNum = Number(score);
    const profile = {
      score: Number.isFinite(scoreNum) && scoreNum > 0 ? scoreNum : undefined,
      year: (year === "2024" ? 2024 : 2025) as 2024 | 2025,
      district: district || undefined,
    };

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter((m, i) => !(i === 0 && m.role === "assistant")),
          profile,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reply?: string;
        error?: string;
        suggestLinks?: SuggestLink[];
      };

      if (!res.ok || !data.ok || !data.reply) {
        throw new Error(data.error || `请求失败（${res.status}）`);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
      if (data.suggestLinks?.length) setLinks(data.suggestLinks);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "发送失败";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `## 一句话结论\n抱歉，刚才没能完成回答。\n\n## 要注意\n- ${msg}\n\n## 下一步\n- 稍后再试，或先去 /guide、/scores、/rank 自行查阅`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">估分</span>
            <Input
              type="number"
              inputMode="numeric"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder={year === "2025" ? "如 480" : "如 620"}
              min={1}
              max={year === "2025" ? 510 : 670}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">分制年份</span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={year === "2025" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setYear("2025")}
              >
                2025 · 510
              </Button>
              <Button
                type="button"
                size="sm"
                variant={year === "2024" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setYear("2024")}
              >
                2024 · 670
              </Button>
            </div>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">意向行政区</span>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">全市 / 未指定</option>
              {BEIJING_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}区
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => send(s)}
            className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex max-h-[min(60vh,520px)] flex-col gap-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={cn(
                "max-w-[95%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "ml-auto whitespace-pre-wrap bg-primary text-primary-foreground"
                  : "mr-auto bg-muted text-foreground"
              )}
            >
              {m.role === "assistant" && i === 0 && (
                <span className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  升学助手
                </span>
              )}
              {m.role === "assistant" ? <MarkdownMessage content={m.content} /> : m.content}
            </div>
          ))}
          {loading && (
            <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在结合分数线资料思考…
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Button key={l.href} asChild variant="outline" size="sm">
              <Link href={l.href}>{l.label}</Link>
            </Button>
          ))}
          <Button asChild variant="secondary" size="sm">
            <Link href="/guide">写入志愿草案</Link>
          </Button>
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如：海淀 480 分统招怎么排志愿？"
          disabled={loading}
          maxLength={800}
        />
        <Button type="submit" disabled={loading || !input.trim()} className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="ml-1.5 hidden sm:inline">发送</span>
        </Button>
      </form>
    </div>
  );
}
