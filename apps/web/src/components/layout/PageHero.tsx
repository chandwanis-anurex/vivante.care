import type { ReactNode } from 'react';

interface PageHeroProps {
  imageUrl: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  minHeight?: string;
  titleClassName?: string;
}

/**
 * Hero section pattern per vivantecare_design_system.md section 4:
 * full-bleed background photo, left-opaque-to-right-transparent scrim,
 * foreground copy block capped at 640px. Every page reuses this shell;
 * only `imageUrl` (and copy) changes per page.
 */
export function PageHero({
  imageUrl,
  eyebrow,
  title,
  subtitle,
  children,
  minHeight = 'min-h-[420px]',
  titleClassName = 'text-7xl',
}: PageHeroProps) {
  return (
    <section className={`relative w-full ${minHeight} overflow-hidden`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-navy/25" />

      <div className="relative z-10 max-w-[640px] p-10">
        {eyebrow && (
          <div className="text-xs font-bold tracking-wide text-teal uppercase mb-4">
            {eyebrow}
          </div>
        )}
        <h1 className={`${titleClassName} font-extrabold text-charcoal leading-tight`}>{title}</h1>
        {subtitle && <p className="mt-5 text-xl text-charcoal/80">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
