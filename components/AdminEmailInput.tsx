"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
    <Card className="p-3 md:p-4">
      <label htmlFor="admin-email" className="field-label block">
        Dev admin email
      </label>
      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          id="admin-email"
          className="md:flex-1"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="admin@example.com"
        />
        <Button type="button" onClick={() => onChange(draft.trim().toLowerCase())}>
          Save
        </Button>
      </div>
    </Card>
  );
}
