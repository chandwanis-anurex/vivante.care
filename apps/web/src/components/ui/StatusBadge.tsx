import type { MatchStatus, ShiftStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_META: Record<MatchStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'border-teal/40 text-teal bg-teal/10' },
  more_info_required: {
    label: 'More Info Required',
    className: 'border-amber-400 text-amber-700 bg-amber-50',
  },
  invited_to_interview: {
    label: 'Invited to Interview',
    className: 'border-navy/40 text-navy bg-navy/10',
  },
  under_interview: {
    label: 'Under Interview',
    className: 'border-navy text-white bg-navy',
  },
  selected: {
    label: 'Selected',
    className: 'border-teal text-white bg-teal',
  },
  not_interested: {
    label: 'Not Interested',
    className: 'border-charcoal/20 text-charcoal/60 bg-charcoal/5',
  },
  archived: { label: 'Archived', className: 'border-charcoal/20 text-charcoal/50 bg-charcoal/5' },
  closed: { label: 'Closed', className: 'border-charcoal/20 text-charcoal/50 bg-charcoal/5' },
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

const SHIFT_STATUS_META: Record<ShiftStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'border-teal/40 text-teal bg-teal/10' },
  pending_assignment: {
    label: 'Pending Response',
    className: 'border-amber-400 text-amber-700 bg-amber-50',
  },
  assigned: { label: 'Assigned', className: 'border-navy text-white bg-navy' },
  complete: { label: 'Complete', className: 'border-charcoal/20 text-charcoal/50 bg-charcoal/5' },
};

export function ShiftStatusBadge({ status }: { status: ShiftStatus }) {
  const meta = SHIFT_STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}
