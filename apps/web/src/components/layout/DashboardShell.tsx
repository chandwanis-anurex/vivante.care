import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageHero } from './PageHero';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
}

interface DashboardHero {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
}

interface DashboardShellProps {
  navItems: NavItem[];
  hero: DashboardHero;
  children: ReactNode;
}

export function DashboardShell({ navItems, hero, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <PageHero
        imageUrl="/images/vivantecare-nurse-banner.jpg"
        minHeight="min-h-[420px]"
        titleClassName="text-5xl"
        {...hero}
      />
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
