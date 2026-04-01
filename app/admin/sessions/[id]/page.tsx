"use client";

import { useEffect, useState } from "react";

const DEV_EMAIL_KEY = "face-mvp-admin-email";

type PageProps = {
  params: Promise<{ id: string }>;
};

type AttendanceRow = {
  id: string;
  userName: string;
  userCode: string;
  department: string;
  confidence: number;
  markedAt: string;
};

export default function SessionAttendancePage({ params }: PageProps) {
  const [sessionId, setSessionId] = useState("");
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("Loading...");

  const load = async (id: string) => {
    const email = localStorage.getItem(DEV_EMAIL_KEY) ?? "admin@example.com";
    const response = await fetch(`/api/sessions/${id}/attendance`, {
      headers: {
        "x-dev-email": email,
      },
    });

    const payload = await response.json();
    if (!payload.ok) {
      setMessage(payload.error?.message ?? "Failed to load attendance");
      return;
    }

    setTitle(payload.data.session.title as string);
    setRows(payload.data.rows as AttendanceRow[]);
    setMessage(`Total marked: ${payload.data.totalMarked}`);
  };

  useEffect(() => {
    void params.then((p) => {
      setSessionId(p.id);
      void load(p.id);
    });
  }, [params]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Session Attendance</h1>
      <p className="text-sm">Session: {title || sessionId}</p>
      <p className="rounded border bg-gray-50 p-3 text-sm">{message}</p>

      <button className="w-fit rounded border px-3 py-1" onClick={() => void load(sessionId)}>
        Refresh
      </button>

      <div className="overflow-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">User</th>
              <th className="p-2">Code</th>
              <th className="p-2">Department</th>
              <th className="p-2">Confidence</th>
              <th className="p-2">Marked At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.userName}</td>
                <td className="p-2">{row.userCode}</td>
                <td className="p-2">{row.department}</td>
                <td className="p-2">{row.confidence.toFixed(3)}</td>
                <td className="p-2">{new Date(row.markedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
