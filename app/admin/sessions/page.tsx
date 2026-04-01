"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AdminEmailInput from "@/components/AdminEmailInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <main className="flex w-full flex-1 flex-col gap-4">
      <h2 className="text-xl font-semibold md:text-2xl">Admin Sessions</h2>
      <AdminEmailInput value={adminEmail} onChange={saveEmail} />

      <Card>
        <CardHeader>
          <CardTitle>Create Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-2 md:grid-cols-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
            <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" required />
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department (optional)" />
            <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" required />
            <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" required />
            <Button className="w-full md:w-auto">Create session</Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3 md:hidden">
        {sessions.map((session) => (
          <Card key={session.id} size="sm">
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-base font-semibold">{session.title}</p>
                <p className="font-mono text-xs text-muted-foreground break-all">{session.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={session.status === "active" ? "default" : "secondary"}>{session.status}</Badge>
                <Badge variant="outline">
                  {session.startTime} - {session.endTime}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{session.date}</p>
              <div className="grid grid-cols-3 gap-2">
                <Button type="button" variant="outline" onClick={() => void setStatus(session.id, "active")}>
                  Activate
                </Button>
                <Button type="button" variant="outline" onClick={() => void setStatus(session.id, "closed")}>
                  Close
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/admin/sessions/${session.id}`}>View</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="max-w-48 break-all font-mono text-xs">{session.id}</TableCell>
                  <TableCell>{session.title}</TableCell>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>
                    {session.startTime} - {session.endTime}
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.status === "active" ? "default" : "secondary"}>{session.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => void setStatus(session.id, "active")}>
                        Activate
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void setStatus(session.id, "closed")}>
                        Close
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/admin/sessions/${session.id}`}>View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
