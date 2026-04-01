"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AdminEmailInput from "@/components/AdminEmailInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <main className="flex w-full flex-1 flex-col gap-4">
      <h2 className="text-xl font-semibold md:text-2xl">Admin Users</h2>
      <AdminEmailInput value={adminEmail} onChange={saveEmail} />

      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createUser} className="grid gap-2 md:grid-cols-4">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (EMP001)" required />
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" required />
            <Button className="w-full md:w-auto" disabled={creating}>
              {creating ? "Creating..." : "Create user"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3 md:hidden">
        {users.map((user) => (
          <Card key={user.id} size="sm">
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-base font-semibold">{user.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{user.code}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                <Badge variant="outline">
                  {user.enrollmentImageCount} ({user.enrollmentStatus})
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user.department}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/admin/users/${user.id}`}>Open</Link>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void deleteUser(user)}
                  disabled={deletingUserId === user.id}
                >
                  {deletingUserId === user.id ? "Deleting..." : "Delete"}
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
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="font-mono text-xs">{user.code}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.enrollmentImageCount} ({user.enrollmentStatus})
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/users/${user.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void deleteUser(user)}
                      disabled={deletingUserId === user.id}
                    >
                      {deletingUserId === user.id ? "Deleting..." : "Delete"}
                    </Button>
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
