export type InAppBrowserKind = "wechat" | "qq" | "weibo" | "douyin";

const PATTERNS: { kind: InAppBrowserKind; test: RegExp }[] = [
  { kind: "wechat", test: /micromessenger/i },
  { kind: "qq", test: /\bqq\//i },
  { kind: "weibo", test: /weibo/i },
  { kind: "douyin", test: /aweme|bytedance/i },
];

export function detectInAppBrowser(userAgent: string): InAppBrowserKind | null {
  for (const { kind, test } of PATTERNS) {
    if (test.test(userAgent)) return kind;
  }
  return null;
}

export function isAndroid(userAgent: string): boolean {
  return /android/i.test(userAgent);
}

export const IN_APP_LABELS: Record<InAppBrowserKind, string> = {
  wechat: "微信",
  qq: "QQ",
  weibo: "微博",
  douyin: "抖音",
};
