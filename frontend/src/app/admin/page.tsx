'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchAdminUsers,
  fetchCurrentUser,
  getApiErrorMessage,
  updateUserRole,
  updateUserStatus,
  type AdminUser,
  type SessionUser,
} from '@/lib/api';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    Promise.all([fetchAdminUsers(), fetchCurrentUser()])
      .then(([result, signedInUser]) => {
        if (active) {
          setUsers(result);
          setCurrentUser(signedInUser);
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (typeof loadError === 'object' && loadError !== null && 'response' in loadError) {
          const res = (loadError as { response?: { status?: number } }).response;
          if (res?.status === 401) {
            router.push('/login?redirect=/admin');
            return;
          }
        }
        setError(getApiErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const setStatus = async (user: AdminUser) => {
    const status = user.status === 'active' ? 'deactivated' : 'active';
    setUpdatingId(user._id);
    setError('');
    try {
      const updated = await updateUserStatus(user._id, status);
      setUsers((current) => current.map((item) => (item._id === user._id ? updated : item)));
    } catch (updateError: unknown) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setUpdatingId('');
    }
  };

  const setRole = async (user: AdminUser, role: AdminUser['role']) => {
    setUpdatingId(user._id);
    setError('');
    try {
      const updated = await updateUserRole(user._id, role);
      setUsers((current) => current.map((item) => (item._id === user._id ? updated : item)));
    } catch (updateError: unknown) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      {/* Page Header */}
      <div className="cp-masthead flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#bcd8c9] bg-[#e6f0e9] px-2.5 py-0.5 text-xs font-semibold text-[#0f4a3d] mb-2">
            <ShieldCheck className="h-3 w-3" />
            <span>Internal Administration</span>
          </div>
          <h1 className="font-head">
            User Account Management
          </h1>
          <p className="mt-1 text-sm text-[#62594e]">
            Review registered accounts, role entitlements, and operational status.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-xs sm:text-sm text-[#b91c1c]"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-[#b91c1c]" />
          <div>
            <strong className="font-semibold">Administration alert: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="cp-card p-12 text-center text-sm text-[#62594e]">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0f4a3d] border-t-transparent mb-3" />
          <p>Loading user directories…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="cp-card p-10 text-center text-sm text-[#62594e]">
          No user accounts found.
        </div>
      ) : (
        <div className="cp-card overflow-hidden">
          <div className="overflow-x-auto" role="region" aria-label="User accounts" tabIndex={0}>
            <table className="w-full text-left text-xs sm:text-sm">
              <caption className="sr-only">User accounts and roles</caption>
              <thead>
                <tr className="border-b border-[#e4dccb] bg-[#f6f1e7] text-xs font-semibold text-[#62594e] uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">User Account</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Role Entitlement</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Account Status</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efe8d8]">
                {users.map((user) => {
                  const canManageAccount =
                    currentUser?.role === 'SUPER_ADMIN' || user.role === 'USER';
                  return (
                    <tr key={user._id} className="hover:bg-[#f6f1e7] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-[#172033]">
                        {user.email}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        {currentUser?.role === 'SUPER_ADMIN' ? (
                          <select
                            aria-label={`Role for ${user.email}`}
                            className="cp-input py-1 px-2 text-xs w-auto font-medium"
                            disabled={updatingId === user._id}
                            value={user.role}
                            onChange={(event) =>
                              setRole(user, event.target.value as AdminUser['role'])
                            }
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              user.role === 'SUPER_ADMIN'
                                ? 'bg-[#e6f0e9] text-[#0f4a3d]'
                                : user.role === 'ADMIN'
                                ? 'bg-[#f6eaf2] text-[#7a3b69]'
                                : 'bg-[#efe8d8] text-[#62594e]'
                            }`}
                          >
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.status === 'active'
                              ? 'bg-[#ecfdf5] text-[#0f6b53]'
                              : 'bg-[#fef2f2] text-[#b91c1c]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.status === 'active' ? 'bg-[#0f6b53]' : 'bg-[#dc2626]'
                            }`}
                          />
                          <span className="capitalize">{user.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {canManageAccount ? (
                          <button
                            type="button"
                            className={`rounded px-3 py-2 text-xs font-medium transition-colors ${
                              user.status === 'active'
                                ? 'text-[#b91c1c] hover:bg-[#fef2f2]'
                                : 'text-[#0f6b53] hover:bg-[#ecfdf5]'
                            }`}
                            disabled={updatingId === user._id}
                            onClick={() => setStatus(user)}
                          >
                            {updatingId === user._id
                              ? 'Saving…'
                              : user.status === 'active'
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        ) : (
                          <span className="text-xs text-[#62594e]">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
