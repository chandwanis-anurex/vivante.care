import { useMemo, useState } from 'react';
import { OrgLayout } from './OrgLayout';
import { Search } from 'lucide-react';
import { getVaultWithOwnPassport } from '@/lib/mockData';

export function PassportVaultPage() {
  const [query, setQuery] = useState('');
  const vault = useMemo(() => getVaultWithOwnPassport(), []);

  const filtered = vault.filter((v) =>
    `${v.name} ${v.specialty} ${v.location}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <OrgLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">Passport Vault</h1>
      <p className="text-base text-charcoal/60 mb-6">
        Saved VivantePassports stay current as workers update their profile.
      </p>

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
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-t border-charcoal/10 hover:bg-navy/[0.03]">
                <td className="px-4 py-3 font-semibold text-teal">{v.id}</td>
                <td className="px-4 py-3">{v.name}</td>
                <td className="px-4 py-3">{v.specialty}</td>
                <td className={`px-4 py-3 ${v.licenseStatus === 'Current' ? 'text-teal' : 'text-amber-600'}`}>
                  {v.licenseStatus}
                </td>
                <td className="px-4 py-3">{v.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OrgLayout>
  );
}
