import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 300;

function runSync() {
  return new Promise<{ code: number; output: string }>((resolve, reject) => {
    const script = path.join(process.cwd(), "scripts/sync-data.mjs");
    const child = spawn(process.execPath, [script], {
      cwd: process.cwd(),
      env: process.env,
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code, output } = await runSync();
    if (code !== 0) {
      return NextResponse.json({ error: "Sync failed", output }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      message: "数据同步完成",
      output: output.split("\n").filter(Boolean).slice(-8),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync error" },
      { status: 500 }
    );
  }
}
