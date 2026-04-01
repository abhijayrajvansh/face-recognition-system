"use client";

import { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (email: string) => void;
};

export default function AdminEmailInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border p-3">
      <label htmlFor="admin-email" className="text-sm font-medium">
        Dev admin email
      </label>
      <input
        id="admin-email"
        className="min-w-72 rounded border px-2 py-1"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="admin@example.com"
      />
      <button
        type="button"
        className="rounded bg-black px-3 py-1 text-white"
        onClick={() => onChange(draft.trim().toLowerCase())}
      >
        Save
      </button>
    </div>
  );
}
