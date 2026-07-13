/**
 * 当 git push 无法直连 github.com 时，经 GitHub REST API 推送当前 HEAD commit。
 * 用法：node scripts/gh-push.mjs
 */
import { execFileSync, execSync } from "child_process";

const REPO = "YokingX/zhongzhao";

function gh(args, input) {
  const result = execFileSync("gh", ["api", ...args], {
    input,
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return result.trim() ? JSON.parse(result) : {};
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf-8" }).trim();
}

function createBlob(path) {
  const content = execFileSync("git", ["show", `HEAD:${path}`]);
  return gh(
    [`repos/${REPO}/git/blobs`, "-X", "POST", "--input", "-"],
    JSON.stringify({ content: content.toString("base64"), encoding: "base64" })
  );
}

const head = git(["rev-parse", "HEAD"]);
const parent = git(["rev-parse", "HEAD^"]);
const ref = gh([`repos/${REPO}/git/ref/heads/main`]);

if (ref.object.sha === head) {
  console.log("远程已包含当前 commit，无需推送。");
  process.exit(0);
}

if (ref.object.sha !== parent) {
  console.error(
    `远程 main (${ref.object.sha}) 与本地父提交 (${parent}) 不一致，请先 pull/rebase。`
  );
  process.exit(1);
}

const parentCommit = gh([`repos/${REPO}/git/commits/${parent}`]);
const diff = git(["diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD"]);
const treeEntries = [];

for (const line of diff.split("\n").filter(Boolean)) {
  const [status, ...rest] = line.split("\t");
  const filePath = rest[rest.length - 1];

  if (status.startsWith("D")) {
    treeEntries.push({ path: filePath, mode: "100644", sha: null });
    continue;
  }

  const blob = createBlob(filePath);
  treeEntries.push({
    path: filePath,
    mode: "100644",
    type: "blob",
    sha: blob.sha,
  });
}

const tree = gh(
  [`repos/${REPO}/git/trees`, "-X", "POST", "--input", "-"],
  JSON.stringify({ base_tree: parentCommit.tree.sha, tree: treeEntries })
);

const message = git(["log", "-1", "--format=%B"]);
const commit = gh(
  [`repos/${REPO}/git/commits`, "-X", "POST", "--input", "-"],
  JSON.stringify({
    message,
    tree: tree.sha,
    parents: [parent],
  })
);

gh(
  [`repos/${REPO}/git/refs/heads/main`, "-X", "PATCH", "--input", "-"],
  JSON.stringify({ sha: commit.sha, force: false })
);

console.log(`已推送 ${head.slice(0, 7)} → main (${commit.sha.slice(0, 7)})`);
