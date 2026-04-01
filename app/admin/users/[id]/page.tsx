"use client";

import { FormEvent, useEffect, useState } from "react";

const DEV_EMAIL_KEY = "face-mvp-admin-email";

type PageProps = {
  params: Promise<{ id: string }>;
};

type User = {
  id: string;
  name: string;
  code: string;
  department: string;
  status: "active" | "inactive";
  comprefaceSubject: string;
  enrollmentImageCount: number;
  enrollmentStatus: string;
};

export default function UserDetailPage({ params }: PageProps) {
  const [userId, setUserId] = useState("");
  const [adminEmail, setAdminEmail] = useState("admin@example.com");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void params.then((p) => setUserId(p.id));
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdminEmail(localStorage.getItem(DEV_EMAIL_KEY) ?? "admin@example.com");
    }
  }, [params]);

  const load = async (id: string, email: string) => {
    const response = await fetch(`/api/users/${id}`, {
      headers: {
        "x-dev-email": email,
      },
    });
    const payload = await response.json();
    if (!payload.ok) {
      setMessage(payload.error?.message ?? "Failed to load user");
      return;
    }
    setUser(payload.data.user as User);
    setMessage("");
  };

  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load(userId, adminEmail);
    }
  }, [userId, adminEmail]);

  const toggleStatus = async () => {
    if (!user) return;
    const nextStatus = user.status === "active" ? "inactive" : "active";
    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-dev-email": adminEmail,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    const payload = await response.json();
    if (!payload.ok) {
      setMessage(payload.error?.message ?? "Failed to update user");
      return;
    }
    setUser(payload.data.user as User);
  };

  const onEnroll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const form = event.currentTarget;
    const input = form.elements.namedItem("images") as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      setMessage("Choose 1-5 images");
      return;
    }

    const body = new FormData();
    for (const file of Array.from(files)) {
      body.append("images", file);
    }

    setUploading(true);
    const response = await fetch(`/api/users/${user.id}/enroll`, {
      method: "POST",
      headers: {
        "x-dev-email": adminEmail,
      },
      body,
    });

    const payload = await response.json();
    if (!payload.ok) {
      setMessage(payload.error?.message ?? "Enrollment failed");
      setUploading(false);
      return;
    }

    setMessage(`Enrollment updated: ${payload.data.enrollmentImageCount} images`);
    form.reset();
    await load(user.id, adminEmail);
    setUploading(false);
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">User Detail</h1>
      {!user ? <p>Loading...</p> : null}

      {user ? (
        <div className="space-y-3 rounded border p-4">
          <p>
            <strong>{user.name}</strong> ({user.code})
          </p>
          <p>Department: {user.department}</p>
          <p>Status: {user.status}</p>
          <p>Subject: {user.comprefaceSubject}</p>
          <p>
            Enrollment: {user.enrollmentImageCount} images ({user.enrollmentStatus})
          </p>
          <button className="rounded bg-black px-3 py-1 text-white" onClick={toggleStatus}>
            Toggle status
          </button>
        </div>
      ) : null}

      <form onSubmit={onEnroll} className="space-y-2 rounded border p-4">
        <h2 className="font-medium">Upload enrollment images (1-5)</h2>
        <input name="images" type="file" multiple accept="image/*" required />
        <button className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload and enroll"}
        </button>
      </form>

      {message ? <p className="text-sm">{message}</p> : null}
    </main>
  );
}
