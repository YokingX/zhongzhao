import Link from "next/link";
import { School, BarChart3, BookOpen, ClipboardList, Calendar, ArrowRight, Smartphone, GitCompare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSchoolCounts } from "@/lib/schools";
import { getAllPolicies } from "@/lib/policies";

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const quickLinks = [
  {
    href: "/schools",
    icon: School,
    title: "学校库",
    description: "浏览北京优质高中信息",
    color: "bg-blue-50 text-blue-700",
  },
  {
    href: "/compare",
    icon: GitCompare,
    title: "学校对比",
    description: "最多 3 所并排比较",
    color: "bg-teal-50 text-teal-700",
  },
  {
    href: "/scores",
    icon: BarChart3,
    title: "分数线查询",
    description: "历年录取分数线对比",
    color: "bg-green-50 text-green-700",
  },
  {
    href: "/policies",
    icon: BookOpen,
    title: "政策解读",
    description: "中招政策详细解读",
    color: "bg-purple-50 text-purple-700",
  },
  {
    href: "/guide",
    icon: ClipboardList,
    title: "填报攻略",
    description: "志愿填报技巧指南",
    color: "bg-orange-50 text-orange-700",
  },
];

const keyDates = [
  { label: "中考", date: "2026-06-24" },
  { label: "成绩公布", date: "2026-07-09" },
  { label: "志愿填报", date: "2026-07-13" },
  { label: "志愿填报截止", date: "2026-07-17" },
];

export default async function HomePage() {
  const { total: schoolCount, withScores } = await getSchoolCounts();
  const policies = getAllPolicies().slice(0, 3);
  const zhongkaoDays = getDaysUntil("2026-06-24");
  const volunteerDays = getDaysUntil("2026-07-13");

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-0">
            非官方参考平台
          </Badge>
          <Link
            href="/open"
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white hover:bg-white/25 md:hidden"
          >
            <Smartphone className="h-3.5 w-3.5" />
            安卓 / 微信用户访问指南
          </Link>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            北京中考升学指导
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-blue-100">
            为初三学生及家长提供学校信息、分数线查询、政策解读和志愿填报攻略，助力科学备考、理性择校。
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur">
              <div className="text-3xl font-bold">{zhongkaoDays > 0 ? zhongkaoDays : 0}</div>
              <div className="text-sm text-blue-100">距离中考（天）</div>
            </div>
            <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur">
              <div className="text-3xl font-bold">{volunteerDays > 0 ? volunteerDays : 0}</div>
              <div className="text-sm text-blue-100">距离志愿填报（天）</div>
            </div>
            <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur">
              <div className="text-3xl font-bold">{schoolCount}</div>
              <div className="text-sm text-blue-100">收录普高（所）</div>
            </div>
            <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur">
              <div className="text-3xl font-bold">{withScores}</div>
              <div className="text-sm text-blue-100">有分数线（所）</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">快捷入口</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg ${link.color}`}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Key Dates */}
      <section className="bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">关键时间节点</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/timeline">
                查看完整日历
                <Calendar className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {keyDates.map((item) => {
              const days = getDaysUntil(item.date);
              return (
                <Card key={item.date}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="mt-1 text-lg font-semibold">{item.date}</div>
                    <div className="mt-2 text-sm text-primary">
                      {days > 0 ? `还有 ${days} 天` : days === 0 ? "就是今天" : "已结束"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Policies */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">最新政策解读</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/policies">
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {policies.map((policy) => (
            <Link key={policy.slug} href={`/policies/${policy.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">{policy.category}</Badge>
                  <CardTitle className="text-base leading-snug">{policy.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{policy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">{policy.date}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Admission Batches Overview */}
      <section className="bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">三大录取批次</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Badge className="w-fit">第一批次</Badge>
                <CardTitle>提前招生</CardTitle>
                <CardDescription>8个志愿，每校1个专业</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  含贯通培养项目（≥380分）、艺术体育特长生等。被提前录取后不再参加后续批次。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="w-fit">第二批次</Badge>
                <CardTitle>指标分配招生</CardTitle>
                <CardDescription>8个志愿，每校2个专业</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  含校额到校和市级统筹。需≥430分、综评B等、三年学籍。优质高中50%以上计划分配至初中。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Badge variant="accent" className="w-fit">第三批次</Badge>
                <CardTitle>统一招生</CardTitle>
                <CardDescription>12个志愿，每志愿2个专业</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  最主要的录取批次，按考生总分从高到低、依照志愿顺序择优录取。
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 text-center">
            <Button asChild>
              <Link href="/guide">查看志愿填报攻略</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
