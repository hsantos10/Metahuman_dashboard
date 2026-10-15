"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Brain,
  Box,
  Footprints,
  LineChart,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "Paper",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard, description: "The four findings" },
      { label: "Force replay", href: "/replay", icon: Footprints, description: "3D: measured vs predicted force" },
      { label: "Results", href: "/results", icon: LineChart, description: "Every number, with charts" },
    ],
  },
  {
    title: "Archive · TMLR version",
    items: [
      { label: "Benchmarks", href: "/benchmarks", icon: BarChart3, description: "Superseded results" },
      { label: "Interpretability", href: "/interpretability", icon: Brain, description: "Attention analysis (dropped)" },
      { label: "3D viewer", href: "/reconstructor", icon: Box, description: "Original motion viewer" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-[52px] items-center justify-between px-4 bg-zinc-950 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--tamu)] shrink-0" />
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-white">
            MetaHuman GRF
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-zinc-400 hover:text-white"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Overlay (mobile) ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={close}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-60 flex-col bg-zinc-950 border-r border-zinc-800/60 transition-transform duration-200",
          "md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-4 border-b border-zinc-800/60 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--tamu)] shrink-0" />
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-white">
                MetaHuman GRF
              </span>
            </div>
            <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600 pl-[18px]">
              Texas A&amp;M University
            </p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="md:hidden p-1 text-zinc-600 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.title} className="mb-3">
              <p className="px-2 pb-2 pt-1 text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600">
                {g.title}
              </p>
              {g.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    title={item.description}
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
                        isActive
                          ? "text-[color:var(--tamu)]"
                          : "text-zinc-600 group-hover:text-zinc-300"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer stat */}
        <div className="p-4 border-t border-zinc-800/60">
          <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600 mb-2">
            Leakage inflation
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[color:var(--tamu)] tabular-nums">
              +0.04–0.19
            </span>
            <span className="text-xs text-zinc-500">R²</span>
          </div>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            trial split vs subject held out
          </p>
          <p className="mt-3 text-[9px] font-mono text-zinc-700">
            Texas A&amp;M · v2 · Oct 2026
          </p>
        </div>
      </aside>
    </>
  );
}
