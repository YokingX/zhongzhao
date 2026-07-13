import { PolicyMeta } from "@/types/school";
import policyIndex from "@/data/policies-index.json";

export interface PolicyArticle extends PolicyMeta {
  content: string;
  html: string;
  readingMinutes?: number;
}

type PolicyIndexItem = PolicyMeta & { readingMinutes?: number };

const index = policyIndex as PolicyIndexItem[];

export function getAllPolicies(): PolicyMeta[] {
  return index;
}

export function getPolicyCategories(): string[] {
  return [...new Set(index.map((p) => p.category))].sort();
}

export async function getPolicyBySlug(
  slug: string
): Promise<{ meta: PolicyIndexItem; content: string; html: string } | null> {
  const meta = index.find((p) => p.slug === slug);
  if (!meta) return null;
  try {
    const mod = await import(`@/data/policies/${slug}.json`);
    const data = mod.default as { content: string; html: string };
    return { meta, content: data.content, html: data.html };
  } catch {
    return null;
  }
}

export function getAllPolicySlugs(): string[] {
  return index.map((p) => p.slug);
}

export function getRelatedPolicies(slug: string, limit = 3): PolicyMeta[] {
  const current = index.find((p) => p.slug === slug);
  if (!current) return [];
  return getAllPolicies()
    .filter((p) => p.slug !== slug && p.category === current.category)
    .slice(0, limit);
}

export function getFeaturedPolicy(): PolicyMeta | undefined {
  return index.find((p) => p.slug === "2026-policy-overview") ?? index[0];
}

export function getPolicyNeighbors(slug: string): {
  prev: PolicyMeta | null;
  next: PolicyMeta | null;
} {
  const i = index.findIndex((p) => p.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? index[i - 1] : null,
    next: i < index.length - 1 ? index[i + 1] : null,
  };
}
