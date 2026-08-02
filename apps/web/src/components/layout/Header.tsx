import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'What is VivanteCare?', href: '/#how-it-works' },
  { label: 'Schedule a Demo', href: '/#book-a-call' },
  { label: 'Call Us', href: 'tel:+18778442273' },
];

export function Header() {
  const navigate = useNavigate();
  const { session, clearSession } = useSession();

  function handleLogout() {
    clearSession();
    navigate('/');
  }

  return (
    <header className="border-b border-navy/10 bg-white">
      <div className="pl-10 pr-6 md:pr-12 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center shrink-0">
          <img
            src="/images/vivante-care-icon.svg"
            alt="Vivante.Care"
            className="sm:hidden h-10 w-10 object-contain"
          />
          <img
            src="/images/vivante-care-logo.svg"
            alt="Vivante.Care — Healthcare Workforce Intelligence"
            className="hidden sm:block h-20 w-auto object-contain"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-md font-semibold text-charcoal/80 hover:text-teal transition-colors whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {session ? (
            <>
              <span className="hidden sm:inline text-md font-semibold text-charcoal/70">
                Signed in as {session.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-md font-semibold text-charcoal border border-charcoal/20 px-4 py-2 hover:border-navy hover:text-navy transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-md font-bold text-white bg-navy px-5 py-3 hover:bg-teal transition-colors"
            >
              Login Now
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
