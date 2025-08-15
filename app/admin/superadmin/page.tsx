"use client";

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";
import { PaginationWrapper } from "@/components/ui/PaginationWrapper";

const ConfirmationModal = lazy(() => import("@/components/admin/ConfirmationModal"));

interface User {
  id: string;
  email: string;
  role: string;
}

const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROTECTED_EMAIL = "m.abdullahx21@gmail.com";
const USERS_PER_PAGE = 10;

export default function SuperAdminPage() {
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [exceptions, setExceptions] = useState<string[]>([]);
  const [newException, setNewException] = useState("");

  const [loadingSettings, setLoadingSettings] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirm: () => void;
    confirmText?: string;
  }>({ open: false, title: "", description: "", confirm: () => {} });

  const isBusy = loadingSettings || loadingUsers;

  const totalPages = useMemo(() => Math.ceil(users.length / USERS_PER_PAGE), [users]);
  const paginatedUsers = useMemo(
    () => users.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE),
    [users, currentPage]
  );

  useEffect(() => {
    async function loadAll() {
      setLoadingSettings(true);
      setLoadingUsers(true);
      try {
        const [settingsRes, usersRes] = await Promise.all([
          fetch("/api/admin/superadmin/settings"),
          fetch("/api/admin/superadmin/users"),
        ]);

        if (!settingsRes.ok) throw new Error("Failed to fetch settings");
        if (!usersRes.ok) throw new Error("Failed to fetch users");

        const settingsData = await settingsRes.json();
        setAllowedDomains(settingsData.allowedDomains || []);
        setExceptions(settingsData.exceptionEmails || []);

        const usersData = await usersRes.json();
        setUsers(
          usersData.map((u: { _id?: string; id?: string; email: string; role: string }) => ({
            id: u._id || u.id!,
            email: u.email,
            role: u.role,
          }))
        );
      } catch {
        toast.error("Error loading data");
      } finally {
        setLoadingSettings(false);
        setLoadingUsers(false);
      }
    }

    loadAll();
  }, []);

  const confirmModalAction = useCallback(
    (title: string, description: string, confirm: () => void, confirmText = "Confirm") => {
      setModal({ open: true, title, description, confirm, confirmText });
    },
    []
  );

  const persistSettings = async (newDomains: string[], newExceptions: string[]) => {
    setLoadingSettings(true);
    try {
      const res = await fetch("/api/admin/superadmin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedDomains: newDomains, exceptionEmails: newExceptions }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
    } catch {
      toast.error("Error saving settings");
      return false;
    } finally {
      setLoadingSettings(false);
    }
    return true;
  };

  const addDomain = useCallback(() => {
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return toast.error("Domain cannot be empty");
    if (!domainRegex.test(trimmed)) return toast.error("Invalid domain format");
    if (allowedDomains.includes(trimmed)) return toast.error("Domain already added");

    confirmModalAction(
      "Add Domain",
      `Are you sure you want to allow users from "${trimmed}" to access the knowledge base?`,
      async () => {
        const newDomains = [...allowedDomains, trimmed];
        const success = await persistSettings(newDomains, exceptions);
        if (success) {
          setAllowedDomains(newDomains);
          setNewDomain("");
          setModal((m) => ({ ...m, open: false }));
          toast.success("Domain added successfully");
        }
      },
      "Add Domain"
    );
  }, [newDomain, allowedDomains, exceptions, confirmModalAction]);

  const removeDomain = useCallback(
    (domain: string) => {
      confirmModalAction(
        "Remove Domain",
        `Are you sure you want to remove "${domain}" from the allowed login domains?`,
        async () => {
          const newDomains = allowedDomains.filter((d) => d !== domain);
          const success = await persistSettings(newDomains, exceptions);
          if (success) {
            setAllowedDomains(newDomains);
            setModal((m) => ({ ...m, open: false }));
            toast.success("Domain removed successfully");
          }
        },
        "Remove"
      );
    },
    [allowedDomains, exceptions, confirmModalAction]
  );

  const addException = useCallback(() => {
    const trimmed = newException.trim().toLowerCase();
    if (!trimmed) return toast.error("Email cannot be empty");
    if (!emailRegex.test(trimmed)) return toast.error("Invalid email format");
    if (exceptions.includes(trimmed)) return toast.error("Email already added");

    confirmModalAction(
      "Add Exception",
      `Are you sure you want to grant "${trimmed}" full access?`,
      async () => {
        const newExceptions = [...exceptions, trimmed];
        const success = await persistSettings(allowedDomains, newExceptions);
        if (success) {
          setExceptions(newExceptions);
          setNewException("");
          setModal((m) => ({ ...m, open: false }));
          toast.success("Exception added successfully");
        }
      },
      "Add Exception"
    );
  }, [newException, exceptions, allowedDomains, confirmModalAction]);

  const removeException = useCallback(
    (email: string) => {
      if (email === PROTECTED_EMAIL) return toast.error("This email cannot be removed");

      confirmModalAction(
        "Remove Exception",
        `Are you sure you want to revoke access for "${email}"?`,
        async () => {
          const newExceptions = exceptions.filter((e) => e !== email);
          const success = await persistSettings(allowedDomains, newExceptions);
          if (success) {
            setExceptions(newExceptions);
            setModal((m) => ({ ...m, open: false }));
            toast.success("Exception removed successfully");
          }
        },
        "Remove"
      );
    },
    [exceptions, allowedDomains, confirmModalAction]
  );

  const changeUserRole = useCallback(
    async (userId: string, newRole: string) => {
      const oldUsers = [...users];
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

      try {
        const res = await fetch("/api/admin/superadmin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, newRole }),
        });
        if (!res.ok) throw new Error("Failed to update user role");
        toast.success("User role updated");
      } catch {
        toast.error("Error updating user role");
        setUsers(oldUsers);
      }
    },
    [users]
  );

  const handleDeleteUser = useCallback(
    (userId: string, email: string) => {
      if (email === PROTECTED_EMAIL) return toast.error("This user cannot be deleted.");

      confirmModalAction(
        "Delete User",
        `Are you sure you want to delete "${email}"?`,
        async () => {
          const prevUsers = [...users];
          setUsers(users.filter((u) => u.id !== userId));

          try {
            const res = await fetch(`/api/admin/superadmin/users/${userId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete user");
            toast.success("User deleted successfully");
          } catch {
            toast.error("Error deleting user");
            setUsers(prevUsers);
          } finally {
            setModal((m) => ({ ...m, open: false }));
          }
        },
        "Delete"
      );
    },
    [users, confirmModalAction]
  );

  const userRows = useMemo(
    () =>
      paginatedUsers.map(({ id, email, role }) => (
        <tr key={id} className="border-t hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[50px]">
          <td className="px-4 py-2">{email}</td>
          <td className="px-4 py-2 capitalize">{role}</td>
          <td className="px-4 py-2 text-center flex items-center justify-center gap-2">
            <select
              value={role}
              onChange={(e) => changeUserRole(id, e.target.value)}
              className="rounded border px-2 py-1 dark:bg-gray-800 dark:text-white min-h-[38px]"
              disabled={isBusy || email === PROTECTED_EMAIL}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>

            <button
              onClick={() => handleDeleteUser(id, email)}
              disabled={isBusy || email === PROTECTED_EMAIL}
              className={`px-2 py-1 rounded text-white text-sm ${
                email === PROTECTED_EMAIL ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
              }`}
              aria-label={`Delete user ${email}`}
            >
              Delete
            </button>
          </td>
        </tr>
      )),
    [paginatedUsers, isBusy, changeUserRole, handleDeleteUser]
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster position="top-center" />
      <Suspense fallback={<div>Loading modal...</div>}>
        <ConfirmationModal
          isOpen={modal.open}
          title={modal.title}
          description={modal.description}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onConfirm={modal.confirm}
          confirmText={modal.confirmText}
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        />
      </Suspense>

      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Super Admin Panel</h1>

      {/* Allowed Domains Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Allowed Login Domains</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Add domain (e.g. example.com)"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDomain()}
            className="flex-grow rounded border px-3 py-2 dark:bg-gray-800 dark:text-white min-h-[38px]"
            disabled={isBusy}
          />
          <button
            onClick={addDomain}
            disabled={isBusy}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {allowedDomains.map((domain) => (
            <li key={domain} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 rounded flex items-center gap-2">
              {domain}
              <button onClick={() => removeDomain(domain)} className="text-red-600 hover:text-red-800" disabled={isBusy}>
                &times;
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Exceptions Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Login Exceptions</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Add exception email"
            value={newException}
            onChange={(e) => setNewException(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addException()}
            className="flex-grow rounded border px-3 py-2 dark:bg-gray-800 dark:text-white min-h-[38px]"
            disabled={isBusy}
          />
          <button
            onClick={addException}
            disabled={isBusy}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {exceptions.map((email) => (
            <li key={email} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 rounded flex items-center gap-2">
              {email}
              <button
                onClick={() => removeException(email)}
                className={`${email === PROTECTED_EMAIL ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}`}
                disabled={isBusy || email === PROTECTED_EMAIL}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Users Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        {loadingUsers ? (
          <p>Loading users...</p>
        ) : (
          <>
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full table-auto text-left dark:text-white">
                <thead className="bg-gray-300 dark:bg-gray-700 text-sm">
                  <tr>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2 text-center">Change Role & Actions</th>
                  </tr>
                </thead>
                <tbody>{userRows}</tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <PaginationWrapper currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </>
        )}
      </section>
    </div>
  );
}
