interface CloudflareEnv {
  DB: D1Database;
  AI: Ai;
  CRON_SECRET?: string;
  ALERT_WEBHOOK_URL?: string;
  ASSETS?: Fetcher;
  NEXT_PUBLIC_SITE_URL?: string;
}
