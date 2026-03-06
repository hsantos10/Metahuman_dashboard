"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Brain,
  Box,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    description: "ICF architecture & key results",
  },
  {
    label: "Benchmarks",
    href: "/benchmarks",
    icon: BarChart3,
    description: "Model comparison & all metrics",
  },
  {
    label: "Interpretability",
    href: "/interpretability",
    icon: Brain,
    description: "Attention analysis & patterns",
  },
  {
    label: "3D Viewer",
    href: "/reconstructor",
    icon: Box,
    description: "Interactive motion visualization",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col bg-zinc-950 border-r border-zinc-800/60">
      {/* TAMU Header */}
      <div className="px-4 pt-5 pb-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--tamu)] shrink-0" />
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-white">
            MetaHuman GRF
          </span>
        </div>
        <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600 pl-[18px]">
          ImprovedConvFormer
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="px-2 pb-2 pt-1 text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150 border",
                isActive
                  ? "bg-[color:var(--tamu-muted)] text-[color:var(--tamu)] border-[color:var(--tamu)]/20 font-medium"
                  : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200 border-transparent font-normal"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-[color:var(--tamu)]" : "text-zinc-600 group-hover:text-zinc-300"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer stat */}
      <div className="p-4 border-t border-zinc-800/60">
        <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600 mb-2">
          ICF GL LOSO R²
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[color:var(--tamu)] tabular-nums">0.655</span>
          <span className="text-xs text-zinc-500">mean</span>
        </div>
        <p className="text-[10px] text-zinc-600 mt-0.5">Best: GL7 · R² = 0.810</p>
        <div className="mt-3 h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full w-[66%] rounded-full bg-[color:var(--tamu)]" />
        </div>
        <p className="mt-3 text-[9px] font-mono text-zinc-700">Texas A&amp;M · v1.0</p>
      </div>
    </aside>
  );
}
