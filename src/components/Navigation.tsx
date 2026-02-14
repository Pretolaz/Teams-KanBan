
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquareText, Settings, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Visão Geral', icon: LayoutDashboard, href: '/' },
  { label: 'Kanban', icon: Kanban, href: '/kanban' },
  { label: 'Respostas Rápidas', icon: MessageSquareText, href: '/responses' },
  { label: 'Simulador Teams', icon: MessageSquareText, href: '/simulator' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r flex flex-col p-4 z-50">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
          T
        </div>
        <h1 className="text-xl font-bold font-headline text-primary">TeamsFlow</h1>
      </div>

      <div className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="pt-4 border-t">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            pathname === '/settings' && "bg-primary text-primary-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          Configurações
        </Link>
      </div>
    </nav>
  );
}
