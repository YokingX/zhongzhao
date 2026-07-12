import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WATCH_DIR = __dirname;
const WATCH_FILES = [
  "score-data.mjs",
  "school-list.mjs",
  "score-aliases.mjs",
  "scores-fetched.json",
];

let timer = null;

function sync() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 检测到数据变动，正在重新生成...`);
  const res = spawnSync(process.execPath, ["scripts/generate-schools.mjs"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
  if (res.status === 0) {
    spawnSync(process.execPath, ["scripts/db-import.mjs"], {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    console.log("数据已更新（JSON + 数据库），刷新浏览器即可看到变化");
  }
}

function scheduleSync() {
  clearTimeout(timer);
  timer = setTimeout(sync, 500);
}

console.log("监听数据文件变动:", WATCH_FILES.join(", "));
console.log("修改 scripts/score-data.mjs 等文件后将自动重新生成 schools.json\n");

for (const file of WATCH_FILES) {
  const full = path.join(WATCH_DIR, file);
  if (!fs.existsSync(full)) continue;
  fs.watch(full, scheduleSync);
}

process.stdin.resume();
