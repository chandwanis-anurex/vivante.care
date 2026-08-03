import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { PRODUCTS } from '@/lib/products';
import {
  ClipboardCheck,
  CheckCircle2,
  Gauge,
  Clock,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Quote,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Eye,
} from 'lucide-react';

const DASHBOARD_STATS = [
  { icon: ClipboardCheck, value: '126', label: 'Open Shifts' },
  { icon: CheckCircle2, value: '1,048', label: 'Filled Shifts' },
  { icon: Gauge, value: '97%', label: 'Fill Rate' },
  { icon: Clock, value: '18.4 hrs', label: 'Avg. Time to Fill' },
];

const HERO_HIGHLIGHTS = [
  { icon: Sparkles, label: 'AI Powered' },
  { icon: ShieldCheck, label: 'Verified Workforce' },
  { icon: CalendarCheck, label: 'Easier Shift Fills' },
  { icon: Eye, label: 'Better Observability' },
];

const HIRING_STEPS = [
  {
    step: 1,
    title: 'Add a Requirement',
    desc: 'Easily add a staffing requirement using a friendly chat interface.',
  },
  {
    step: 2,
    title: 'AI Matching',
    desc: 'VivanteHaaS AI engine matches the requirement to screened candidates.',
  },
  {
    step: 3,
    title: 'Review & Interview',
    desc: 'Review VivantePassports of qualified staff and interview them.',
  },
  {
    step: 4,
    title: 'Hire & Manage',
    desc: 'Hire the right fit and manage shifts, all in one place.',
  },
];

// Demo copy — no real customers were interviewed for these; standing in
// until real testimonials are supplied.
const TESTIMONIALS = [
  {
    quote:
      'We cut our average time-to-fill nearly in half. The AI matching actually understands what "qualified" means for our unit, not just keyword matching.',
    name: 'Dana Whitfield',
    role: 'Chief Nursing Officer, Regional Health System',
  },
  {
    quote:
      'VivantePassport meant we stopped chasing the same license and background-check paperwork every single assignment. It\'s just already there, verified.',
    name: 'Marcus Ilori',
    role: 'Director of Clinical Staffing, Home Health Network',
  },
  {
    quote:
      'VivanteIQ gave our leadership team a real-time view of fill rates we never had before. We stopped finding out about staffing gaps after they became a crisis.',
    name: 'Priya Anand',
    role: 'VP of Operations, Skilled Nursing Group',
  },
  {
    quote:
      "The chat-based intake for new requirements is the difference between our managers actually using the system and going around it.",
    name: 'Jordan Alvarez',
    role: 'Staffing Manager, Hospice Care Partners',
  },
  {
    quote:
      'Onboarding took an afternoon, not a quarter. We were posting real requirements and reviewing matches the same week.',
    name: 'Renee Castillo',
    role: 'Administrator, Behavioral Health Center',
  },
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

          <div className="flex flex-wrap gap-x-8 gap-y-4 mt-8">
            {HERO_HIGHLIGHTS.map((h) => (
              <div key={h.label} className="flex items-center gap-2.5">
                <h.icon className="text-teal" size={22} strokeWidth={1.8} />
                <span className="text-md font-bold text-navy">{h.label}</span>
              </div>
            ))}
          </div>
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
                      className={`absolute -bottom-[30px] -right-[30px] w-[120px] h-[120px] rounded-full object-cover border-4 bg-white shadow-md ${p.ring}`}
                    />
                  ) : (
                    <div
                      className={`absolute -bottom-[30px] -right-[30px] w-[120px] h-[120px] rounded-full flex items-center justify-center border-4 bg-white shadow-md ${p.ring}`}
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

      {/* Stepped hiring flow (replaces the old "Built for Healthcare" benefits grid) */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-[1320px] mx-auto">
          <div className="text-6xl font-extrabold text-navy mb-3">
            How Hiring Works on VivanteCare.
          </div>
          <p className="text-xl text-muted mb-12 max-w-[720px]">
            From requirement to filled shift — four steps, one platform.
          </p>

          <div className="flex flex-col md:flex-row items-start">
            {HIRING_STEPS.map((s, i) => (
              <div key={s.step} className="flex md:flex-1">
                <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-3 text-left md:text-center">
                  <div className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center text-xl font-extrabold shrink-0">
                    {s.step}
                  </div>
                  <div className="md:px-2">
                    <div className="text-lg font-bold text-navy mb-1">{s.title}</div>
                    <div className="text-sm text-muted leading-relaxed md:max-w-[170px]">{s.desc}</div>
                  </div>
                </div>
                {i < HIRING_STEPS.length - 1 && (
                  <div className="hidden md:block flex-1 h-[2px] bg-teal/30 mt-7 mx-2" />
                )}
              </div>
            ))}
          </div>

          <Card accent="navy" className="mt-14 flex items-start sm:items-center gap-5 flex-wrap sm:flex-nowrap">
            <BrainCircuit className="text-navy shrink-0" size={36} strokeWidth={1.5} />
            <div>
              <div className="text-xl font-extrabold text-navy mb-1.5">
                How VivanteIQ™ Helps
              </div>
              <p className="text-base text-charcoal/70 leading-relaxed max-w-[760px]">
                VivanteIQ sits across this entire flow — surfacing real-time fill rates, match
                quality, and workforce trends at every step, so your team makes faster, smarter
                hiring decisions instead of guessing.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

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

function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  function go(delta: number) {
    setActive((i) => (i + delta + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  return (
    <section className="bg-gray py-16 px-6 md:px-12">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-4xl font-extrabold text-navy mb-10">
          What Healthcare Organizations Are Saying
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="w-full shrink-0 px-2">
                  <Card accent="neutral" className="py-10">
                    <Quote className="text-teal mx-auto mb-4" size={28} strokeWidth={1.8} />
                    <p className="text-xl text-charcoal leading-relaxed italic mb-6">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="text-md font-bold text-navy">{t.name}</div>
                    <div className="text-sm text-muted">{t.role}</div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <button
            aria-label="Previous testimonial"
            onClick={() => go(-1)}
            className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -left-5 w-10 h-10 items-center justify-center bg-white border border-charcoal/15 text-navy hover:border-navy transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Next testimonial"
            onClick={() => go(1)}
            className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -right-5 w-10 h-10 items-center justify-center bg-white border border-charcoal/15 text-navy hover:border-navy transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setActive(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === active ? 'bg-teal' : 'bg-charcoal/20'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
