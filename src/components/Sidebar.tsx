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
  const { toggleTheme } = useTheme();
  const activeSection = pathname.startsWith('/listening/')
    ? pathname.match(/\/(part[123])\//)?.[1] ?? 'part1'
    : pathname.startsWith('/reading/')
      ? pathname.match(/^\/reading\/(part[1-6])(?:\/|$)/)?.[1] ?? 'part1'
    : pathname === '/reading' || pathname.startsWith('/reading/')
      ? searchParams.get('part') ?? 'part1'
    : pathname.startsWith('/writing/')
      ? pathname.match(/^\/writing\/(task1|task2|free)$/)?.[1] ?? 'task1'
    : pathname === '/writing'
      ? searchParams.get('task') ?? 'task1'
      : pathname.startsWith('/speaking/')
        ? pathname.match(/^\/speaking\/(part[123])$/)?.[1] ?? 'part1'
      : pathname === '/speaking'
        ? searchParams.get('part') ?? 'part1'
        : '';

  const sectionItems = pathname === '/writing' || /^\/writing\/(task1|task2|free)$/.test(pathname)
    ? [
        { id: 'task1', label: 'Task 1' },
        { id: 'task2', label: 'Task 2' },
        { id: 'free', label: 'Tự do' },
      ]
    : pathname === '/reading' || pathname.startsWith('/reading/')
      ? Array.from({ length: 6 }, (_, index) => ({
          id: `part${index + 1}`,
          label: `Part ${index + 1}`,
        }))
    : pathname === '/speaking' || /^\/speaking\/part[123]$/.test(pathname) || pathname.startsWith('/listening/')
      ? [
          { id: 'part1', label: 'Part 1' },
          { id: 'part2', label: 'Part 2' },
          { id: 'part3', label: 'Part 3' },
        ]
      : null;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      {sectionItems && (
        <nav
          className="absolute bottom-full left-1/2 z-10 -mb-px flex -translate-x-1/2 max-w-[96vw] items-end gap-1 overflow-x-auto px-1 pb-0 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Chọn phần luyện tập"
        >
          {sectionItems.map(({ id, label }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  if (pathname === '/reading' || pathname.startsWith('/reading/')) {
                    window.history.pushState(null, '', `/reading/${id}/passage1`);
                  } else if (pathname === '/writing' || /^\/writing\/(task1|task2|free)$/.test(pathname)) {
                    window.history.pushState(null, '', `/writing/${id}`);
                  } else if (pathname === '/speaking' || /^\/speaking\/part[123]$/.test(pathname)) {
                    window.history.pushState(null, '', `/speaking/${id}`);
                  }
                  window.dispatchEvent(new CustomEvent('vstep:select-section', {
                    detail: {
                      skill: pathname === '/writing' || pathname.startsWith('/writing/')
                        ? 'writing'
                        : pathname === '/speaking' || pathname.startsWith('/speaking/')
                          ? 'speaking'
                          : pathname === '/reading'
                            ? 'reading'
                            : 'listening',
                      section: id,
                    },
                  }));
                }}
                className={`flex h-8 shrink-0 items-center justify-center rounded-t-md border border-b-0 px-3 text-[11px] font-bold transition-colors cursor-pointer sm:h-8.5 sm:px-4 sm:text-xs ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-xs font-black'
                    : 'border-border/70 bg-card/90 text-muted-foreground hover:bg-card hover:text-foreground hover:border-border'
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
              || ((href === '/listening' || href === '/reading')
                && pathname.startsWith(`${href}/`))
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
          aria-label="Đổi giao diện sáng/tối"
          title="Đổi giao diện sáng/tối"
        >
          <Moon className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
