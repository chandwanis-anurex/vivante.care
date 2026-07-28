import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
}

interface DashboardShellProps {
  navItems: NavItem[];
  children: ReactNode;
}

export function DashboardShell({ navItems, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="flex-1 flex max-w-[1320px] w-full mx-auto">
        <aside className="w-[220px] shrink-0 border-r border-charcoal/10 py-8 pr-4 hidden md:block">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-2.5 text-md font-semibold border-l-2',
                    isActive
                      ? 'border-navy text-navy bg-navy/[0.06]'
                      : 'border-transparent text-charcoal/70 hover:text-navy hover:bg-navy/[0.03]'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0 py-8 px-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
