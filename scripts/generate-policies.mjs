/**
 * 将 src/content/policies/*.mdx 编译为 src/data/policies.json
 * Cloudflare Worker 运行时无文件系统，须在构建阶段生成 HTML。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "../src/content/policies");
const OUT = path.join(__dirname, "../src/data/policies.json");

marked.setOptions({ gfm: true });

function main() {
  if (!fs.existsSync(DIR)) {
    fs.writeFileSync(OUT, "[]\n");
    console.log("No policies directory, wrote empty policies.json");
    return;
  }

  const policies = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(DIR, filename), "utf-8");
      const { data, content } = matter(raw);
      const body = content.trim();
      return {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        category: data.category,
        content: body,
        html: marked.parse(body),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  fs.writeFileSync(OUT, `${JSON.stringify(policies, null, 2)}\n`);
  console.log(`Generated ${policies.length} policies → ${OUT}`);
}

main();
