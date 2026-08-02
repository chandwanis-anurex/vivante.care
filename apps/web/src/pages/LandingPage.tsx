import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { PRODUCTS } from '@/lib/products';
import {
  Radar,
  ShieldCheck,
  HeartHandshake,
  Target,
  PiggyBank,
  ClipboardCheck,
  CheckCircle2,
  Gauge,
  Clock,
} from 'lucide-react';

const DASHBOARD_STATS = [
  { icon: ClipboardCheck, value: '126', label: 'Open Shifts' },
  { icon: CheckCircle2, value: '1,048', label: 'Filled Shifts' },
  { icon: Gauge, value: '97%', label: 'Fill Rate' },
  { icon: Clock, value: '18.4 hrs', label: 'Avg. Time to Fill' },
];

const BENEFITS = [
  { icon: Radar, title: 'Smarter Staffing', desc: 'Fill shifts faster with AI-powered matching.' },
  { icon: ShieldCheck, title: 'Stronger Compliance', desc: 'Reduce risk and stay audit-ready.' },
  { icon: HeartHandshake, title: 'Healthier Workforce', desc: 'Drive satisfaction and retention.' },
  { icon: Target, title: 'Better Outcomes', desc: 'Improve quality of care.' },
  { icon: PiggyBank, title: 'Lower Cost of Care', desc: 'Optimize resources and reduce waste.' },
];

const WHY_CHECKLIST = [
  'Technology that drives efficiency and saves time',
  'Access to top-vetted, highly qualified clinicians',
  'Reduced agency dependency and costs',
  'Stronger compliance and reduced risk',
  'Better retention and workforce stability',
  'A true strategic workforce partner',
];

