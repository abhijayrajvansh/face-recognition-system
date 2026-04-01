"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <main className="flex w-full flex-1 flex-col gap-4">
      <h2 className="text-xl font-semibold md:text-2xl">User Detail</h2>
      {!user ? <p>Loading...</p> : null}

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {user.name} <span className="font-mono text-sm text-muted-foreground">({user.code})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          <p>
            Department: <strong>{user.department}</strong>
          </p>
          <p>
            Status: <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
          </p>
          <p className="font-mono text-xs">Subject: {user.comprefaceSubject}</p>
          <p>
            Enrollment: {user.enrollmentImageCount} images ({user.enrollmentStatus})
          </p>
          <Button type="button" onClick={toggleStatus}>
            Toggle status
          </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Upload Enrollment Images (1-5)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onEnroll} className="space-y-3">
            <Input name="images" type="file" multiple accept="image/*" required />
            <Button className="w-full md:w-auto" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload and enroll"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {message ? <p className="text-sm">{message}</p> : null}
    </main>
  );
}
