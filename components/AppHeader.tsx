"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/attendance", label: "Attendance" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sessions", label: "Sessions" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="panel p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight md:text-xl">Face Attendance</h1>
        <Button
          type="button"
          variant="outline"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>

      <nav className={cn("mt-3 grid gap-2 md:hidden", open ? "grid" : "hidden")}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition",
              isActive(item.href)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="mt-1 hidden items-center justify-end gap-1 md:flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition",
              isActive(item.href) ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
