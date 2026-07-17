import {
  ASSIST_MODEL,
  ASSIST_MODEL_FALLBACK,
  ASSIST_SYSTEM_PROMPT,
} from "@/lib/assist/prompt";
import { buildAssistEvidence, type AssistProfile } from "@/lib/assist/retrieve";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 12;
const MAX_CONTENT = 800;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous"
  );
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatBody = {
  messages?: ChatMessage[];
  profile?: AssistProfile;
};

function badRequest(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function normalizeMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: ChatMessage[] = [];
  for (const item of raw.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as ChatMessage).role;
    const content = String((item as ChatMessage).content ?? "").trim();
    if ((role !== "user" && role !== "assistant") || !content) continue;
    out.push({ role, content: content.slice(0, MAX_CONTENT) });
  }
  return out.length ? out : null;
}

function normalizeProfile(raw: unknown): AssistProfile {
  if (!raw || typeof raw !== "object") return {};
  const p = raw as AssistProfile;
  const score =
    typeof p.score === "number" && Number.isFinite(p.score)
      ? Math.round(p.score)
      : undefined;
  const year = p.year === 2024 || p.year === 2025 ? p.year : undefined;
  const district =
    typeof p.district === "string" && p.district.trim()
      ? p.district.trim().slice(0, 20)
      : undefined;
  return { score, year, district };
}

function extractAiText(result: unknown): string {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (typeof r.response === "string") return r.response;
    if (typeof r.text === "string") return r.text;
    if (Array.isArray(r.output_text)) return r.output_text.join("");
    // 部分模型把内容放在 result
    if (typeof r.result === "string") return r.result;
  }
  return "";
}

async function runModel(
  AI: Ai,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  // Workers AI 模型 ID 随目录更新；用宽泛类型避免生成的 Ai 联合类型过窄
  const result = await (AI as { run: (m: string, i: object) => Promise<unknown> }).run(model, {
    messages,
    max_tokens: 1024,
    temperature: 0.35,
  });
  return extractAiText(result).trim();
}

export async function POST(request: Request) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return badRequest("请求体须为 JSON");
  }

  const messages = normalizeMessages(body.messages);
  if (!messages) return badRequest("请提供 messages 对话内容");

  if (!checkRateLimit(clientKey(request))) {
    return Response.json(
      { ok: false, error: "提问太频繁，请稍等一分钟再试" },
      { status: 429 }
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return badRequest("至少需要一条用户消息");

  const profile = normalizeProfile(body.profile);

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();

    if (!env?.AI) {
      return Response.json(
        {
          ok: false,
          error: "AI 服务未绑定。请确认 Worker 已配置 Workers AI（binding: AI）并重新部署。",
        },
        { status: 503 }
      );
    }

    const evidence = await buildAssistEvidence(profile, lastUser.content);
    const system = `${ASSIST_SYSTEM_PROMPT}\n\n【站内检索资料】\n${evidence}`;

    const llmMessages = [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let reply = "";
    let modelUsed = ASSIST_MODEL;
    try {
      reply = await runModel(env.AI, ASSIST_MODEL, llmMessages);
    } catch (primaryError) {
      console.error("[assist] primary model failed", primaryError);
      modelUsed = ASSIST_MODEL_FALLBACK;
      reply = await runModel(env.AI, ASSIST_MODEL_FALLBACK, llmMessages);
    }

    if (!reply) {
      return Response.json(
        { ok: false, error: "模型未返回有效内容，请稍后重试" },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      reply,
      model: modelUsed,
      suggestLinks: buildSuggestLinks(profile),
    });
  } catch (error) {
    console.error("[assist] chat error", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "助手暂时不可用",
      },
      { status: 500 }
    );
  }
}

function buildSuggestLinks(profile: AssistProfile) {
  const links: { label: string; href: string }[] = [
    { label: "填报攻略", href: "/guide" },
    { label: "常见问题", href: "/faq" },
    { label: "分数线", href: "/scores" },
    { label: "升学日历", href: "/timeline" },
  ];
  if (profile.score && profile.score > 0) {
    const year = profile.year === 2024 ? 2024 : 2025;
    const qs = new URLSearchParams({
      score: String(profile.score),
      year: String(year),
    });
    if (profile.district) qs.set("district", profile.district);
    links.unshift({
      label: "查看估分学校清单",
      href: `/guide/suggest?${qs.toString()}`,
    });
    links.splice(1, 0, {
      label: "估分看区排",
      href: `/rank?${qs.toString()}`,
    });
  }
  return links;
}
