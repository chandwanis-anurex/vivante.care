import type { LucideIcon } from 'lucide-react';
import {
  Share2,
  Users,
  Calendar,
  Zap,
  CreditCard,
  ShieldCheck,
  FileText,
  UserCheck,
  BarChart3,
  LayoutDashboard,
  HeartPulse,
  TrendingUp,
  GraduationCap,
  ClipboardList,
  Home,
  BadgeCheck,
} from 'lucide-react';

export interface ProductInfo {
  slug: string;
  name: string;
  tagline: string;
  accent: 'teal' | 'purple' | 'navy' | 'cyan';
  color: string;
  ring: string;
  headshot?: string;
  features: { icon: LucideIcon; label: string }[];
  closingLine: string;
  closingHighlight: string;
  howItWorks: string[];
  externalUrl?: string;
}

export const PRODUCTS: ProductInfo[] = [
  {
    slug: 'haas',
    name: 'VivanteHaaS™',
    tagline: 'AI-Powered Staffing & Matching',
    accent: 'teal',
    color: 'text-teal',
    ring: 'border-teal',
    headshot: '/images/headshot-haas.png',
    features: [
      { icon: Share2, label: 'AI Matching' },
      { icon: Users, label: 'Staffing' },
      { icon: Calendar, label: 'Scheduling' },
      { icon: Zap, label: 'Rapid Response' },
    ],
    closingLine: 'Find the right clinician.',
    closingHighlight: 'Fill the right shift. Faster.',
    howItWorks: [
      'A healthcare organization posts what they need — the role, the shift, the qualifications.',
      "VivanteHaaS's AI compares that request against every available, qualified clinician in the network.",
      'The organization gets a ranked shortlist instead of manually searching through resumes.',
      'Once someone is a fit, the shift gets filled and everyone is notified automatically.',
    ],
  },
  {
    slug: 'passport',
    name: 'VivantePassport™',
    tagline: 'Verified Digital Identity',
    accent: 'purple',
    color: 'text-purple',
    ring: 'border-purple',
    headshot: '/images/headshot-passport.jpg',
    features: [
      { icon: CreditCard, label: 'Credentials' },
      { icon: ShieldCheck, label: 'Compliance' },
      { icon: FileText, label: 'Licenses' },
      { icon: UserCheck, label: 'Background Verification' },
    ],
    closingLine: 'One verified profile.',
    closingHighlight: 'Any organization. Every time.',
    howItWorks: [
      'A healthcare worker builds one digital profile: license, certifications, experience, background check.',
      'That single profile travels with them to every organization they work with on the platform.',
      "No more re-submitting the same paperwork for every new assignment — it's already verified and current.",
      'Organizations get instant confidence that who they\'re hiring is exactly who they say they are.',
    ],
  },
  {
    slug: 'iq',
    name: 'VivanteIQ™',
    tagline: 'Executive Workforce Intelligence',
    accent: 'navy',
    color: 'text-navy',
    ring: 'border-navy',
    headshot: '/images/headshot-iq.jpg',
    features: [
      { icon: BarChart3, label: 'Analytics' },
      { icon: LayoutDashboard, label: 'Executive Dashboard' },
      { icon: HeartPulse, label: 'Workforce Health' },
      { icon: TrendingUp, label: 'Forecasting' },
    ],
    closingLine: 'Turn workforce data',
    closingHighlight: 'into smarter decisions.',
    howItWorks: [
      'Every shift, match, and placement across the organization feeds into one live dashboard.',
      'Leadership sees open shifts, fill rates, and time-to-fill at a glance instead of piecing it together from spreadsheets.',
      'Trends surface early — where staffing is tightening, where it\'s healthy — so leaders can act before it becomes a crisis.',
      'The result: staffing decisions based on real numbers, not gut feel.',
    ],
  },
  {
    slug: 'homecare',
    name: 'VivanteHomeCare™',
    tagline: 'Home Caregiver Training & Certification',
    accent: 'cyan',
    color: 'text-cyan',
    ring: 'border-cyan',
    features: [
      { icon: GraduationCap, label: 'Training' },
      { icon: BadgeCheck, label: 'State Certification' },
      { icon: Home, label: 'In-Home Care' },
      { icon: ClipboardList, label: 'Step-by-Step Guidance' },
    ],
    closingLine: 'Help a family member',
    closingHighlight: 'become a certified caregiver.',
    howItWorks: [
      'A family member who wants to care for an eligible loved one at home starts the program.',
      'VivanteHomeCare walks them through the training their state requires — every state\'s certification is different (in New Jersey, for example, it\'s the Homemaker Health Aide certification).',
      'They complete the required coursework and hands-on training at their own pace, with guidance at every step.',
      'Once certified, they\'re qualified — and in many cases eligible to be compensated — to provide that care at home.',
    ],
    // No live site yet — VivanteHomeCare's actual program runs on a
    // separate website that hasn't been built. Left unset rather than
    // pointed at a placeholder/dead URL; the detail page shows this as
    // "coming soon" instead of a real link.
  },
];

export function getProduct(slug: string | undefined): ProductInfo | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
