"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, School, BarChart3, ClipboardList, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "首页", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/schools",
    label: "学校",
    icon: School,
    match: (p: string) => p === "/schools" || p.startsWith("/schools/"),
  },
  {
    href: "/scores",
    label: "分数线",
    icon: BarChart3,
    match: (p: string) => p === "/scores" || p.startsWith("/scores/"),
  },
  { href: "/guide", label: "攻略", icon: ClipboardList, match: (p: string) => p.startsWith("/guide") },
  {
    href: "/assist",
    label: "助手",
    icon: MessageSquareText,
    match: (p: string) => p.startsWith("/assist"),
  },
];

function listHref(base: string, pathname: string, qs: string): string {
  if (pathname === base) {
    return qs ? `${base}?${qs}` : base;
  }
  return base;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="移动端主导航"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active = item.match(pathname);
          const href =
            item.href === "/schools" || item.href === "/scores"
              ? listHref(item.href, pathname, qs)
              : item.href;
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex min-h-[3.25rem] min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
