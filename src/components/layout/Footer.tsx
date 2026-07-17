import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">北京中考升学指导</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              本网站为非官方升学信息参考平台。分数线多为公开信息与网传统招数据交叉整理，
              <strong className="font-medium text-foreground">不是考试院官方数据</strong>
              ，仅供参考，以北京教育考试院当年正式发布为准。
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">官方链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.bjeea.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  北京教育考试院
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link href="/compare" className="text-primary hover:underline">
                  学校对比
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-primary hover:underline">
                  常见问题
                </Link>
              </li>
              <li>
                <Link href="/policies" className="text-primary hover:underline">
                  政策解读
                </Link>
              </li>
              <li>
                <Link href="/assist" className="text-primary hover:underline">
                  AI 志愿助手
                </Link>
              </li>
              <li>
                <Link href="/guide" className="text-primary hover:underline">
                  志愿填报攻略
                </Link>
              </li>
              <li>
                <Link href="/timeline" className="text-primary hover:underline">
                  升学日历
                </Link>
              </li>
              <li>
                <Link href="/rank" className="text-primary hover:underline">
                  估分看区排
                </Link>
              </li>
              <li>
                <Link href="/data" className="text-primary hover:underline">
                  数据说明
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-primary hover:underline">
                  反馈纠错
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} 北京中考升学指导 · 非北京教育考试院官方网站</p>
          <p className="mt-2">
            <Link href="/open" className="text-primary hover:underline">
              手机访问指南
            </Link>
            <span className="mx-2 text-border">·</span>
            <Link href="/faq" className="text-primary hover:underline">
              常见问题
            </Link>
            <span className="mx-2 text-border">·</span>
            <Link href="/data" className="text-primary hover:underline">
              数据说明
            </Link>
            <span className="mx-2 text-border">·</span>
            <Link href="/feedback" className="text-primary hover:underline">
              反馈
            </Link>
            <span className="mx-2 text-border">·</span>
            <a href="/fallback.html" className="text-primary hover:underline">
              备用入口
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
