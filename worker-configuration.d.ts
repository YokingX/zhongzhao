interface CloudflareEnv {
  DB: D1Database;
  CRON_SECRET?: string;
  ALERT_WEBHOOK_URL?: string;
  ASSETS?: Fetcher;
  NEXT_PUBLIC_SITE_URL?: string;
}
