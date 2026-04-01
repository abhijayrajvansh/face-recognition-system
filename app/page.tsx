import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Face Recognition Attendance MVP</h1>
      <p className="text-sm text-gray-700">Use mock mode first (`USE_MOCK_FACE_ENGINE=true`) and the admin pages below.</p>
      <div className="flex flex-col gap-2">
        <Link className="rounded border p-3 hover:bg-gray-50" href="/attendance">
          Attendance Page
        </Link>
        <Link className="rounded border p-3 hover:bg-gray-50" href="/admin/users">
          Admin: Users
        </Link>
        <Link className="rounded border p-3 hover:bg-gray-50" href="/admin/sessions">
          Admin: Sessions
        </Link>
      </div>
    </main>
  );
}
