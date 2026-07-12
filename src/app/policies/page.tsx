import type { Metadata } from "next";
import Link from "next/link";
import { getAllPolicies } from "@/lib/policies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "政策解读",
  description: "北京中考招生政策详细解读，包括校额到校、指标分配、志愿填报等核心政策。",
};

export default function PoliciesPage() {
  const policies = getAllPolicies();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">政策解读</h1>
        <p className="text-muted-foreground">
          详细解读北京市中考招生政策，帮助初三学生和家长准确理解升学规则。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {policies.map((policy) => (
          <Link key={policy.slug} href={`/policies/${policy.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">{policy.category}</Badge>
                <CardTitle className="text-base leading-snug">{policy.title}</CardTitle>
                <CardDescription className="line-clamp-3">{policy.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">{policy.date}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
