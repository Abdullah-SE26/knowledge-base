"use client";

import React, { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  role: string;
}

export default function SuperAdminPage() {
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [exceptions, setExceptions] = useState<string[]>([]);
  const [newException, setNewException] = useState("");

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load settings and users on mount
  useEffect(() => {
    async function loadSettings() {
      setLoadingSettings(true);
      try {
        const res = await fetch("/api/admin/superadmin/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setAllowedDomains(data.allowedDomains || []);
        setExceptions(data.exceptionEmails || []);
      } catch (err) {
        alert("Error loading settings");
      } finally {
        setLoadingSettings(false);
      }
    }

    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/admin/superadmin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.map((u: any) => ({
          id: u._id || u.id,
          email: u.email,
          role: u.role,
        })));
      } catch (err) {
        alert("Error loading users");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadSettings();
    loadUsers();
  }, []);

  // Add/remove domains
  function addDomain() {
    const trimmed = newDomain.trim();
    if (trimmed && !allowedDomains.includes(trimmed)) {
      setAllowedDomains([...allowedDomains, trimmed]);
      setNewDomain("");
    }
  }
  function removeDomain(domain: string) {
    setAllowedDomains(allowedDomains.filter((d) => d !== domain));
  }

  // Add/remove exceptions
  function addException() {
    const trimmed = newException.trim();
    if (trimmed && !exceptions.includes(trimmed)) {
      setExceptions([...exceptions, trimmed]);
      setNewException("");
    }
  }
  function removeException(email: string) {
    setExceptions(exceptions.filter((e) => e !== email));
  }

  // Save settings (allowedDomains + exceptions) to backend
  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/superadmin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedDomains,
          exceptionEmails: exceptions,
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      alert("Settings saved successfully");
    } catch (err) {
      alert("Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  }

  // Update user role optimistically and send update to backend
  async function changeUserRole(userId: string, newRole: string) {
    setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));

    try {
      const res = await fetch("/api/admin/superadmin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      if (!res.ok) throw new Error("Failed to update user role");
    } catch (err) {
      alert("Error updating user role");
      // Optionally reload users or revert UI change here
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-gray-100">
        Super Admin Panel
      </h1>

      {/* Allowed Domains */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Allowed Login Domains</h2>
        {loadingSettings ? (
          <p>Loading settings...</p>
        ) : (
          <>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                placeholder="Add domain (e.g. example.com)"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-grow rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={addDomain}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {allowedDomains.map((domain) => (
                <div
                  key={domain}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded flex items-center space-x-2"
                >
                  <span>{domain}</span>
                  <button
                    onClick={() => removeDomain(domain)}
                    className="text-red-600 hover:text-red-800"
                    aria-label={`Remove domain ${domain}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Exceptions */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Login Exceptions (Emails)</h2>
        {loadingSettings ? (
          <p>Loading settings...</p>
        ) : (
          <>
            <div className="flex space-x-2 mb-4">
              <input
                type="email"
                placeholder="Add exception email"
                value={newException}
                onChange={(e) => setNewException(e.target.value)}
                className="flex-grow rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={addException}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {exceptions.map((email) => (
                <div
                  key={email}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded flex items-center space-x-2"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => removeException(email)}
                    className="text-red-600 hover:text-red-800"
                    aria-label={`Remove exception ${email}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Save Settings Button */}
      <div className="mb-12">
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {savingSettings ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* User Management */}
      <section>
        <h2 className="text-xl font-semibold mb-4">User Management</h2>

        {loadingUsers ? (
          <p>Loading users...</p>
        ) : (
          <table className="w-full border-collapse table-auto dark:text-white">
            <thead>
              <tr className="bg-gray-300 dark:bg-gray-700">
                <th className="border px-4 py-2 text-left">Email</th>
                <th className="border px-4 py-2 text-left">Role</th>
                <th className="border px-4 py-2">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(({ id, email, role }) => (
                <tr key={id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                  <td className="border px-4 py-2">{email}</td>
                  <td className="border px-4 py-2">{role}</td>
                  <td className="border px-4 py-2 text-center space-x-2">
                    <select
                      value={role}
                      onChange={(e) => changeUserRole(id, e.target.value)}
                      className="rounded border px-2 py-1 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
