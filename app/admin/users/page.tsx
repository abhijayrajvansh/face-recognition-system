"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AdminEmailInput from "@/components/AdminEmailInput";

type UserRow = {
  id: string;
  name: string;
  code: string;
  department: string;
  status: "active" | "inactive";
  enrollmentImageCount: number;
  enrollmentStatus: string;
};

const DEV_EMAIL_KEY = "face-mvp-admin-email";

const getStoredEmail = () => {
  if (typeof window === "undefined") {
    return "admin@example.com";
  }
  return localStorage.getItem(DEV_EMAIL_KEY) ?? "admin@example.com";
};

export default function AdminUsersPage() {
  const [adminEmail, setAdminEmail] = useState("admin@example.com");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("");

  const loadUsers = async (email: string) => {
    setError(null);
    const response = await fetch("/api/users", {
      headers: {
        "x-dev-email": email,
      },
    });

    const payload = await response.json();
    if (!payload.ok) {
      setError(payload.error?.message ?? "Failed to load users");
      return;
    }

    setUsers(payload.data.users as UserRow[]);
  };

  useEffect(() => {
    const email = getStoredEmail();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdminEmail(email);
    void loadUsers(email);
  }, []);

  const saveEmail = (email: string) => {
    setAdminEmail(email);
    localStorage.setItem(DEV_EMAIL_KEY, email);
    void loadUsers(email);
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dev-email": adminEmail,
      },
      body: JSON.stringify({ name, code, department }),
    });

    const payload = await response.json();
    if (!payload.ok) {
      setError(payload.error?.message ?? "Failed to create user");
      setCreating(false);
      return;
    }

    setName("");
    setCode("");
    setDepartment("");
    await loadUsers(adminEmail);
    setCreating(false);
  };

  const deleteUser = async (user: UserRow) => {
    const confirmed = window.confirm(`Delete user ${user.name} (${user.code})? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingUserId(user.id);
    setError(null);

    const response = await fetch(`/api/users/${user.id}`, {
      method: "DELETE",
      headers: {
        "x-dev-email": adminEmail,
      },
    });

    const payload = await response.json();
    if (!payload.ok) {
      setError(payload.error?.message ?? "Failed to delete user");
      setDeletingUserId(null);
      return;
    }

    await loadUsers(adminEmail);
    setDeletingUserId(null);
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Admin Users</h1>
      <AdminEmailInput value={adminEmail} onChange={saveEmail} />

      <form onSubmit={createUser} className="grid gap-2 rounded border p-4 md:grid-cols-4">
        <input className="rounded border px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input className="rounded border px-2 py-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (EMP001)" required />
        <input
          className="rounded border px-2 py-1"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Department"
          required
        />
        <button className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" disabled={creating}>
          {creating ? "Creating..." : "Create user"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Code</th>
              <th className="p-2">Department</th>
              <th className="p-2">Status</th>
              <th className="p-2">Enrollment</th>
              <th className="p-2">Open</th>
              <th className="p-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.code}</td>
                <td className="p-2">{user.department}</td>
                <td className="p-2">{user.status}</td>
                <td className="p-2">
                  {user.enrollmentImageCount} ({user.enrollmentStatus})
                </td>
                <td className="p-2">
                  <Link className="rounded border px-2 py-1" href={`/admin/users/${user.id}`}>
                    Open
                  </Link>
                </td>
                <td className="p-2">
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-1 text-red-700 disabled:opacity-50"
                    onClick={() => void deleteUser(user)}
                    disabled={deletingUserId === user.id}
                  >
                    {deletingUserId === user.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
