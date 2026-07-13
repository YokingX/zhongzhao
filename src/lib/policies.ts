import { PolicyMeta } from "@/types/school";
import policiesData from "@/data/policies.json";

export interface PolicyArticle extends PolicyMeta {
  content: string;
  html: string;
}

const policies = policiesData as PolicyArticle[];

export function getAllPolicies(): PolicyMeta[] {
  return policies.map(({ content: _c, ...meta }) => meta);
}

export function getPolicyCategories(): string[] {
  return [...new Set(policies.map((p) => p.category))].sort();
}

export function getPolicyBySlug(slug: string): { meta: PolicyMeta; content: string; html: string } | null {
  const article = policies.find((p) => p.slug === slug);
  if (!article) return null;
  const { content, html, ...meta } = article;
  return { meta, content, html };
}

export function getAllPolicySlugs(): string[] {
  return policies.map((p) => p.slug);
}

export function getRelatedPolicies(slug: string, limit = 3): PolicyMeta[] {
  const current = policies.find((p) => p.slug === slug);
  if (!current) return [];
  return getAllPolicies()
    .filter((p) => p.slug !== slug && p.category === current.category)
    .slice(0, limit);
}

export function getFeaturedPolicy(): PolicyMeta | undefined {
  return (
    getAllPolicies().find((p) => p.slug === "2026-policy-overview") ?? getAllPolicies()[0]
  );
}
