import type { MetadataRoute } from "next";
import { getAllSchools } from "@/lib/schools";
import { getAllPolicySlugs } from "@/lib/policies";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://beijing-zhongkao-guide.vercel.app";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/schools`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/scores`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/policies`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/guide`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/timeline`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
  ];

  const schoolPages = getAllSchools().map((school) => ({
    url: `${baseUrl}/schools/${school.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const policyPages = getAllPolicySlugs().map((slug) => ({
    url: `${baseUrl}/policies/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...schoolPages, ...policyPages];
}
