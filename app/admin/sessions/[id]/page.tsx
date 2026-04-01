"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <main className="flex w-full flex-1 flex-col gap-4">
      <h2 className="text-xl font-semibold md:text-2xl">Session Attendance</h2>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="text-sm">Session: {title || sessionId}</p>
          <p className="rounded-lg border bg-muted/30 p-3 text-sm">{message}</p>
          <Button className="w-full md:w-auto" variant="outline" onClick={() => void load(sessionId)}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <Card key={row.id} size="sm">
            <CardContent className="space-y-2">
              <p className="font-semibold">{row.userName}</p>
              <p className="font-mono text-xs text-muted-foreground">{row.userCode}</p>
              <p className="text-xs text-muted-foreground">{row.department}</p>
              <p className="text-xs">Confidence: {row.confidence.toFixed(3)}</p>
              <p className="text-xs text-muted-foreground">{new Date(row.markedAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Attendance Rows</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Marked At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.userName}</TableCell>
                  <TableCell className="font-mono text-xs">{row.userCode}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.confidence.toFixed(3)}</TableCell>
                  <TableCell>{new Date(row.markedAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
