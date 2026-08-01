import { useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Search } from 'lucide-react';
import { getVaultWithOwnPassport } from '@/lib/mockData';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useNow } from '@/hooks/useNow';

export function AdminPassportsPage() {
  const [query, setQuery] = useState('');
  const vault = useMemo(() => getVaultWithOwnPassport(), []);
  const { shiftRequests } = useScheduleStore();
  const now = useNow();

  const filtered = vault.filter((v) =>
    `${v.name} ${v.specialty} ${v.location}`.toLowerCase().includes(query.toLowerCase())
  );

  // Real, derived from shiftRequests — not a separate tracked field, so it
  // can't drift from what's actually assigned. Flips back to "Available"
  // the moment completeShift fires (WorkerShiftsPage's "Mark Shift
  // Complete" button).
  function statusFor(passportId: string): { label: string; className: string } {
    const active = shiftRequests.find(
      (s) => s.assignedPassportId === passportId && s.status === 'assigned' && Date.parse(`${s.endDate}T23:59:59Z`) >= now
    );
    if (active) {
      return {
        label: `On Assignment through ${new Date(active.endDate).toLocaleDateString()}`,
        className: 'text-navy',
      };
    }
    return { label: 'Available', className: 'text-teal' };
  }

  return (
    <AdminLayout hero={{ title: 'Passports', subtitle: 'Every VivantePassport in the system.' }}>
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, specialty, location…"
          className="w-full border border-charcoal/20 pl-9 pr-3 py-2.5 text-base outline-none focus:border-navy"
        />
      </div>

      <div className="border border-charcoal/15 overflow-hidden">
        <table className="w-full text-base">
          <thead className="bg-gray text-left">
            <tr>
              <th className="px-4 py-3 font-bold text-charcoal/70">Passport ID</th>
              <th className="px-4 py-3 font-bold text-charcoal/70">Name</th>
              <th className="px-4 py-3 font-bold text-charcoal/70">Specialty</th>
              <th className="px-4 py-3 font-bold text-charcoal/70">License Status</th>
              <th className="px-4 py-3 font-bold text-charcoal/70">Location</th>
              <th className="px-4 py-3 font-bold text-charcoal/70">Current Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const status = statusFor(v.id);
              return (
                <tr key={v.id} className="border-t border-charcoal/10 hover:bg-navy/[0.03]">
                  <td className="px-4 py-3 font-semibold text-teal">{v.id}</td>
                  <td className="px-4 py-3">{v.name}</td>
                  <td className="px-4 py-3">{v.specialty}</td>
                  <td className={`px-4 py-3 ${v.licenseStatus === 'Current' ? 'text-teal' : 'text-amber-600'}`}>
                    {v.licenseStatus}
                  </td>
                  <td className="px-4 py-3">{v.location}</td>
                  <td className={`px-4 py-3 font-semibold ${status.className}`}>{status.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