export function LandingPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative w-full min-h-[420px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/vivantecare-nurse-banner.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-navy/10" />

        <div className="relative z-10 max-w-[640px] p-10 py-16">
          <h1 className="text-9xl font-extrabold leading-tight">
            <span className="block text-navy">Intelligence</span>
            <span className="block text-teal">Behind Every Shift</span>
          </h1>
          <div className="w-[90px] h-[5px] bg-teal my-5" />
          <p className="text-4xl font-bold text-navy mb-3.5">
            Everything Healthcare Needs to Build a Smarter Workforce.
          </p>
          <p className="text-2xl leading-relaxed text-muted max-w-[440px]">
            Vivante.Care connects the right people, the right credentials, and the right
            insights&mdash;so healthcare organizations can move faster, stay compliant, and
            deliver exceptional care.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="flex items-center gap-4 max-w-[1000px] mx-auto px-6 md:px-12 py-10">
        <div className="flex-1 h-[3px] bg-charcoal/10" />
        <div className="text-3xl font-bold text-navy whitespace-nowrap">
          Four Intelligent Products. One Unified Platform.
        </div>
        <div className="flex-1 h-[3px] bg-charcoal/10" />
      </div>

      {/* Product ecosystem */}
      <section id="how-it-works" className="max-w-[1320px] mx-auto px-6 md:px-12 pb-14">
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {PRODUCTS.map((p, i) => {
            const FallbackIcon = p.features[0].icon;
            return (
            <div key={p.name} className="flex items-center flex-1">
              <Link to={`/products/${p.slug}`} className="flex-1 min-w-0 h-full">
                <Card
                  accent={p.accent}
                  className="relative h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                >
                  {p.headshot ? (
                    <img
                      src={p.headshot}
                      alt=""
                      className={`absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full object-cover border-4 bg-white shadow-md ${p.ring}`}
                    />
                  ) : (
                    <div
                      className={`absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full flex items-center justify-center border-4 bg-white shadow-md ${p.ring}`}
                    >
                      <FallbackIcon className={p.color} size={44} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className={`text-4xl font-extrabold ${p.color}`}>{p.name}</div>
                  <div className="text-base text-muted mb-4 mt-1">{p.tagline}</div>
                  <div className="flex flex-col gap-2.5 mb-4">
                    {p.features.map((f) => (
                      <div
                        key={f.label}
                        className="flex items-center gap-2.5 text-md font-semibold text-navy"
                      >
                        <f.icon className={p.color} size={20} strokeWidth={1.8} />
                        {f.label}
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 max-w-[70%]">
                    <div className="text-base text-muted leading-relaxed">{p.closingLine}</div>
                    <div className={`text-base font-bold leading-relaxed ${p.color}`}>
                      {p.closingHighlight}
                    </div>
                  </div>
                </Card>
              </Link>
              {i < PRODUCTS.length - 1 && (
                <div
                  className={`hidden md:flex items-center justify-center w-11 h-11 border-2 border-current -mx-3.5 bg-white relative z-10 shrink-0 ${p.color}`}
                >
                  &rarr;
                </div>
              )}
            </div>
            );
          })}
        </div>
      </section>

      {/* VivanteIQ dark stats panel */}
      <section className="bg-navy py-14 px-6 md:px-12">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-7xl font-extrabold text-teal mb-1.5">VivanteIQ™</div>
            <div className="text-xl font-semibold text-white/60 mb-4">
              Executive Workforce Intelligence
            </div>
            <p className="text-xl leading-relaxed text-white/80 mb-6 max-w-[520px]">
              Real-time visibility across your entire workforce. Smarter insights. Faster
              decisions. Better outcomes.
            </p>
            <div className="flex flex-wrap gap-3">
              {DASHBOARD_STATS.map((s) => (
                <div
                  key={s.label}
                  className="bg-white/[0.06] border border-white/10 p-3.5 w-[118px]"
                >
                  <s.icon className="text-teal mb-2" size={28} strokeWidth={1.8} />
                  <div className="text-2xl font-extrabold text-white">{s.value}</div>
                  <div className="text-sm text-white/60 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center gap-4 h-[376px]">
            <img
              src="/images/vivanteiq-laptop.jpg"
              alt="VivanteIQ analytics dashboard on a laptop"
              className="h-full w-full max-w-[75%] object-cover border border-white/15"
            />
            <img
              src="/images/vivanteiq-phone.jpg"
              alt="VivanteIQ workforce app on a phone"
              className="h-[260px] w-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Utility link row */}
      <div className="py-7 px-6 md:px-12 flex items-center justify-center gap-12 bg-gray">
        <a href="#how-it-works" className="text-xl font-bold text-navy no-underline hover:text-teal">
          How it Works?
        </a>
        <a href="#faqs" className="text-xl font-bold text-navy no-underline hover:text-teal">
          FAQs
        </a>
        <a
          href="#see-for-yourself"
          className="text-xl font-bold text-navy no-underline hover:text-teal"
        >
          See For Yourself
        </a>
      </div>

      {/* Built for Healthcare */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-[1320px] mx-auto">
          <div className="text-6xl font-extrabold text-navy mb-8">
            Built for Healthcare. Designed for Impact.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="text-center">
                <div className="w-[86px] h-[62px] bg-teal/10 mx-auto mb-3 flex items-center justify-center">
                  <b.icon className="text-teal" size={22} strokeWidth={1.8} />
                </div>
                <div className="text-lg font-bold text-navy mb-1">{b.title}</div>
                <div className="text-base text-muted leading-relaxed">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section id="see-for-yourself" className="bg-graytint py-12 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <div className="text-2xl font-extrabold text-navy mb-[18px]">
              Why Healthcare Organizations Choose Vivante.Care
            </div>
            <div className="flex flex-col gap-3">
              {WHY_CHECKLIST.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 bg-teal shrink-0 mt-0.5" />
                  <div className="text-lg text-charcoal leading-relaxed">{item}</div>
                </div>
              ))}
            </div>
          </div>
          <img
            src="/images/healthcare-meeting.jpg"
            alt="Healthcare organization leadership reviewing workforce data"
            className="h-[287px] w-full object-cover border border-navy/15"
          />
        </div>
      </section>
    </PageShell>
  );
}
