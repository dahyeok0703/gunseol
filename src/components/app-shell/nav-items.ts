import { LayoutDashboard, FileText, Hammer, Users, Settings, type LucideIcon } from "lucide-react";
import type { Route } from "next";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
}

/** 하단 탭바 + 상단바에서 공유하는 내비게이션 정의 */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/estimates", label: "견적", icon: FileText },
  { href: "/sites", label: "현장", icon: Hammer },
  { href: "/clients", label: "거래처", icon: Users },
  { href: "/settings", label: "설정", icon: Settings },
];
