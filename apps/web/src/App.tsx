import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterOrgPage } from '@/pages/RegisterOrgPage';
import { RequireRole } from '@/components/RequireRole';

import { RequirementsPage } from '@/pages/org/RequirementsPage';
import { NewWorkforceRequestPage } from '@/pages/org/NewWorkforceRequestPage';
import { DraftRequestsPage } from '@/pages/org/DraftRequestsPage';
import { RequirementDetailPage } from '@/pages/org/RequirementDetailPage';
import { OrgShiftsPage } from '@/pages/org/OrgShiftsPage';
import { NewShiftPage } from '@/pages/org/NewShiftPage';
import { PassportVaultPage } from '@/pages/org/PassportVaultPage';
import { PassportDetailPage } from '@/pages/org/PassportDetailPage';
import { OrgVivanteIQPage } from '@/pages/org/OrgVivanteIQPage';
import { OrgSetupPage } from '@/pages/org/OrgSetupPage';

import { PassportPage } from '@/pages/worker/PassportPage';
import { JobMatchesPage } from '@/pages/worker/JobMatchesPage';
import { WorkerShiftsPage } from '@/pages/worker/WorkerShiftsPage';
import { WorkerVivanteIQPage } from '@/pages/worker/WorkerVivanteIQPage';

import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminCommandCenterPage } from '@/pages/admin/AdminCommandCenterPage';
import { AdminRequirementsPage } from '@/pages/admin/AdminRequirementsPage';
import { AdminInterviewsPage } from '@/pages/admin/AdminInterviewsPage';
import { AdminPassportsPage } from '@/pages/admin/AdminPassportsPage';
import { AdminShiftsPage } from '@/pages/admin/AdminShiftsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOrgPage />} />

      {/* Healthcare Org workflow */}
      <Route
        path="/org/requirements"
        element={
          <RequireRole role="org">
            <RequirementsPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/requirements/new"
        element={
          <RequireRole role="org">
            <NewWorkforceRequestPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/requirements/drafts"
        element={
          <RequireRole role="org">
            <DraftRequestsPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/requirements/:id"
        element={
          <RequireRole role="org">
            <RequirementDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/shifts"
        element={
          <RequireRole role="org">
            <OrgShiftsPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/shifts/new"
        element={
          <RequireRole role="org">
            <NewShiftPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/passport-vault"
        element={
          <RequireRole role="org">
            <PassportVaultPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/passport-vault/:id"
        element={
          <RequireRole role="org">
            <PassportDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/vivanteiq"
        element={
          <RequireRole role="org">
            <OrgVivanteIQPage />
          </RequireRole>
        }
      />
      <Route
        path="/org/setup"
        element={
          <RequireRole role="org">
            <OrgSetupPage />
          </RequireRole>
        }
      />

      {/* Healthcare Worker workflow */}
      <Route
        path="/worker/passport"
        element={
          <RequireRole role="worker">
            <PassportPage />
          </RequireRole>
        }
      />
      <Route
        path="/worker/matches"
        element={
          <RequireRole role="worker">
            <JobMatchesPage />
          </RequireRole>
        }
      />
      <Route
        path="/worker/shifts"
        element={
          <RequireRole role="worker">
            <WorkerShiftsPage />
          </RequireRole>
        }
      />
      <Route
        path="/worker/vivanteiq"
        element={
          <RequireRole role="worker">
            <WorkerVivanteIQPage />
          </RequireRole>
        }
      />

      {/* VivanteCare Admin — deliberately not linked from any nav */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route
        path="/admin/command-center"
        element={
          <RequireRole role="admin">
            <AdminCommandCenterPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/requirements"
        element={
          <RequireRole role="admin">
            <AdminRequirementsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/interviews"
        element={
          <RequireRole role="admin">
            <AdminInterviewsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/passports"
        element={
          <RequireRole role="admin">
            <AdminPassportsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/shifts"
        element={
          <RequireRole role="admin">
            <AdminShiftsPage />
          </RequireRole>
        }
      />
    </Routes>
  );
}
