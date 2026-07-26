'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { 
  BookOpen, 
  Headphones, 
  PenTool, 
  Mic, 
  Home, 
  Sun, 
  Moon, 
  Menu, 
  X,
  GraduationCap
} from 'lucide-react';

interface SubNavItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  subItems?: SubNavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: '📊 Dashboard', href: '/', icon: Home },
    { name: '📖 Reading', href: '/reading', icon: BookOpen },
    { name: '🎧 Listening', href: '/listening', icon: Headphones },
    { 
      name: '✍️ Writing', 
      href: '/writing', 
      icon: PenTool,
      subItems: [
        { name: '📝 Luyện viết bài', href: '/writing' },
        { name: '⚙️ Cài đặt bài mẫu', href: '/writing/settings' }
      ]
    },
    { 
      name: '🗣️ Speaking', 
      href: '/speaking', 
      icon: Mic,
      subItems: [
        { name: '🎙️ Luyện nói', href: '/speaking' },
        { name: '⚙️ Cài đặt mẫu nói', href: '/speaking/settings' }
      ]
    },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-6 py-4 md:hidden border-b border-border bg-card">
        <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-xl">
          <GraduationCap className="h-6 w-6" />
          <span>VSTEP Hub</span>
        </Link>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card px-6 py-8 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:h-screen md:flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="hidden md:flex items-center space-x-3 mb-8">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            VSTEP Prep
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-3 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isExactActive = pathname === item.href;
            const isParentActive = pathname.startsWith(item.href) && item.href !== '/';
            const Icon = item.icon;

            return (
              <div key={item.name} className="space-y-1.5">
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all duration-200
                    ${isExactActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                      : isParentActive
                        ? 'bg-muted text-foreground font-bold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'}
                  `}
                >
                  <span>{item.name}</span>
                </Link>

                {/* Subnav links */}
                {item.subItems && (
                  <div className="pl-9 space-y-1 border-l border-border ml-6 transition-all duration-200">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsOpen(false)}
                          className={`
                            block px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                            ${isSubActive 
                              ? 'text-primary bg-primary/5 font-bold border-l-2 border-primary pl-2' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'}
                          `}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer with Dark mode toggle (Desktop) */}
        <div className="hidden md:block border-t border-border pt-6 mt-auto">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              {theme === 'light' ? (
                <>
                  <Moon className="h-5 w-5" />
                  <span className="font-medium text-sm">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5" />
                  <span className="font-medium text-sm">Light Mode</span>
                </>
              )}
            </div>
            <div className="w-8 h-4 bg-muted-foreground/30 dark:bg-primary/30 rounded-full relative transition-colors duration-200">
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-card transition-all duration-200 ${theme === 'dark' ? 'right-0.5 bg-primary' : 'left-0.5'}`} />
            </div>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
