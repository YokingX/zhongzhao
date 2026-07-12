import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PolicyMeta } from "@/types/school";

const policiesDirectory = path.join(process.cwd(), "src/content/policies");

export function getAllPolicies(): PolicyMeta[] {
  if (!fs.existsSync(policiesDirectory)) return [];

  const files = fs.readdirSync(policiesDirectory).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(policiesDirectory, filename), "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        date: data.date as string,
        category: data.category as string,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPolicyBySlug(slug: string): { meta: PolicyMeta; content: string } | null {
  const filePath = path.join(policiesDirectory, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    meta: {
      slug,
      title: data.title as string,
      description: data.description as string,
      date: data.date as string,
      category: data.category as string,
    },
    content,
  };
}

export function getAllPolicySlugs(): string[] {
  if (!fs.existsSync(policiesDirectory)) return [];
  return fs.readdirSync(policiesDirectory)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
