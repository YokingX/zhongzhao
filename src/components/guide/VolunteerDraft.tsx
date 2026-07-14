"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/layout/ShareLinkButton";

const STORAGE_KEY = "zhongzhao-volunteer-draft-v1";
const SLOT_COUNT = 12;

export interface VolunteerSlot {
  school: string;
  note: string;
}

function emptySlots(): VolunteerSlot[] {
  return Array.from({ length: SLOT_COUNT }, () => ({ school: "", note: "" }));
}

function loadSlots(): VolunteerSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySlots();
    const parsed = JSON.parse(raw) as VolunteerSlot[];
    if (!Array.isArray(parsed) || parsed.length !== SLOT_COUNT) return emptySlots();
    return parsed.map((s) => ({
      school: typeof s?.school === "string" ? s.school : "",
      note: typeof s?.note === "string" ? s.note : "",
    }));
  } catch {
    return emptySlots();
  }
}

export function VolunteerDraft() {
  const [slots, setSlots] = useState<VolunteerSlot[]>(emptySlots);
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setSlots(loadSlots());
    setReady(true);
  }, []);

  function updateSlot(index: number, patch: Partial<VolunteerSlot>) {
    setSlots((prev) => {
      const next = prev.map((s, i) => (i === index ? { ...s, ...patch } : s));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }

  function clearAll() {
    const empty = emptySlots();
    setSlots(empty);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSavedAt(null);
  }

  const filled = slots.filter((s) => s.school.trim()).length;
  const shareSummary = slots
    .map((s, i) => (s.school.trim() ? `${i + 1}. ${s.school.trim()}${s.note ? `（${s.note}）` : ""}` : null))
    .filter(Boolean)
    .join("\n");

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>统一招生志愿草案</CardTitle>
            <CardDescription>
              本地草稿，仅保存在本机浏览器，不会上传。建议按「冲 3 · 稳 4 · 保 3 · 兜 2」填写。
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareLinkButton
              title="我的志愿草案"
              summary={shareSummary || "暂无志愿内容"}
              size="sm"
            />
            <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={!ready}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              清空
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!ready ? (
          <p className="text-sm text-muted-foreground">加载本地草稿…</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              已填 {filled}/{SLOT_COUNT}
              {savedAt && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Save className="h-3 w-3" />
                  自动保存于 {savedAt}
                </span>
              )}
            </p>
            <div className="space-y-2">
              {slots.map((slot, index) => {
                const band =
                  index < 3 ? "冲" : index < 7 ? "稳" : index < 10 ? "保" : "兜";
                return (
                  <div
                    key={index}
                    className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[2.5rem_1fr_8rem]"
                  >
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <span>{index + 1}</span>
                      <span className="rounded bg-muted px-1">{band}</span>
                    </div>
                    <Input
                      value={slot.school}
                      onChange={(e) => updateSlot(index, { school: e.target.value })}
                      placeholder={`第 ${index + 1} 志愿学校`}
                      className="h-9"
                    />
                    <Input
                      value={slot.note}
                      onChange={(e) => updateSlot(index, { note: e.target.value })}
                      placeholder="备注"
                      className="h-9"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/compare">学校对比</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/scores">查分数线</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/faq">常见问题</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
