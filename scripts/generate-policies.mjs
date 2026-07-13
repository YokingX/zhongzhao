/**
 * 将 src/content/policies/*.mdx 编译为 policies-index.json + policies/*.json
 * Cloudflare Worker 无文件系统；详情页按篇动态导入，避免打包全部 HTML。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "../src/content/policies");
const OUT_DIR = path.join(__dirname, "../src/data/policies");
const INDEX_OUT = path.join(__dirname, "../src/data/policies-index.json");

marked.setOptions({ gfm: true });

function main() {
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(path.dirname(INDEX_OUT), { recursive: true });
    fs.writeFileSync(INDEX_OUT, "[]\n");
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const existing = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".json"));
  for (const f of existing) {
    fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const index = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(DIR, filename), "utf-8");
      const { data, content } = matter(raw);
      const body = content.trim();
      const html = marked.parse(body);
      const readingMinutes = Math.max(1, Math.ceil(body.replace(/\s/g, "").length / 400));

      fs.writeFileSync(
        path.join(OUT_DIR, `${slug}.json`),
        `${JSON.stringify({ content: body, html }, null, 2)}\n`
      );

      return {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        category: data.category,
        readingMinutes,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  fs.writeFileSync(INDEX_OUT, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`Generated ${index.length} policies → ${INDEX_OUT}`);
}

main();
