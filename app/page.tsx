import Link from "next/link";

export default function Home() {
  return (
    <main className="flex w-full flex-1 flex-col gap-4">
      <section className="panel space-y-3 p-4 md:p-6">
        <h2 className="text-xl font-semibold md:text-2xl">Face Recognition Attendance</h2>
        <p className="text-sm text-slate-600">
          Mobile-first workflow for enrollment, session control, and live attendance capture.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Link className="panel p-4 transition hover:bg-slate-50" href="/attendance">
          <p className="text-sm font-semibold text-slate-900">Attendance</p>
          <p className="mt-1 text-xs text-slate-600">Capture face and mark attendance</p>
        </Link>
        <Link className="panel p-4 transition hover:bg-slate-50" href="/admin/users">
          <p className="text-sm font-semibold text-slate-900">Users</p>
          <p className="mt-1 text-xs text-slate-600">Create users and enroll face images</p>
        </Link>
        <Link className="panel p-4 transition hover:bg-slate-50" href="/admin/sessions">
          <p className="text-sm font-semibold text-slate-900">Sessions</p>
          <p className="mt-1 text-xs text-slate-600">Create and manage attendance sessions</p>
        </Link>
      </section>
    </main>
  );
}
