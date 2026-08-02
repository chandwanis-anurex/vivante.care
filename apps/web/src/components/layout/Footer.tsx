import { Link } from 'react-router-dom';
import { ShieldCheck, Eye, Phone, Mail, Globe, QrCode } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-[1320px] mx-auto px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-8 items-start">
        <div className="flex gap-3.5 items-start min-w-0">
          <ShieldCheck className="text-cyan shrink-0 mt-0.5" size={30} strokeWidth={1.6} />
          <div>
            <div className="text-xl font-extrabold mb-2">Our Promise</div>
            <p className="text-md text-white/60 leading-relaxed">
              We don&apos;t just fill shifts. We build intelligent healthcare workforces that are
              faster, safer and stronger.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 items-start border-t md:border-t-0 md:border-l border-white/15 pt-8 md:pt-0 md:pl-6 min-w-0">
          <Eye className="text-cyan shrink-0 mt-0.5" size={30} strokeWidth={1.6} />
          <div>
            <div className="text-xl font-extrabold mb-2">Our Vision</div>
            <p className="text-md text-white/60 leading-relaxed">
              To be the most trusted AI-powered healthcare workforce platform in North America.
            </p>
          </div>
        </div>

        <div
          id="book-a-call"
          className="border-t md:border-t-0 md:border-l border-white/15 pt-8 md:pt-0 md:pl-6 min-w-0"
        >
          <div className="text-xl font-extrabold mb-2">
            Let&apos;s Build the Future of Healthcare&mdash;Together.
          </div>
          <div className="text-md text-white/60 space-y-2 mt-3">
            <div className="flex items-center gap-2">
              <Phone className="text-cyan shrink-0" size={15} strokeWidth={1.8} />
              (877) 844-CARE (2273)
            </div>
            <div className="flex items-center gap-2">
              <Mail className="text-cyan shrink-0" size={15} strokeWidth={1.8} />
              hello@vivante.care
            </div>
            <div className="flex items-center gap-2">
              <Globe className="text-cyan shrink-0" size={15} strokeWidth={1.8} />
              www.vivante.care
            </div>
          </div>
        </div>

        <div className="text-center md:justify-self-center">
          <div className="w-24 h-24 bg-white/10 border border-white/15 flex items-center justify-center">
            <QrCode className="text-white/60" size={44} strokeWidth={1.4} />
          </div>
          <div className="text-sm text-white/60 mt-1.5">Scan to connect</div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1320px] mx-auto px-6 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} VivanteCare. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/50">
            <Link to="/about" className="hover:text-white transition-colors">
              About Us
            </Link>
            <a href="#faqs" className="hover:text-white transition-colors">
              FAQs
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
