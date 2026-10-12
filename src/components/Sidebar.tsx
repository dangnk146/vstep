'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  GraduationCap,
  Headphones,
  Mic,
  Moon,
  PenTool,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const skillItems: NavItem[] = [
  { name: 'Listening', href: '/listening', icon: Headphones },
  { name: 'Reading', href: '/reading', icon: BookOpen },
  { name: 'Writing', href: '/writing', icon: PenTool },
  { name: 'Speaking', href: '/speaking', icon: Mic },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const activeSection = pathname.startsWith('/listening/')
    ? pathname.match(/\/(part[123])\//)?.[1] ?? 'part1'
    : pathname === '/writing'
      ? searchParams.get('task') ?? 'task1'
      : pathname === '/speaking'
        ? searchParams.get('part') ?? 'part1'
        : '';

  const sectionItems = pathname === '/writing'
    ? [
        { id: 'task1', label: 'Task 1' },
        { id: 'task2', label: 'Task 2' },
        { id: 'free', label: 'Tự do' },
      ]
    : pathname === '/speaking' || pathname.startsWith('/listening/')
      ? [
          { id: 'part1', label: 'Part 1' },
          { id: 'part2', label: 'Part 2' },
          { id: 'part3', label: 'Part 3' },
        ]
      : null;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      {sectionItems && (
        <nav className="absolute bottom-full left-1/2 z-10 flex -translate-x-1/2 items-end gap-1 pb-0.5" aria-label="Chọn phần luyện tập">
          {sectionItems.map(({ id, label }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  if (pathname === '/writing' || pathname === '/speaking') {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set(pathname === '/writing' ? 'task' : 'part', id);
                    window.history.pushState(null, '', `${pathname}?${params.toString()}`);
                  }
                  window.dispatchEvent(new CustomEvent('vstep:select-section', {
                    detail: { skill: pathname === '/writing' ? 'writing' : pathname === '/speaking' ? 'speaking' : 'listening', section: id },
                  }));
                }}
                className={`min-w-14 rounded-t-md border border-b-0 px-2.5 py-1 text-[9px] font-bold transition-all duration-200 sm:min-w-16 sm:px-3 sm:text-[10px] ${
                  active
                    ? '-translate-y-1 border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'border-transparent bg-card/80 text-muted-foreground hover:-translate-y-1 hover:border-border hover:bg-card hover:text-foreground hover:shadow-md'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      )}
      <div className="relative mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-2 px-2 sm:px-4">
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/"
            className="hidden shrink-0 items-center gap-1.5 text-xs font-extrabold text-foreground sm:flex"
            aria-label="VSTEP Prep - Trang chủ"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="hidden md:inline">VSTEP Prep</span>
          </Link>
          {[
            { name: 'Ngân hàng đề', href: '/prompts', icon: Sparkles },
          ].map(({ name, href, icon: Icon }) => {
            const active = href === '/'
              ? pathname === '/'
              : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-8 shrink-0 items-center gap-1 rounded-lg px-1.5 text-[9px] font-bold transition-colors sm:h-9 sm:gap-1.5 sm:px-2 sm:text-[10px] ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="whitespace-nowrap">{name === 'Ngân hàng đề' ? 'Đề thi' : name}</span>
              </Link>
            );
          })}
        </div>

        <nav aria-label="Bốn kỹ năng" className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center gap-0.5">
          {skillItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href
              || ((href === '/writing' || href === '/speaking')
                && pathname.startsWith(`${href}/`)
                && pathname !== `${href}/settings`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-8 min-w-9 items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-bold transition-colors sm:h-9 sm:min-w-0 sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden whitespace-nowrap sm:inline">{name}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
          aria-label={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
          title={theme === 'light' ? 'Giao diện tối' : 'Giao diện sáng'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
