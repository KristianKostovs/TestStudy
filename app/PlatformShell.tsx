"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- native navigation avoids vinext RSC prefetch failures in production */

import { usePathname } from "next/navigation";

const platformNav = [
  { href: "/", short: "总", label: "成长总览", matches: (path: string) => path === "/" },
  { href: "/learn", short: "学", label: "学习中心", matches: (path: string) => path === "/learn" || path.startsWith("/courses/") || path === "/grading-queue" },
  { href: "/interview", short: "练", label: "面试成长", matches: (path: string) => path.startsWith("/interview") },
  { href: "/radar", short: "新", label: "技术雷达", matches: (path: string) => path.startsWith("/radar") },
  { href: "/growth", short: "迹", label: "成长档案", matches: (path: string) => path.startsWith("/growth") },
];

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  return (
    <div className="unified-platform-shell">
      <aside className="platform-rail" aria-label="测试成长平台主导航">
        <a className="platform-rail-brand" href="/" aria-label="测试成长平台首页">
          <strong>AT</strong>
          <span>测试成长</span>
        </a>
        <nav>
          {platformNav.map((item) => (
            <a
              className={item.matches(pathname) ? "active" : ""}
              href={item.href}
              key={item.href}
              aria-current={item.matches(pathname) ? "page" : undefined}
            >
              <i>{item.short}</i>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <p>学习与面试<br />共用一套能力地图</p>
      </aside>
      <div className="platform-stage">{children}</div>
    </div>
  );
}
