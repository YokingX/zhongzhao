/**
 * 本地开发：OpenNext preview + 本地 D1（wrangler --local）
 * 首次运行或代码变更后需构建，可加 --build 强制重建。
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const workerBundle = path.join(root, ".open-next/worker.js");
const forceBuild = process.argv.includes("--build");

function run(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: root, stdio: "inherit", env: process.env });
  if (res.status !== 0) process.exit(res.status || 1);
}

if (forceBuild || !fs.existsSync(workerBundle)) {
  console.log("构建 OpenNext Worker（供本地 D1 预览）…\n");
  run("npx", ["opennextjs-cloudflare", "build"]);
}

console.log("启动本地预览（绑定本地 D1，数据目录 .wrangler/state/）\n");
run("npx", ["opennextjs-cloudflare", "preview"]);
