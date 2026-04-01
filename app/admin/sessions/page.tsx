"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AdminEmailInput from "@/components/AdminEmailInput";

const DEV_EMAIL_KEY = "face-mvp-admin-email";

type Session = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "draft" | "active" | "closed";
  department: string | null;
};

export default function AdminSessionsPage() {
  const [adminEmail, setAdminEmail] = useState("admin@example.com");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [department, setDepartment] = useState("");

  const load = async (email: string) => {
    const response = await fetch("/api/sessions", {
      headers: {
        "x-dev-email": email,
      },
    });
    const payload = await response.json();
    if (!payload.ok) {
      setError(payload.error?.message ?? "Failed to load sessions");
      return;
    }
    setError(null);
    setSessions(payload.data.sessions as Session[]);
  };

  useEffect(() => {
    const email = localStorage.getItem(DEV_EMAIL_KEY) ?? "admin@example.com";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdminEmail(email);
    void load(email);
  }, []);

  const saveEmail = (email: string) => {
    setAdminEmail(email);
    localStorage.setItem(DEV_EMAIL_KEY, email);
    void load(email);
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dev-email": adminEmail,
      },
      body: JSON.stringify({
        title,
        date,
        startTime,
        endTime,
        department: department || null,
        status: "draft",
      }),
    });
    const payload = await response.json();
    if (!payload.ok) {
      setError(payload.error?.message ?? "Failed to create session");
      return;
    }

    setTitle("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setDepartment("");
    await load(adminEmail);
  };

  const setStatus = async (sessionId: string, status: Session["status"]) => {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-dev-email": adminEmail,
      },
      body: JSON.stringify({ status }),
    });

    const payload = await response.json();
    if (!payload.ok) {
      setError(payload.error?.message ?? "Failed to update session");
      return;
    }

    await load(adminEmail);
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Admin Sessions</h1>
      <AdminEmailInput value={adminEmail} onChange={saveEmail} />

      <form onSubmit={create} className="grid gap-2 rounded border p-4 md:grid-cols-3">
        <input className="rounded border px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
        <input className="rounded border px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} type="date" required />
        <input className="rounded border px-2 py-1" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department (optional)" />
        <input className="rounded border px-2 py-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" required />
        <input className="rounded border px-2 py-1" value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" required />
        <button className="rounded bg-black px-3 py-1 text-white">Create session</button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Session ID</th>
              <th className="p-2">Title</th>
              <th className="p-2">Date</th>
              <th className="p-2">Time</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-t">
                <td className="max-w-48 break-all p-2 font-mono text-xs">{session.id}</td>
                <td className="p-2">{session.title}</td>
                <td className="p-2">{session.date}</td>
                <td className="p-2">
                  {session.startTime} - {session.endTime}
                </td>
                <td className="p-2">{session.status}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded border px-2 py-1" onClick={() => setStatus(session.id, "active")}>
                      Activate
                    </button>
                    <button className="rounded border px-2 py-1" onClick={() => setStatus(session.id, "closed")}>
                      Close
                    </button>
                    <Link className="rounded border px-2 py-1" href={`/admin/sessions/${session.id}`}>
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
