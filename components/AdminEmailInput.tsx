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
    <div className="panel p-3 md:p-4">
      <label htmlFor="admin-email" className="field-label block">
        Dev admin email
      </label>
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          id="admin-email"
          className="md:flex-1"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="admin@example.com"
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => onChange(draft.trim().toLowerCase())}
        >
          Save
        </button>
      </div>
    </div>
  );
}
