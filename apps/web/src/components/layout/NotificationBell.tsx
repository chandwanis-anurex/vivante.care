import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { session } = useSession();
  const { notifications, markNotificationRead } = useScheduleStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!session) return null;

  const mine = notifications.filter((n) => n.audience === session.role);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-charcoal/70 hover:text-navy transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-teal text-white text-[10px] font-bold min-w-[16px] h-4 px-0.5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-charcoal/15 shadow-lg z-50 max-h-96 overflow-y-auto">
            {mine.length === 0 ? (
              <p className="text-sm text-charcoal/50 p-4 text-center">No notifications yet.</p>
            ) : (
              mine.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-charcoal/10 last:border-0 hover:bg-navy/[0.03]',
                    !n.read && 'bg-teal/[0.05]'
                  )}
                >
                  <div className="text-sm text-charcoal">{n.message}</div>
                  <div className="text-xs text-charcoal/40 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
