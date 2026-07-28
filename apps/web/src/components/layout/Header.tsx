import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, clearSession } = useSession();

  const isLandingPage = location.pathname === '/';

  function handleLogout() {
    clearSession();
    navigate('/');
  }

  return (
    <header className="border-b border-navy/10 bg-white">
      <div className="pl-10 pr-6 md:pr-12 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 shrink-0">
          <img
            src="/images/vivantecare-logo.png"
            alt="Vivante.Care logo"
            className="w-[90px] h-[99px] object-contain shrink-0"
          />
          <div className="leading-none">
            <div className="text-[54px] font-extrabold leading-none">
              <span className="text-teal">Vivante</span>
              <span className="text-navy">.Care</span>
            </div>
            <div className="hidden sm:block text-[14px] font-bold tracking-[2px] text-muted mt-2">
              HEALTHCARE WORKFORCE INTELLIGENCE
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="text-md font-semibold text-charcoal border border-charcoal/20 px-4 py-2 hover:border-navy hover:text-navy transition-colors"
              >
                Logout
              </button>
            </>
          ) : isLandingPage ? (
            <>
              <a
                href="#see-for-yourself"
                className="hidden sm:inline-block text-md font-bold text-white bg-teal px-5 py-3 hover:bg-navy transition-colors"
              >
                See a Demo
              </a>
              <a
                href="#book-a-call"
                className="hidden sm:inline-block text-md font-bold text-white bg-navy px-5 py-3 hover:bg-teal transition-colors"
              >
                Book a Call
              </a>
              <Link to="/login" className="text-xl font-bold text-navy px-2 hover:text-teal transition-colors">
                Login
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="text-xl font-bold text-navy px-4 py-2 border border-navy hover:bg-navy hover:text-white transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
