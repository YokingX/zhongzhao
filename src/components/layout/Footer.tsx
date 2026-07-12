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
              本网站为非官方升学信息参考平台，数据来源于北京教育考试院公开信息，仅供参考，以官方发布为准。
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
                <Link href="/policies" className="text-primary hover:underline">
                  政策解读
                </Link>
              </li>
              <li>
                <Link href="/guide" className="text-primary hover:underline">
                  志愿填报攻略
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} 北京中考升学指导 · 非北京教育考试院官方网站
        </div>
      </div>
    </footer>
  );
}
