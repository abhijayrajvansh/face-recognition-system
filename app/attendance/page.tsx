"use client";

import { useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RecognizeResponse = {
  ok: boolean;
  data?: {
    status: "success" | "already_marked";
    message: string;
    record: {
      userName: string;
      userCode: string;
      confidence: number;
      markedAt: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

export default function AttendancePage() {
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<string>("Ready");
  const [recognizedPerson, setRecognizedPerson] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleCapture = async (file: File) => {
    if (!sessionId.trim()) {
      setStatus("Enter session ID first");
      setRecognizedPerson("");
      return;
    }

    setSubmitting(true);
    setStatus("Checking face...");
    setRecognizedPerson("");

    const form = new FormData();
    form.set("sessionId", sessionId.trim());
    form.set("image", file);

    const response = await fetch("/api/attendance/recognize", {
      method: "POST",
      body: form,
    });

    const payload = (await response.json()) as RecognizeResponse;
    if (!payload.ok || !payload.data) {
      setStatus(payload.error?.message ?? "Recognition failed");
      setRecognizedPerson("");
      setSubmitting(false);
      return;
    }

    setRecognizedPerson(`${payload.data.record.userName} (${payload.data.record.userCode})`);
    setStatus(`${payload.data.message} • confidence ${payload.data.record.confidence.toFixed(3)}`);
    setSubmitting(false);
  };

  return (
    <main className="flex w-full flex-1 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            placeholder="Session ID"
          />
          <div className="mx-auto w-full max-w-sm md:max-w-md">
            <CameraCapture onCapture={handleCapture} disabled={submitting} />
          </div>
          <Alert>
            <AlertDescription>Detected person: {recognizedPerson || "-"}</AlertDescription>
          </Alert>
          <Alert variant="default">
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </main>
  );
}
