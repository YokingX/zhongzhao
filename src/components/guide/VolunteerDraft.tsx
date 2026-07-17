"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trash2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/layout/ShareLinkButton";
import { cn } from "@/lib/utils";

type DraftBatch = "unified" | "quota" | "early";

const BATCH_META: Record<
  DraftBatch,
  { label: string; storageKey: string; slots: number; hint: string }
> = {
  unified: {
    label: "统一招生",
    storageKey: "zhongzhao-volunteer-draft-v1",
    slots: 12,
    hint: "建议冲 3 · 稳 4 · 保 3 · 兜 2（可按区调整）",
  },
  quota: {
    label: "指标分配",
    storageKey: "zhongzhao-volunteer-draft-quota-v1",
    slots: 8,
    hint: "校额到校/市级统筹；请先确认资格与校内竞争规则",
  },
  early: {
    label: "提前招生",
    storageKey: "zhongzhao-volunteer-draft-early-v1",
    slots: 8,
    hint: "含贯通等；被提前录取后通常不再参加后续批次",
  },
};

export interface VolunteerSlot {
  school: string;
  note: string;
  schoolId?: string;
}

type SearchItem = {
  id: string;
  name: string;
  shortName: string;
  district: string;
};

function emptySlots(n: number): VolunteerSlot[] {
  return Array.from({ length: n }, () => ({ school: "", note: "" }));
}

function loadSlots(key: string, n: number): VolunteerSlot[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptySlots(n);
    const parsed = JSON.parse(raw) as VolunteerSlot[];
    if (!Array.isArray(parsed)) return emptySlots(n);
    const normalized = parsed.slice(0, n).map((s) => ({
      school: typeof s?.school === "string" ? s.school : "",
      note: typeof s?.note === "string" ? s.note : "",
      schoolId: typeof s?.schoolId === "string" ? s.schoolId : undefined,
    }));
    while (normalized.length < n) normalized.push({ school: "", note: "", schoolId: undefined });
    return normalized;
  } catch {
    return emptySlots(n);
  }
}

function bandLabel(batch: DraftBatch, index: number): string {
  if (batch !== "unified") return String(index + 1);
  if (index < 3) return "冲";
  if (index < 7) return "稳";
  if (index < 10) return "保";
  return "兜";
}

export function VolunteerDraft() {
  const [batch, setBatch] = useState<DraftBatch>("unified");
  const [slots, setSlots] = useState<VolunteerSlot[]>(emptySlots(12));
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meta = BATCH_META[batch];

  useEffect(() => {
    setSlots(loadSlots(meta.storageKey, meta.slots));
    setReady(true);
    setSuggestions([]);
    setActiveIndex(null);
  }, [batch, meta.storageKey, meta.slots]);

  function persist(next: VolunteerSlot[]) {
    try {
      localStorage.setItem(meta.storageKey, JSON.stringify(next));
      setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      /* ignore quota */
    }
  }

  function updateSlot(index: number, patch: Partial<VolunteerSlot>) {
    setSlots((prev) => {
      const next = prev.map((s, i) => (i === index ? { ...s, ...patch } : s));
      persist(next);
      return next;
    });
  }

  function clearAll() {
    const empty = emptySlots(meta.slots);
    setSlots(empty);
    try {
      localStorage.removeItem(meta.storageKey);
    } catch {
      /* ignore */
    }
    setSavedAt(null);
  }

  function onSchoolChange(index: number, value: string) {
    updateSlot(index, { school: value, schoolId: undefined });
    setActiveIndex(index);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/schools/search?q=${encodeURIComponent(value.trim())}`);
        const data = (await res.json()) as { items?: SearchItem[] };
        setSuggestions(data.items ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 220);
  }

  function pickSchool(index: number, item: SearchItem) {
    updateSlot(index, {
      school: item.shortName || item.name,
      schoolId: item.id,
    });
    setSuggestions([]);
    setActiveIndex(null);
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
            <CardTitle>志愿草案</CardTitle>
            <CardDescription>
              本地草稿，仅保存在本机浏览器，不会上传。{meta.hint}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareLinkButton
              title={`${meta.label}志愿草案`}
              summary={shareSummary || "暂无志愿内容"}
              size="sm"
            />
            <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={!ready}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              清空本批
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {(Object.keys(BATCH_META) as DraftBatch[]).map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={batch === key ? "default" : "outline"}
              onClick={() => setBatch(key)}
            >
              {BATCH_META[key].label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!ready ? (
          <p className="text-sm text-muted-foreground">加载本地草稿…</p>
        ) : (
          <>
            {batch !== "unified" && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                提醒：本站结构化分数线目前以统招为主，{meta.label}
                请结合资格自查与官方简章填写，草案仅作备忘。
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              已填 {filled}/{meta.slots}
              {savedAt && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Save className="h-3 w-3" />
                  自动保存于 {savedAt}
                </span>
              )}
            </p>
            <div className="space-y-2">
              {slots.map((slot, index) => {
                const band = bandLabel(batch, index);
                return (
                  <div
                    key={`${batch}-${index}`}
                    className="relative grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[2.5rem_1fr_8rem]"
                  >
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <span>{index + 1}</span>
                      <span className="rounded bg-muted px-1">{band}</span>
                    </div>
                    <div className="relative">
                      <Input
                        value={slot.school}
                        onChange={(e) => onSchoolChange(index, e.target.value)}
                        onFocus={() => setActiveIndex(index)}
                        onBlur={() => {
                          // 延迟关闭，方便点击建议
                          setTimeout(() => {
                            setActiveIndex((cur) => (cur === index ? null : cur));
                          }, 180);
                        }}
                        placeholder={`第 ${index + 1} 志愿（可搜索校名）`}
                        className="h-9"
                        autoComplete="off"
                      />
                      {activeIndex === index && suggestions.length > 0 && (
                        <ul
                          className={cn(
                            "absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-md"
                          )}
                        >
                          {suggestions.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickSchool(index, item)}
                              >
                                <span className="font-medium">{item.shortName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.district}区 · {item.name}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
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
                <Link href="/guide/suggest">估分清单</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/rank">估分看区排</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/compare">学校对比</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/assist">AI 助手</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
