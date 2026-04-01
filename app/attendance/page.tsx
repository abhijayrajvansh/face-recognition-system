"use client";

import { useState } from "react";
import CameraCapture from "@/components/CameraCapture";

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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <input
        className="rounded border px-3 py-2"
        value={sessionId}
        onChange={(event) => setSessionId(event.target.value)}
        placeholder="Session ID"
      />
      <CameraCapture onCapture={handleCapture} disabled={submitting} />
      <p className="rounded border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-900">
        Detected person: {recognizedPerson || "-"}
      </p>
      <p className="rounded border bg-gray-50 p-3 text-sm">{status}</p>
    </main>
  );
}
